"""データモデル定義"""

from .drinking_record import DrinkingRecord, Rating
from .menu import Menu
from .recommendation import Recommendation

__all__ = ["DrinkingRecord", "Rating", "Recommendation", "Menu"]
