"""データモデルのテスト"""

import pytest

from src.models import DrinkingRecord, Menu, Rating, Recommendation


class TestDrinkingRecord:
    """飲酒記録モデルのテスト"""

    def test_valid_drinking_record(self):
        """正常な飲酒記録の作成"""
        record = DrinkingRecord(
            user_id="test_user",
            brand="獺祭 純米大吟醸",
            impression="フルーティで上品な味わい",
            rating=Rating.VERY_GOOD,
        )

        assert record.user_id == "test_user"
        assert record.brand == "獺祭 純米大吟醸"
        assert record.impression == "フルーティで上品な味わい"
        assert record.rating == Rating.VERY_GOOD

    def test_brand_validation(self):
        """銘柄名のバリデーション"""
        with pytest.raises(ValueError, match="銘柄名は必須です"):
            DrinkingRecord(
                user_id="test_user",
                brand="   ",  # 空白のみ
                impression="テスト",
                rating=Rating.GOOD,
            )

    def test_impression_validation(self):
        """味の感想のバリデーション"""
        with pytest.raises(ValueError, match="味の感想は必須です"):
            DrinkingRecord(
                user_id="test_user",
                brand="テスト銘柄",
                impression="   ",  # 空白のみ
                rating=Rating.GOOD,
            )


class TestRecommendation:
    """推薦モデルのテスト"""

    def test_valid_recommendation(self):
        """正常な推薦の作成"""
        recommendation = Recommendation(
            brand="久保田 萬寿", score=5, reason="あなたの好みに合う上品な味わいです"
        )

        assert recommendation.brand == "久保田 萬寿"
        assert recommendation.score == 5
        assert recommendation.reason == "あなたの好みに合う上品な味わいです"

    def test_score_validation(self):
        """スコアのバリデーション"""
        with pytest.raises(ValueError):
            Recommendation(brand="テスト銘柄", score=6, reason="テスト")  # 範囲外


class TestMenu:
    """メニューモデルのテスト"""

    def test_valid_menu(self):
        """正常なメニューの作成"""
        menu = Menu(brands=["獺祭", "久保田", "十四代"])

        assert len(menu.brands) == 3
        assert "獺祭" in menu.brands

    def test_empty_menu_validation(self):
        """空のメニューのバリデーション"""
        with pytest.raises(ValueError, match="メニューを入力してください"):
            Menu(brands=[])

    def test_duplicate_removal(self):
        """重複銘柄の除去"""
        menu = Menu(brands=["獺祭", "獺祭", "久保田"])

        assert len(menu.brands) == 2
        assert "獺祭" in menu.brands
        assert "久保田" in menu.brands
