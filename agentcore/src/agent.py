"""メインエージェント - Amazon Bedrock AgentCore Runtime統合（マルチエージェント構成）"""

import structlog
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands.models.bedrock import BedrockModel

from .models import Menu, RecommendationResponse
from .services.recommendation_service import RecommendationService
from .services.drinking_record_service import DrinkingRecordService
from .utils.logging import setup_logging
from .utils.config import get_config

# ログ設定をセットアップ
setup_logging()
logger = structlog.get_logger(__name__)

# AgentCore Appを初期化
app = BedrockAgentCoreApp()

# サービスインスタンスをグローバルに保持
recommendation_service = RecommendationService()
drinking_record_service = DrinkingRecordService()


class SakeRecommendationAgent:
    """日本酒推薦エージェント

    ユーザーの飲酒履歴とメニューに基づいて日本酒を推薦する専門エージェント
    """

    def __init__(self, model: BedrockModel):
        self.agent = Agent(
            model=model,
            system_prompt="""あなたは日本酒推薦の専門家です。
ユーザーの飲酒履歴と味の好みを分析し、最適な日本酒を推薦してください。
推薦する際は、以下の情報を含めてください：
- 銘柄名
- おすすめ度合い（1-5）
- 推薦理由（なぜこの日本酒がユーザーに合うのか）

ユーザーの過去の評価や感想を考慮し、パーソナライズされた推薦を行ってください。""",
        )
        logger.info("日本酒推薦エージェントを初期化")

    async def recommend(
        self, 
        user_id: str, 
        drinking_records_data: list[dict],
        menu_brands: list[str] = None, 
        max_recommendations: int = 10
    ) -> dict:
        """日本酒を推薦

        Args:
            user_id: ユーザーID
            drinking_records_data: 飲酒記録データのリスト
            menu_brands: メニューの銘柄リスト（任意）
            max_recommendations: 最大推薦数（互換性のため保持、実際は使用されない）

        Returns:
            推薦結果の辞書
        """
        logger.info(
            "日本酒推薦を開始", user_id=user_id, max_recommendations=max_recommendations
        )

        try:
            # メニューオブジェクトを作成（任意）
            menu = None
            if menu_brands:
                menu = Menu(brands=menu_brands)

            # 飲酒記録データをパース
            drinking_records = await drinking_record_service.parse_records(
                drinking_records_data
            )
            logger.info(
                "飲酒履歴をパース", user_id=user_id, record_count=len(drinking_records)
            )

            # 推薦を生成（RecommendationResponseを直接取得）
            recommendation_response = await recommendation_service.generate_recommendations(
                user_id=user_id,
                drinking_records=drinking_records,
                menu=menu,
                max_recommendations=max_recommendations,
            )

            logger.info(
                "日本酒推薦を完了",
                user_id=user_id,
                has_best_recommend=recommendation_response.best_recommend is not None,
                recommendation_count=len(recommendation_response.recommendations),
            )
            return recommendation_response.dict()

        except Exception as e:
            logger.error(
                "日本酒推薦でエラーが発生", user_id=user_id, error=str(e), exc_info=True
            )
            raise


class TasteAnalysisAgent:
    """味の好み分析エージェント

    ユーザーの飲酒履歴から味の好みを分析する専門エージェント
    """

    def __init__(self, model: BedrockModel):
        self.agent = Agent(
            model=model,
            system_prompt="""あなたは日本酒の味覚分析の専門家です。
ユーザーの飲酒履歴から味の好みを詳細に分析してください。
分析結果には以下を含めてください：
- 好む味の特徴（甘口/辛口、フルーティー/芳醇など）
- 避けるべき味の特徴
- 評価の傾向
- 好みの要約（200文字以内）

データに基づいた客観的な分析を心がけてください。""",
        )
        logger.info("味の好み分析エージェントを初期化")

    async def analyze(self, user_id: str, drinking_records_data: list[dict]) -> dict:
        """味の好みを分析

        Args:
            user_id: ユーザーID
            drinking_records_data: 飲酒記録データのリスト

        Returns:
            分析結果の辞書
        """
        logger.info("味の好み分析を開始", user_id=user_id)

        try:
            # 飲酒記録データをパース
            drinking_records = await drinking_record_service.parse_records(
                drinking_records_data
            )
            logger.info(
                "飲酒履歴をパース", user_id=user_id, record_count=len(drinking_records)
            )

            # 味の好み分析を実行
            analysis = await recommendation_service.analyze_taste_preference(
                user_id=user_id, drinking_records=drinking_records
            )

            logger.info("味の好み分析を完了", user_id=user_id)
            return analysis

        except Exception as e:
            logger.error(
                "味の好み分析でエラーが発生", user_id=user_id, error=str(e), exc_info=True
            )
            raise


