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
            List[Recommendation]: 推薦リスト
        """
        logger.info(
            "推薦生成を開始", user_id=user_id, record_count=len(drinking_records)
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
        """推薦プロンプトを構築"""

        prompt = f"""あなたは日本酒の専門家です。ユーザーの飲酒履歴と味の好みに基づいて、最適な日本酒を推薦してください。

## ユーザーの味の好み分析
{taste_analysis.get('analysis_summary', '分析データなし')}

## 飲酒履歴（最新10件）
"""

        # 最新の飲酒履歴を追加
        recent_records = drinking_records[-10:] if drinking_records else []
        for record in recent_records:
            prompt += f"- {record.brand}: {record.rating} - {record.impression}\n"

        if menu and menu.brands:
            prompt += "\n## 利用可能なメニュー\n"
            for brand in menu.brands:
                prompt += f"- {brand}\n"
            prompt += "\n上記のメニューから選択して推薦してください。\n"

        prompt += f"""
## 推薦要件
- 最大{max_recommendations}件の推薦を生成
- 各推薦には以下を含める：
  - 銘柄名（1-64文字）
  - おすすめ度合い（1-5の数値、5が最高）
  - 推薦理由（1-500文字、なぜこの銘柄がユーザーに合うかを具体的に説明）

## 出力形式（JSON）
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
        """推薦レスポンスをパース"""
        # TODO: JSONパースの実装
        # 現在は仮の実装
        return [
            Recommendation(
                brand="獺祭 純米大吟醸",
                score=5,
                reason="フルーティで上品な味わいが、あなたの好みに合うと思います。",
            )
        ]

    def _parse_taste_analysis(
        self, response: str, drinking_records: list[DrinkingRecord]
    ) -> dict[str, Any]:
        """味の好み分析レスポンスをパース"""
        # TODO: JSONパースの実装
        # 現在は仮の実装
        rating_distribution = {}
        for record in drinking_records:
            rating_distribution[record.rating] = (
                rating_distribution.get(record.rating, 0) + 1
            )

        return {
            "preferred_tastes": ["フルーティ", "上品"],
            "disliked_tastes": ["辛口", "重い"],
            "rating_distribution": rating_distribution,
            "analysis_summary": "フルーティで上品な味わいを好む傾向があります。",
        }
