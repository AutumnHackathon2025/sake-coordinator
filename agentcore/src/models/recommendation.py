"""推薦結果データモデル"""

from pydantic import BaseModel, Field, validator


class Recommendation(BaseModel):
    """推薦結果モデル"""

    brand: str = Field(..., min_length=1, max_length=64, description="銘柄名")
    score: int = Field(..., ge=1, le=5, description="おすすめ度合い（1-5）")
    reason: str = Field(..., min_length=1, max_length=500, description="推薦理由")

    @validator("brand")
    def validate_brand(cls, v):
        """銘柄名のバリデーション"""
        if not v.strip():
            raise ValueError("銘柄名は必須です")
        return v.strip()

    @validator("reason")
    def validate_reason(cls, v):
        """推薦理由のバリデーション"""
        if not v.strip():
            raise ValueError("推薦理由は必須です")
        return v.strip()


class RecommendationResponse(BaseModel):
    """推薦レスポンスモデル"""

    user_id: str = Field(..., description="ユーザーID")
    recommendations: list[Recommendation] = Field(..., description="推薦リスト")
    total_count: int = Field(..., description="推薦総数")

    @validator("recommendations")
    def validate_recommendations(cls, v):
        """推薦リストのバリデーション"""
        # 空のリストは許可（飲酒履歴0件の場合）
        if len(v) > 10:
            raise ValueError("推薦は最大10件までです")
        return v
