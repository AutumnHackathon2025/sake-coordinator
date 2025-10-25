"""飲酒記録データモデル"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, validator


class Rating(str, Enum):
    """評価レベル"""

    VERY_GOOD = "非常に好き"
    GOOD = "好き"
    BAD = "合わない"
    VERY_BAD = "非常に合わない"


class DrinkingRecord(BaseModel):
    """飲酒記録モデル"""

    id: str | None = Field(None, description="記録ID")
    user_id: str = Field(..., description="ユーザーID", alias="userId")
    brand: str = Field(..., min_length=1, max_length=64, description="銘柄名")
    impression: str = Field(..., min_length=1, max_length=1000, description="味の感想")
    rating: Rating = Field(..., description="評価")
    label_image_url: str | None = Field(None, description="ラベル画像URL", alias="labelImageUrl")
    created_at: datetime | None = Field(None, description="作成日時", alias="createdAt")
    updated_at: datetime | None = Field(None, description="更新日時", alias="updatedAt")

    @validator("brand")
    def validate_brand(cls, v):
        """銘柄名のバリデーション"""
        if not v.strip():
            raise ValueError("銘柄名は必須です")
        return v.strip()

    @validator("impression")
    def validate_impression(cls, v):
        """味の感想のバリデーション"""
        if not v.strip():
            raise ValueError("味の感想は必須です")
        return v.strip()

    class Config:
        """Pydantic設定"""

        use_enum_values = True
        populate_by_name = True  # エイリアスとフィールド名の両方を受け入れる
        json_encoders = {datetime: lambda v: v.isoformat()}
