"""推薦結果データモデル"""

from typing import Optional
from pydantic import BaseModel, Field, validator


class BestRecommendation(BaseModel):
    """最優先推薦モデル（鉄板マッチ）"""

    brand: str = Field(..., min_length=1, max_length=64, description="銘柄名")
    brand_description: str = Field(
        ..., min_length=1, max_length=50, description="銘柄の説明"
    )
    expected_experience: str = Field(
        ..., min_length=1, max_length=50, description="期待される体験"
    )
    match_score: int = Field(..., ge=1, le=100, description="マッチ度（1-100）")

    @validator("brand")
    def validate_brand(cls, v):
        """銘柄名のバリデーション"""
        if not v.strip():
            raise ValueError("銘柄名は必須です")
        if len(v.strip()) > 64:
            raise ValueError("銘柄名は64文字以内で入力してください")
        return v.strip()

    @validator("brand_description")
    def validate_brand_description(cls, v):
        """銘柄説明のバリデーション"""
        if not v.strip():
            raise ValueError("銘柄の説明は必須です")
        if len(v.strip()) > 50:
            raise ValueError("銘柄の説明は50文字以内で入力してください")
        return v.strip()

    @validator("expected_experience")
    def validate_expected_experience(cls, v):
        """期待される体験のバリデーション"""
        if not v.strip():
            raise ValueError("期待される体験は必須です")
        if len(v.strip()) > 50:
            raise ValueError("期待される体験は50文字以内で入力してください")
        return v.strip()

    @validator("match_score")
    def validate_match_score(cls, v):
        """マッチ度のバリデーション"""
        if v < 1 or v > 100:
            raise ValueError("マッチ度は1から100の範囲で指定してください")
        return v


class Recommendation(BaseModel):
    """推薦結果モデル（動的カテゴリー）"""

    brand: str = Field(..., min_length=1, max_length=64, description="銘柄名")
    brand_description: str = Field(
        ..., min_length=1, max_length=50, description="銘柄の説明"
    )
    expected_experience: str = Field(
        ..., min_length=1, max_length=50, description="期待される体験"
    )
    category: str = Field(..., min_length=1, max_length=10, description="カテゴリー（動的生成、1-10文字）")
    match_score: int = Field(..., ge=1, le=100, description="マッチ度（1-100）")

    @validator("brand")
    def validate_brand(cls, v):
        """銘柄名のバリデーション"""
        if not v.strip():
            raise ValueError("銘柄名は必須です")
        if len(v.strip()) > 64:
            raise ValueError("銘柄名は64文字以内で入力してください")
        return v.strip()

    @validator("brand_description")
    def validate_brand_description(cls, v):
        """銘柄説明のバリデーション"""
        if not v.strip():
            raise ValueError("銘柄の説明は必須です")
        if len(v.strip()) > 50:
            raise ValueError("銘柄の説明は50文字以内で入力してください")
        return v.strip()

    @validator("expected_experience")
    def validate_expected_experience(cls, v):
        """期待される体験のバリデーション"""
        if not v.strip():
            raise ValueError("期待される体験は必須です")
        if len(v.strip()) > 50:
            raise ValueError("期待される体験は50文字以内で入力してください")
        return v.strip()

    @validator("category")
    def validate_category(cls, v):
        """カテゴリーのバリデーション（動的生成、1-10文字）"""
        if not v or not v.strip():
            raise ValueError("カテゴリーは空にできません")
        if len(v.strip()) < 1:
            raise ValueError("カテゴリーは1文字以上で入力してください")
        if len(v.strip()) > 10:
            raise ValueError("カテゴリーは10文字以内にしてください")
        return v.strip()

    @validator("match_score")
    def validate_match_score(cls, v):
        """マッチ度のバリデーション"""
        if v < 1 or v > 100:
            raise ValueError("マッチ度は1から100の範囲で指定してください")
        return v


class RecommendationResponse(BaseModel):
    """推薦レスポンスモデル"""

    best_recommend: Optional[BestRecommendation] = Field(
        None, description="最優先推薦（鉄板マッチ）"
    )
    recommendations: list[Recommendation] = Field(
        default_factory=list, description="その他の推薦リスト（最大9件）"
    )
    metadata: Optional[str] = Field(
        None, description="メタデータ（飲酒履歴0件時のメッセージなど）"
    )

    @validator("recommendations")
    def validate_recommendations(cls, v):
        """推薦リストのバリデーション"""
        # 空のリストは許可（飲酒履歴0件の場合）
        if len(v) > 9:
            raise ValueError("その他の推薦は最大9件までです")
        return v
