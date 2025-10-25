"""メニューデータモデル"""

from pydantic import BaseModel, Field, validator


class Menu(BaseModel):
    """メニューモデル"""

    brands: list[str] = Field(..., description="銘柄リスト")

    @validator("brands")
    def validate_brands(cls, v):
        """銘柄リストのバリデーション"""
        # 空リストチェック
        if not v:
            raise ValueError("メニューを入力してください")

        # 各銘柄名の長さチェック
        for i, brand in enumerate(v):
            if not brand or not brand.strip():
                raise ValueError(f"銘柄名は空にできません（{i + 1}番目）")

            stripped_brand = brand.strip()
            if len(stripped_brand) < 1:
                raise ValueError(f"銘柄名は1文字以上で入力してください（{i + 1}番目）")
            if len(stripped_brand) > 64:
                raise ValueError(f"銘柄名は64文字以内で入力してください（{i + 1}番目）")

        # 重複除去とトリミング
        unique_brands = list(
            dict.fromkeys(brand.strip() for brand in v if brand.strip())
        )

        # 重複除去後に空になった場合
        if not unique_brands:
            raise ValueError("メニューを入力してください")

        return unique_brands
