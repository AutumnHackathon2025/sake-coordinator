"""推薦サービス"""

from typing import Any

import structlog

from ..models import DrinkingRecord, Menu, Recommendation, BestRecommendation, RecommendationResponse
from .bedrock_service import BedrockService

logger = structlog.get_logger(__name__)


class RecommendationService:
    """日本酒推薦サービス"""

    def __init__(self):
        self.bedrock_service = BedrockService()

    async def generate_recommendations(
        self,
        user_id: str,
        drinking_records: list[DrinkingRecord],
        menu: Menu | None = None,
        max_recommendations: int = 5,
    ) -> RecommendationResponse:
        """推薦を生成

        Args:
            user_id: ユーザーID
            drinking_records: 飲酒履歴
            menu: メニュー情報
            max_recommendations: 最大推薦数（未使用、互換性のため保持）

        Returns:
            RecommendationResponse: 推薦レスポンス（best_recommend + recommendations最大9件）
        """
        logger.info(
            "推薦生成を開始", user_id=user_id, record_count=len(drinking_records)
        )

        # 飲酒履歴0件の場合は空の推薦レスポンスを返す（エラーではない）
        if not drinking_records:
            logger.info(
                "飲酒履歴が0件のため、空の推薦レスポンスを返します", user_id=user_id
            )
            return RecommendationResponse(
                best_recommend=None,
                recommendations=[],
                metadata="飲酒記録がありません。まずは飲んだお酒を記録してください"
            )

        # 味の好み分析
        taste_analysis = await self.analyze_taste_preference(user_id, drinking_records)

        # 推薦プロンプトを構築
        prompt = self._build_recommendation_prompt(
            drinking_records=drinking_records,
            taste_analysis=taste_analysis,
            menu=menu,
            max_recommendations=max_recommendations,
        )

        # Bedrockで推薦を生成
        response = await self.bedrock_service.generate_text(prompt)

        # レスポンスをパース
        recommendation_response = self._parse_recommendations(response)

        logger.info(
            "推薦生成を完了", 
            user_id=user_id, 
            has_best_recommend=recommendation_response.best_recommend is not None,
            recommendation_count=len(recommendation_response.recommendations)
        )
        return recommendation_response

    async def analyze_taste_preference(
        self, user_id: str, drinking_records: list[DrinkingRecord]
    ) -> dict[str, Any]:
        """味の好み分析

        Args:
            user_id: ユーザーID
            drinking_records: 飲酒履歴

        Returns:
            Dict[str, Any]: 味の好み分析結果
        """
        if not drinking_records:
            return {
                "preferred_tastes": [],
                "disliked_tastes": [],
                "rating_distribution": {},
                "analysis_summary": "飲酒履歴がないため、分析できません。",
            }

        # 評価別に分類
        from ..models import Rating

        liked_records = [
            r
            for r in drinking_records
            if r.rating in [Rating.VERY_GOOD.value, Rating.GOOD.value]
        ]
        disliked_records = [
            r
            for r in drinking_records
            if r.rating in [Rating.BAD.value, Rating.VERY_BAD.value]
        ]

        # 味の好み分析プロンプトを構築
        prompt = self._build_taste_analysis_prompt(liked_records, disliked_records)

        # Bedrockで分析を実行
        response = await self.bedrock_service.generate_text(prompt)

        # 分析結果をパース
        analysis = self._parse_taste_analysis(response, drinking_records)

        return analysis

    def _build_recommendation_prompt(
        self,
        drinking_records: list[DrinkingRecord],
        taste_analysis: dict[str, Any],
        menu: Menu | None,
        max_recommendations: int,
    ) -> str:
        """推薦プロンプトを構築
        
        Args:
            drinking_records: 飲酒履歴
            taste_analysis: 味の好み分析結果
            menu: メニュー情報（任意）
            max_recommendations: 最大推薦数
            
        Returns:
            str: 推薦生成用プロンプト
        """

        prompt = """あなたは日本酒の専門家です。ユーザーの飲酒履歴と味の好みに基づいて、最適な日本酒を推薦してください。

## ユーザーの味の好み分析
"""
        
        # 好み分析の詳細を追加
        prompt += f"要約: {taste_analysis.get('analysis_summary', '分析データなし')}\n"
        
        preferred_tastes = taste_analysis.get('preferred_tastes', [])
        if preferred_tastes:
            prompt += f"好む味の特徴: {', '.join(preferred_tastes)}\n"
        
        disliked_tastes = taste_analysis.get('disliked_tastes', [])
        if disliked_tastes:
            prompt += f"避けるべき味の特徴: {', '.join(disliked_tastes)}\n"

        prompt += "\n## 飲酒履歴（最新10件）\n"

        # 最新の飲酒履歴を追加
        recent_records = drinking_records[-10:] if drinking_records else []
        if recent_records:
            for record in recent_records:
                prompt += f"- {record.brand}: {record.rating} - {record.impression}\n"
        else:
            prompt += "（飲酒履歴なし）\n"

        # メニュー制約の説明文を準備
        menu_constraint = ""
        if menu and menu.brands:
            prompt += "\n## 利用可能なメニュー\n"
            for brand in menu.brands:
                prompt += f"- {brand}\n"
            menu_constraint = """
### 【最重要】銘柄選択の制約
**メニュー制約**: 推薦するすべての銘柄（best_recommendとrecommendations）は、
上記の「利用可能なメニュー」に記載されている銘柄から**必ず**選択してください。
メニュー外の銘柄は絶対に推薦しないでください。
"""
        else:
            menu_constraint = """
### 銘柄選択
メニューが提供されていないため、日本酒の専門知識に基づいて、
ユーザーの好みに合う適切な銘柄を推薦してください。
"""

        prompt += f"""
## 推薦要件
{menu_constraint}

### 推薦の構成
推薦は以下の構成で提供してください：

1. **best_recommend**: ユーザーの好みに最も合致する1件（カテゴリーなし）
   - マッチ度の目安: 90以上
   - ユーザーの過去の高評価銘柄と類似した特徴を持つ
   - 確実に満足できる安定した選択肢
   - {'**メニュー内の銘柄から必ず選択すること**' if menu and menu.brands else ''}

2. **recommendations**: 残りの推薦（最大9件、各銘柄に動的なカテゴリー）
   - ユーザーの好みを広げる選択肢や新しい味覚体験への挑戦
   - 各推薦には推薦理由や特徴を表現する簡潔なカテゴリー名を付与
   - マッチ度の高い順に並べる
   - {'**すべての推薦をメニュー内の銘柄から必ず選択すること**' if menu and menu.brands else ''}

### カテゴリー生成ルール
recommendationsの各銘柄には、推薦理由や特徴を表現する簡潔なカテゴリー名を付けてください：
- **文字数**: 1-10文字以内（必須）
- **内容**: 推薦理由や特徴を簡潔に表現する日本語の文言
- **例**: 「新しい挑戦」「好みに近い」「意外な発見」「冒険の一杯」「安定の選択」「華やかな香り」「すっきり辛口」
- **注意**: best_recommendにはカテゴリーを含めないでください

### 出力要件
- best_recommend: 1件（カテゴリーなし）
- recommendations: 最大9件（各銘柄に動的なカテゴリー）
- 各推薦には以下を含めてください：
  - brand: 銘柄名（1-64文字）
  - brand_description: 銘柄の一般的な説明（1-50文字、簡潔に）
    * その銘柄の一般的に知られている客観的な特徴を説明してください
    * ユーザーの飲酒履歴に依存せず、日本酒の専門知識として正しい情報を記載してください
    * 味わい（甘口/辛口、濃醇/淡麗など）、香り（吟醸香、果実香など）、製法（純米、大吟醸など）、産地などの一般的な情報を含めてください
    * 例: 「山形の芳醇な純米大吟醸」「すっきり辛口の新潟淡麗」「華やかな吟醸香の兵庫の名酒」
  - expected_experience: 期待される体験（1-50文字）
    * 「このお酒を飲みたい！」という気持ちを高める魅力的な表現にしてください
    * ユーザーの語彙レベルに合わせ、専門用語を避けた分かりやすい日常的な言葉で表現してください
    * ユーザーの飲酒履歴から使われている表現やトーンを参考にして、親しみやすい言葉遣いを心がけてください
    * brand_descriptionの一般的な特徴とcategoryの推薦理由を踏まえて、ユーザーが体験できる感覚や感動を具体的に描写してください
    * 難しい専門用語（例: 吟醸香、芳醇、淡麗など）は使わず、誰でも理解できる表現を使ってください
    * 良い例: 「華やかな香りが口いっぱいに広がります」「すっきりした後味で爽快な気分に」「深い味わいで満足感たっぷり」
    * 避けるべき例: 「吟醸香が鼻腔を刺激」「芳醇な旨味が口中に滞留」「淡麗辛口の余韻」
  - match_score: マッチ度（1-100の整数）
  - category: カテゴリー（1-10文字、recommendationsのみ、best_recommendには不要）

### 一貫性の確保
各推薦において、category、brand_description、expected_experienceは矛盾なく連携させてください：
- **category**: ユーザーの飲酒履歴に基づく推薦の切り口や理由（例: 「新しい挑戦」「好みに近い」）
- **brand_description**: その銘柄の一般的な客観的特徴（ユーザーの履歴に依存しない日本酒の専門知識）
  * 例: 「山形の芳醇な純米大吟醸」「新潟の淡麗辛口」「華やかな吟醸香の兵庫の名酒」
- **expected_experience**: categoryとbrand_descriptionを組み合わせた魅力的な体験（ユーザーにわかりやすい言葉で）
  * ユーザーの語彙に寄せた、親しみやすく理解しやすい表現を使用
  * 例: category「新しい挑戦」+ brand_description「山形の芳醇な純米大吟醸」→「深い味わいが新しい発見をもたらします」
  * 例: category「華やかな香り」+ brand_description「兵庫県産の吟醸香豊かな純米大吟醸」→「華やかな香りに包まれる贅沢な時間」

具体例（ユーザーにわかりやすい表現）：
- category: 「華やかな香り」
- brand_description: 「兵庫県産の吟醸香豊かな純米大吟醸」
- expected_experience: 「華やかな香りが楽しめる贅沢な一杯です」

## 出力形式
以下のJSON形式で出力してください。他のテキストは含めないでください：

{{
  "best_recommend": {{
    "brand": "銘柄名",
    "brand_description": "銘柄の説明",
    "expected_experience": "期待される体験",
    "match_score": 95
  }},
  "recommendations": [
    {{
      "brand": "銘柄名1",
      "brand_description": "銘柄の説明",
      "expected_experience": "期待される体験",
      "category": "新しい挑戦",
      "match_score": 88
    }},
    {{
      "brand": "銘柄名2",
      "brand_description": "銘柄の説明",
      "expected_experience": "期待される体験",
      "category": "好みに近い",
      "match_score": 85
    }},
    {{
      "brand": "銘柄名3",
      "brand_description": "銘柄の説明",
      "expected_experience": "期待される体験",
      "category": "意外な発見",
      "match_score": 82
    }}
    // ... 最大9件まで
  ]
}}
"""

        return prompt

    def _build_taste_analysis_prompt(
        self,
        liked_records: list[DrinkingRecord],
        disliked_records: list[DrinkingRecord],
    ) -> str:
        """味の好み分析プロンプトを構築"""

        prompt = """あなたは日本酒の専門家です。ユーザーの飲酒履歴から味の好みを分析してください。

## 好きな日本酒の記録
"""

        for record in liked_records:
            prompt += f"- {record.brand} ({record.rating}): {record.impression}\n"

        prompt += "\n## 合わなかった日本酒の記録\n"

        for record in disliked_records:
            prompt += f"- {record.brand} ({record.rating}): {record.impression}\n"

        prompt += """
## 分析要件
ユーザーの味の好みを以下の観点で分析してください：
- 好む味の特徴（甘口/辛口、フルーティ/スッキリなど）
- 避けるべき味の特徴
- 好みの傾向の要約

## 出力形式（JSON）
{
  "preferred_tastes": ["好む味の特徴のリスト"],
  "disliked_tastes": ["避けるべき味の特徴のリスト"],
  "analysis_summary": "味の好みの要約（200文字以内）"
}
"""

        return prompt

    def _parse_recommendations(self, response: str) -> RecommendationResponse:
        """推薦レスポンスをパース
        
        Args:
            response: BedrockからのJSONレスポンス
            
        Returns:
            RecommendationResponse: パースされた推薦レスポンス（best_recommend + recommendations最大9件）
        """
        import json
        
        try:
            # JSONレスポンスをパース
            # マークダウンのコードブロックを除去
            response_clean = response.strip()
            if response_clean.startswith("```"):
                # ```json ... ``` の形式の場合
                lines = response_clean.split("\n")
                response_clean = "\n".join(lines[1:-1])
            
            data = json.loads(response_clean)
            
            # best_recommendをパース
            best_recommend = None
            best_recommend_data = data.get("best_recommend")
            if best_recommend_data:
                try:
                    best_recommend = BestRecommendation(
                        brand=best_recommend_data.get("brand", ""),
                        brand_description=best_recommend_data.get("brand_description", ""),
                        expected_experience=best_recommend_data.get("expected_experience", ""),
                        match_score=best_recommend_data.get("match_score", 0),
                    )
                    logger.info("best_recommendのパースに成功", brand=best_recommend.brand)
                except Exception as e:
                    logger.warning("best_recommendのパースに失敗", error=str(e), data=best_recommend_data)
            
            # recommendationsをパース
            recommendations_data = data.get("recommendations", [])
            
            if not isinstance(recommendations_data, list):
                logger.warning("推薦データがリスト形式ではありません")
                recommendations_data = []
            
            recommendations = []
            for item in recommendations_data:
                try:
                    # 必須フィールドの取得
                    brand = item.get("brand", "")
                    brand_description = item.get("brand_description", "")
                    expected_experience = item.get("expected_experience", "")
                    category = item.get("category", "")
                    match_score = item.get("match_score", 0)
                    
                    # バリデーション: 銘柄名（1-64文字）
                    if not brand or len(brand) > 64:
                        logger.warning("銘柄名が不正", brand=brand)
                        continue
                    
                    # バリデーション: 銘柄説明（1-50文字）
                    if not brand_description or len(brand_description) > 50:
                        logger.warning("銘柄説明が不正", brand_description_length=len(brand_description) if brand_description else 0)
                        # 50文字を超える場合は切り詰める
                        if brand_description and len(brand_description) > 50:
                            brand_description = brand_description[:47] + "..."
                        elif not brand_description:
                            continue
                    
                    # バリデーション: 期待される体験（1-50文字）
                    if not expected_experience or len(expected_experience) > 50:
                        logger.warning("期待される体験が不正", expected_experience_length=len(expected_experience) if expected_experience else 0)
                        # 50文字を超える場合は切り詰める
                        if expected_experience and len(expected_experience) > 50:
                            expected_experience = expected_experience[:47] + "..."
                        elif not expected_experience:
                            continue
                    
                    # バリデーション: カテゴリー（1-10文字）
                    if not category or len(category) < 1 or len(category) > 10:
                        logger.warning(
                            "カテゴリーが範囲外です。デフォルト値を設定します",
                            category=category,
                            category_length=len(category) if category else 0
                        )
                        # デフォルトカテゴリーを設定
                        category = "おすすめ"
                    
                    # バリデーション: マッチ度（1-100の範囲）
                    if not isinstance(match_score, int) or match_score < 1 or match_score > 100:
                        logger.warning("マッチ度が不正", match_score=match_score)
                        continue
                    
                    # Recommendationモデルに変換
                    recommendation = Recommendation(
                        brand=brand,
                        brand_description=brand_description,
                        expected_experience=expected_experience,
                        category=category,
                        match_score=match_score,
                    )
                    recommendations.append(recommendation)
                    
                except Exception as e:
                    logger.warning("推薦アイテムのパースに失敗", error=str(e), item=item)
                    continue
            
            # マッチ度の高い順にソート
            recommendations.sort(key=lambda x: x.match_score, reverse=True)
            
            # 最大9件に制限（best_recommend 1件 + recommendations 9件 = 合計10件）
            recommendations = recommendations[:9]
            
            logger.info(
                "推薦結果のパースに成功", 
                has_best_recommend=best_recommend is not None,
                recommendation_count=len(recommendations)
            )
            
            return RecommendationResponse(
                best_recommend=best_recommend,
                recommendations=recommendations
            )
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.error("推薦レスポンスのパースに失敗", error=str(e), response=response[:200])
            return RecommendationResponse(
                best_recommend=None,
                recommendations=[]
            )

    def _parse_taste_analysis(
        self, response: str, drinking_records: list[DrinkingRecord]
    ) -> dict[str, Any]:
        """味の好み分析レスポンスをパース
        
        Args:
            response: BedrockからのJSONレスポンス
            drinking_records: 飲酒履歴
            
        Returns:
            Dict[str, Any]: 分析結果（preferred_tastes, disliked_tastes, rating_distribution, analysis_summary）
        """
        import json
        
        # 評価の分布を計算
        rating_distribution = {}
        for record in drinking_records:
            rating_distribution[record.rating] = (
                rating_distribution.get(record.rating, 0) + 1
            )
        
        try:
            # JSONレスポンスをパース
            # マークダウンのコードブロックを除去
            response_clean = response.strip()
            if response_clean.startswith("```"):
                # ```json ... ``` の形式の場合
                lines = response_clean.split("\n")
                response_clean = "\n".join(lines[1:-1])
            
            analysis_data = json.loads(response_clean)
            
            # 必須フィールドの検証
            preferred_tastes = analysis_data.get("preferred_tastes", [])
            disliked_tastes = analysis_data.get("disliked_tastes", [])
            analysis_summary = analysis_data.get("analysis_summary", "")
            
            # 文字数制限のバリデーション（要約は200文字以内）
            if len(analysis_summary) > 200:
                analysis_summary = analysis_summary[:197] + "..."
            
            return {
                "preferred_tastes": preferred_tastes,
                "disliked_tastes": disliked_tastes,
                "rating_distribution": rating_distribution,
                "analysis_summary": analysis_summary,
            }
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.warning("味の好み分析のパースに失敗", error=str(e), response=response[:200])
            # フォールバック: 基本的な分析を返す
            return {
                "preferred_tastes": [],
                "disliked_tastes": [],
                "rating_distribution": rating_distribution,
                "analysis_summary": "味の好みを分析中です。",
            }
