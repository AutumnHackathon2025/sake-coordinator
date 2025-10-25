"""日本酒推薦エージェント"""

import asyncio
from typing import List, Optional
import structlog
from strands import Agent, Context

from ..models import DrinkingRecord, Recommendation, RecommendationResponse, Menu
from ..services.recommendation_service import RecommendationService
from ..services.drinking_record_service import DrinkingRecordService

logger = structlog.get_logger(__name__)


class SakeRecommendationAgent(Agent):
    """日本酒推薦エージェント
    
    ユーザーの飲酒履歴と味の好みに基づいて、
    最適な日本酒を推薦するエージェント
    """
    
    def __init__(self):
        super().__init__()
        self.recommendation_service = RecommendationService()
        self.drinking_record_service = DrinkingRecordService()
    
    async def recommend_sake(
        self, 
        context: Context,
        user_id: str,
        menu: Optional[Menu] = None,
        max_recommendations: int = 5
    ) -> RecommendationResponse:
        """日本酒推薦を実行
        
        Args:
            context: Strandsコンテキスト
            user_id: ユーザーID
            menu: メニュー情報（任意）
            max_recommendations: 最大推薦数
            
        Returns:
            RecommendationResponse: 推薦結果
        """
        logger.info("日本酒推薦を開始", user_id=user_id, max_recommendations=max_recommendations)
        
        try:
            # ユーザーの飲酒履歴を取得
            drinking_records = await self.drinking_record_service.get_user_records(user_id)
            logger.info("飲酒履歴を取得", user_id=user_id, record_count=len(drinking_records))
            
            # 推薦を生成
            recommendations = await self.recommendation_service.generate_recommendations(
                user_id=user_id,
                drinking_records=drinking_records,
                menu=menu,
                max_recommendations=max_recommendations
            )
            
            response = RecommendationResponse(
                user_id=user_id,
                recommendations=recommendations,
                total_count=len(recommendations)
            )
            
            logger.info("日本酒推薦を完了", user_id=user_id, recommendation_count=len(recommendations))
            return response
            
        except Exception as e:
            logger.error("日本酒推薦でエラーが発生", user_id=user_id, error=str(e))
            raise
    
    async def analyze_taste_preference(
        self,
        context: Context,
        user_id: str
    ) -> dict:
        """味の好み分析
        
        Args:
            context: Strandsコンテキスト
            user_id: ユーザーID
            
        Returns:
            dict: 味の好み分析結果
        """
        logger.info("味の好み分析を開始", user_id=user_id)
        
        try:
            # ユーザーの飲酒履歴を取得
            drinking_records = await self.drinking_record_service.get_user_records(user_id)
            
            # 味の好み分析を実行
            analysis = await self.recommendation_service.analyze_taste_preference(
                user_id=user_id,
                drinking_records=drinking_records
            )
            
            logger.info("味の好み分析を完了", user_id=user_id)
            return analysis
            
        except Exception as e:
            logger.error("味の好み分析でエラーが発生", user_id=user_id, error=str(e))
            raise