class AgentRouter:
    """エージェントルーター

    typeフィールドに基づいて適切な専門エージェントにリクエストをルーティングする
    """

    def __init__(self, model: BedrockModel):
        self.recommendation_agent = SakeRecommendationAgent(model)
        self.taste_analysis_agent = TasteAnalysisAgent(model)
        logger.info("エージェントルーターを初期化")

    async def route(self, request_type: str, params: dict) -> dict:
        """リクエストを適切なエージェントにルーティング

        Args:
            request_type: リクエストタイプ（"recommendation" または "taste_analysis"）
            params: エージェントに渡すパラメータ

        Returns:
            処理結果

        Raises:
            ValueError: 不正なrequest_typeの場合
        """
        logger.info("リクエストをルーティング", request_type=request_type, params=params)

        if request_type == "recommendation":
            # 日本酒推薦エージェントを呼び出し
            user_id = params.get("user_id")
            if not user_id:
                return {"error": "推薦にはuser_idが必要です"}

            drinking_records_data = params.get("drinking_records", [])
            if not drinking_records_data:
                return {"error": "推薦にはdrinking_recordsが必要です"}

            logger.info("日本酒推薦エージェントを呼び出し", user_id=user_id)
            result = await self.recommendation_agent.recommend(
                user_id=user_id,
                drinking_records_data=drinking_records_data,
                menu_brands=params.get("menu_brands"),
                max_recommendations=params.get("max_recommendations", 10),
            )
            return result

        elif request_type == "taste_analysis":
            # 味の好み分析エージェントを呼び出し
            user_id = params.get("user_id")
            if not user_id:
                return {"error": "分析にはuser_idが必要です"}

            drinking_records_data = params.get("drinking_records", [])
            if not drinking_records_data:
                return {"error": "分析にはdrinking_recordsが必要です"}

            logger.info("味の好み分析エージェントを呼び出し", user_id=user_id)
            result = await self.taste_analysis_agent.analyze(
                user_id=user_id,
                drinking_records_data=drinking_records_data
            )
            return result

        else:
            error_msg = f"不正なリクエストタイプです: {request_type}。'recommendation' または 'taste_analysis' を指定してください。"
            logger.error("不正なリクエストタイプ", request_type=request_type)
            return {"error": error_msg}


def create_router() -> AgentRouter:
    """エージェントルーターを作成

    Returns:
        設定済みのエージェントルーター
    """
    config = get_config()
    logger.info(
        "エージェントルーターを作成",
        environment=config.environment,
        bedrock_model_id=config.bedrock_model_id,
        max_recommendations=config.max_recommendations,
    )

    model = BedrockModel(
        model_id=config.bedrock_model_id,
    )

    return AgentRouter(model)


# グローバルルーターインスタンス
router = create_router()


@app.entrypoint
async def invoke(payload: dict) -> dict:
    """AgentCore Runtimeエントリーポイント

    Args:
        payload: リクエストペイロード
            - type: リクエストタイプ（必須）
                - "recommendation": 日本酒推薦
                - "taste_analysis": 味の好み分析
            - user_id: ユーザーID（必須）
            - drinking_records: 飲酒記録データのリスト（必須）
            - menu_brands: メニュー銘柄リスト（推薦時のみ、オプション）
            - max_recommendations: 最大推薦数（推薦時のみ、オプション、デフォルト: 10）

    Returns:
        エージェントの応答

    Examples:
        推薦リクエスト:
        {
            "type": "recommendation",
            "user_id": "test_user_001",
            "drinking_records": [
                {
                    "id": "rec_001",
                    "user_id": "test_user_001",
                    "brand": "獺祭",
                    "impression": "フルーティーで飲みやすい",
                    "rating": "非常に好き",
                    "created_at": "2025-01-01T00:00:00Z"
                }
            ],
            "menu_brands": ["獺祭", "久保田", "十四代"],
            "max_recommendations": 3
        }

        分析リクエスト:
        {
            "type": "taste_analysis",
            "user_id": "test_user_001",
            "drinking_records": [
                {
                    "id": "rec_001",
                    "user_id": "test_user_001",
                    "brand": "獺祭",
                    "impression": "フルーティーで飲みやすい",
                    "rating": "非常に好き",
                    "created_at": "2025-01-01T00:00:00Z"
                }
            ]
        }
    """
    logger.info("エージェント呼び出しを受信", payload=payload)

    try:
        # typeフィールドを取得
        request_type = payload.get("type")
        if not request_type:
            return {
                "error": "typeが必要です。'recommendation' または 'taste_analysis' を指定してください。"
            }

        # パラメータを構築
        params = {
            "user_id": payload.get("user_id"),
            "drinking_records": payload.get("drinking_records", []),
            "menu_brands": payload.get("menu_brands"),
            "max_recommendations": payload.get("max_recommendations", 10),
        }

        # ルーターでエージェントに振り分け
        result = await router.route(request_type, params)

        logger.info("エージェント応答を返却", request_type=request_type)
        return {"result": result}

    except Exception as e:
        logger.error("エージェント実行でエラーが発生", error=str(e), exc_info=True)
        return {"error": f"エージェント処理に失敗しました: {str(e)}"}


def main():
    """メインエントリーポイント"""
    logger.info("日本酒推薦エージェントを起動")
    app.run()


if __name__ == "__main__":
    # ローカル実行時はAgentCore Appを起動
    main()