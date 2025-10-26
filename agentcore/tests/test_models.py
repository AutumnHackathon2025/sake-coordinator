"""データモデルのテスト"""

import pytest

from src.models import (
    BestRecommendation,
    DrinkingRecord,
    Menu,
    Rating,
    Recommendation,
    RecommendationResponse,
)


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


class TestBestRecommendation:
    """最優先推薦モデルのテスト"""

    def test_valid_best_recommendation(self):
        """正常な最優先推薦の作成"""
        best = BestRecommendation(
            brand="獺祭 純米大吟醸",
            brand_description="山口県の旭酒造が醸す、フルーティーで華やかな香りが特徴の純米大吟醸",
            expected_experience="洗練された甘みと爽やかな酸味が調和し、後味はすっきりとキレが良い。",
            match_score=95,
        )

        assert best.brand == "獺祭 純米大吟醸"
        assert best.match_score == 95
        assert len(best.brand_description) <= 200
        assert len(best.expected_experience) <= 500

    def test_brand_length_validation(self):
        """銘柄名の文字数バリデーション"""
        with pytest.raises(ValueError):
            BestRecommendation(
                brand="a" * 65,  # 65文字
                brand_description="テスト",
                expected_experience="テスト",
                match_score=90,
            )

    def test_brand_description_length_validation(self):
        """銘柄説明の文字数バリデーション"""
        with pytest.raises(ValueError):
            BestRecommendation(
                brand="テスト",
                brand_description="a" * 201,  # 201文字
                expected_experience="テスト",
                match_score=90,
            )

    def test_expected_experience_length_validation(self):
        """期待される体験の文字数バリデーション"""
        with pytest.raises(ValueError):
            BestRecommendation(
                brand="テスト",
                brand_description="テスト",
                expected_experience="a" * 501,  # 501文字
                match_score=90,
            )

    def test_match_score_range_validation(self):
        """マッチ度の範囲バリデーション"""
        # 範囲外（101）
        with pytest.raises(ValueError):
            BestRecommendation(
                brand="テスト",
                brand_description="テスト",
                expected_experience="テスト",
                match_score=101,
            )

        # 範囲外（0）
        with pytest.raises(ValueError):
            BestRecommendation(
                brand="テスト",
                brand_description="テスト",
                expected_experience="テスト",
                match_score=0,
            )


class TestRecommendation:
    """推薦モデルのテスト"""

    def test_valid_recommendation(self):
        """正常な推薦の作成"""
        recommendation = Recommendation(
            brand="久保田 千寿",
            brand_description="新潟県の朝日酒造が醸す、淡麗辛口の代表格",
            expected_experience="すっきりとした飲み口で、食事との相性が抜群。",
            category="新しい挑戦",
            match_score=75,
        )

        assert recommendation.brand == "久保田 千寿"
        assert recommendation.category == "新しい挑戦"
        assert recommendation.match_score == 75

    def test_category_validation(self):
        """カテゴリーのバリデーション（動的生成、1-10文字）"""
        # 正しいカテゴリー: 1文字
        rec1 = Recommendation(
            brand="テスト",
            brand_description="テスト",
            expected_experience="テスト",
            category="挑戦",
            match_score=70,
        )
        assert rec1.category == "挑戦"
        assert isinstance(rec1.category, str)
        assert 1 <= len(rec1.category) <= 10

        # 正しいカテゴリー: 10文字
        rec2 = Recommendation(
            brand="テスト",
            brand_description="テスト",
            expected_experience="テスト",
            category="新しい挑戦の一杯",
            match_score=50,
        )
        assert rec2.category == "新しい挑戦の一杯"
        assert isinstance(rec2.category, str)
        assert 1 <= len(rec2.category) <= 10

        # 不正なカテゴリー: 空文字列
        with pytest.raises(ValueError, match="カテゴリーは空にできません"):
            Recommendation(
                brand="テスト",
                brand_description="テスト",
                expected_experience="テスト",
                category="",
                match_score=70,
            )
        
        # 不正なカテゴリー: 10文字超過
        with pytest.raises(ValueError, match="カテゴリーは10文字以内にしてください"):
            Recommendation(
                brand="テスト",
                brand_description="テスト",
                expected_experience="テスト",
                category="これは10文字を超える長いカテゴリー名です",
                match_score=70,
            )

    def test_match_score_range_validation(self):
        """マッチ度の範囲バリデーション"""
        with pytest.raises(ValueError):
            Recommendation(
                brand="テスト",
                brand_description="テスト",
                expected_experience="テスト",
                category="次の一手",
                match_score=101,
            )


class TestRecommendationResponse:
    """推薦レスポンスモデルのテスト"""

    def test_valid_response_with_best_recommend(self):
        """best_recommendありの正常なレスポンス"""
        best = BestRecommendation(
            brand="獺祭",
            brand_description="フルーティーで華やか",
            expected_experience="洗練された味わい",
            match_score=95,
        )

        recs = [
            Recommendation(
                brand="久保田",
                brand_description="淡麗辛口",
                expected_experience="すっきりとした飲み口",
                category="新しい挑戦",
                match_score=75,
            ),
            Recommendation(
                brand="黒龍",
                brand_description="芳醇な香り",
                expected_experience="深い味わい",
                category="好みに近い",
                match_score=55,
            ),
        ]

        response = RecommendationResponse(best_recommend=best, recommendations=recs)

        assert response.best_recommend is not None
        assert len(response.recommendations) == 2
        # カテゴリーが文字列であることを確認
        for rec in response.recommendations:
            assert isinstance(rec.category, str)
            # カテゴリーが1-10文字の範囲内であることを確認
            assert 1 <= len(rec.category) <= 10

    def test_empty_response(self):
        """飲酒履歴0件の場合の空レスポンス"""
        response = RecommendationResponse(
            best_recommend=None, 
            recommendations=[],
            metadata="飲酒記録がありません。まずは飲んだお酒を記録してください"
        )

        assert response.best_recommend is None
        assert len(response.recommendations) == 0
        assert response.metadata == "飲酒記録がありません。まずは飲んだお酒を記録してください"

    def test_recommendations_max_count_validation(self):
        """推薦件数の上限バリデーション"""
        recs = [
            Recommendation(
                brand=f"テスト{i}",
                brand_description="テスト",
                expected_experience="テスト",
                category="おすすめ",
                match_score=70,
            )
            for i in range(3)
        ]

        with pytest.raises(ValueError, match="最大2件"):
            RecommendationResponse(best_recommend=None, recommendations=recs)


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
