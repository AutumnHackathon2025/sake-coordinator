"""データモデル定義"""

from .drinking_record import DrinkingRecord, Rating
from .menu import Menu
from .recommendation import BestRecommendation, Recommendation, RecommendationResponse

__all__ = [
    "DrinkingRecord",
    "Rating",
    "BestRecommendation",
    "Recommendation",
    "RecommendationResponse",
    "Menu",
]
