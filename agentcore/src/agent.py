"""メインエージェント"""

import asyncio
from typing import Dict, Any
import structlog
from strands import Context

from .agents import SakeRecommendationAgent
from .models import Menu
from .utils.logging import setup_logging
from .utils.config import get_config

# ログ設定をセットアップ
setup_logging()
logger = structlog.get_logger(__name__)


async def main():
    """メイン関数"""
    logger.info("日本酒推薦エージェントを開始")
    
    try:
        # 設定を読み込み
        config = get_config()
        logger.info("設定を読み込み", config=config.dict())
        
        # エージェントを初期化
        agent = SakeRecommendationAgent()
        
        # コンテキストを作成
        context = Context()
        
        # テスト用の推薦実行
        test_user_id = "test_user_001"
        test_menu = Menu(sake_names=["獺祭 純米大吟醸", "久保田 萬寿", "十四代 本丸"])
        
        logger.info("テスト推薦を実行", user_id=test_user_id)
        
        # 推薦を実行
        recommendations = await agent.recommend_sake(
            context=context,
            user_id=test_user_id,
            menu=test_menu,
            max_recommendations=3
        )
        
        logger.info("推薦結果", recommendations=recommendations.dict())
        
        # 味の好み分析を実行
        taste_analysis = await agent.analyze_taste_preference(
            context=context,
            user_id=test_user_id
        )
        
        logger.info("味の好み分析結果", analysis=taste_analysis)
        
    except Exception as e:
        logger.error("エージェント実行でエラーが発生", error=str(e))
        raise


if __name__ == "__main__":
    asyncio.run(main())