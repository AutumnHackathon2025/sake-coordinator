"""推薦サービス"""

from typing import Any

import structlog

from ..models import DrinkingRecord, Menu, Recommendation
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
    ) -> list[Recommendation]:
        """推薦を生成

        Args:
            user_id: ユーザーID
            drinking_records: 飲酒履歴
            menu: メニュー情報
            max_recommendations: 最大推薦数

        Returns:
            List[Recommendation]: 推薦リスト（飲酒履歴0件の場合は空リスト）
        """
        logger.info(
            "推薦生成を開始", user_id=user_id, record_count=len(drinking_records)
        )

        # 飲酒履歴0件の場合は空の推薦リストを返す（エラーではない）
        if not drinking_records:
            logger.info(
                "飲酒履歴が0件のため、空の推薦リストを返します", user_id=user_id
            )
            return []

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
        recommendations = self._parse_recommendations(response)

        logger.info(
            "推薦生成を完了", user_id=user_id, recommendation_count=len(recommendations)
        )
        return recommendations[:max_recommendations]

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

        if menu and menu.brands:
            prompt += "\n## 利用可能なメニュー\n"
            for brand in menu.brands:
                prompt += f"- {brand}\n"
            prompt += "\n**重要**: 上記のメニューから選択して推薦してください。メニューにない銘柄は推薦しないでください。\n"

        prompt += f"""
## 推薦要件
- 最大{max_recommendations}件の推薦を生成してください
- 各推薦には以下を含めてください：
  - brand: 銘柄名（1-64文字）
  - score: おすすめ度合い（1-5の整数、5が最高）
  - reason: 推薦理由（1-500文字、ユーザーの過去の感想との関連性を含めて具体的に説明）
- スコアの高い順に並べてください
- ユーザーの好みに合わない銘柄は推薦しないでください

## 出力形式
以下のJSON形式で出力してください。他のテキストは含めないでください：

{{
  "recommendations": [
    {{
      "brand": "銘柄名",
      "score": 5,
      "reason": "推薦理由"
    }}
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

    def _parse_recommendations(self, response: str) -> list[Recommendation]:
        """推薦レスポンスをパース
        
        Args:
            response: BedrockからのJSONレスポンス
            
        Returns:
            List[Recommendation]: パースされた推薦リスト（スコアの高い順）
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
            
            # recommendationsフィールドを取得
            recommendations_data = data.get("recommendations", [])
            
            if not isinstance(recommendations_data, list):
                logger.warning("推薦データがリスト形式ではありません")
                return []
            
            recommendations = []
            for item in recommendations_data:
                try:
                    # 必須フィールドの取得
                    brand = item.get("brand", "")
                    score = item.get("score", 0)
                    reason = item.get("reason", "")
                    
                    # バリデーション: 銘柄名（1-64文字）
                    if not brand or len(brand) > 64:
                        logger.warning("銘柄名が不正", brand=brand)
                        continue
                    
                    # バリデーション: スコア（1-5の範囲）
                    if not isinstance(score, int) or score < 1 or score > 5:
                        logger.warning("スコアが不正", score=score)
                        continue
                    
                    # バリデーション: 推薦理由（1-500文字）
                    if not reason or len(reason) > 500:
                        logger.warning("推薦理由が不正", reason_length=len(reason))
                        # 500文字を超える場合は切り詰める
                        if len(reason) > 500:
                            reason = reason[:497] + "..."
                        elif not reason:
                            continue
                    
                    # Recommendationモデルに変換
                    recommendation = Recommendation(
                        brand=brand,
                        score=score,
                        reason=reason,
                    )
                    recommendations.append(recommendation)
                    
                except Exception as e:
                    logger.warning("推薦アイテムのパースに失敗", error=str(e), item=item)
                    continue
            
            # スコアの高い順にソート
            recommendations.sort(key=lambda x: x.score, reverse=True)
            
            logger.info("推薦結果のパースに成功", count=len(recommendations))
            return recommendations
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.error("推薦レスポンスのパースに失敗", error=str(e), response=response[:200])
            return []

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
