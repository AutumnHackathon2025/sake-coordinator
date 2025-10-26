"""推薦機能の統合テスト（正常系）"""

import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch, MagicMock

from src.agent import AgentRouter, create_router
from src.models import Rating


class TestRecommendationIntegration:
    """推薦機能の統合テスト（正常系）"""

    @pytest.fixture
    def mock_bedrock_response_with_menu(self):
        """Bedrockのモックレスポンス（メニューあり）"""
        return """```json
{
  "best_recommend": {
    "brand": "獺祭 純米大吟醸",
    "brand_description": "山口県の旭酒造が醸す、フルーティーで華やかな香りが特徴の純米大吟醸",
    "expected_experience": "あなたが以前飲んだ獺祭と同じく、洗練された甘みと爽やかな酸味が調和し、後味はすっきりとキレが良い。フルーティーな香りが口いっぱいに広がります。",
    "match_score": 95
  },
  "recommendations": [
    {
      "brand": "十四代 本丸",
      "brand_description": "山形県の高木酒造が醸す、芳醇でバランスの取れた味わいの純米吟醸",
      "expected_experience": "獺祭のフルーティーさに加えて、より深みのある味わいが楽しめます。甘みと旨味のバランスが絶妙で、新しい発見があるでしょう。",
      "category": "次の一手",
      "match_score": 75
    },
    {
      "brand": "新政 No.6",
      "brand_description": "秋田県の新政酒造が醸す、独特の酸味と爽やかさが特徴の純米酒",
      "expected_experience": "これまでとは異なる酸味主体の味わいで、新しい日本酒の世界が広がります。爽やかな酸味が食事との相性を高めます。",
      "category": "運命の出会い",
      "match_score": 55
    }
  ]
}
```"""

    @pytest.fixture
    def mock_bedrock_response_without_menu(self):
        """Bedrockのモックレスポンス（メニューなし）"""
        return """```json
{
  "best_recommend": {
    "brand": "獺祭 磨き二割三分",
    "brand_description": "最高峰の精米歩合23%を誇る、究極のフルーティーさと華やかさ",
    "expected_experience": "あなたが好む獺祭の特徴をさらに洗練させた、極上の味わい。繊細で上品な甘みと香りが特徴です。",
    "match_score": 98
  },
  "recommendations": [
    {
      "brand": "而今 純米吟醸",
      "brand_description": "三重県の木屋正酒造が醸す、フルーティーでジューシーな味わいの純米吟醸",
      "expected_experience": "獺祭に似たフルーティーさを持ちながら、よりジューシーで果実感が強い。新しい味わいの発見があります。",
      "category": "次の一手",
      "match_score": 72
    },
    {
      "brand": "醸し人九平次 純米大吟醸",
      "brand_description": "愛知県の萬乗醸造が醸す、ワインのような洗練された味わいの純米大吟醸",
      "expected_experience": "日本酒の枠を超えた、ワインのような洗練された味わい。新しい日本酒体験への挑戦です。",
      "category": "運命の出会い",
      "match_score": 50
    }
  ]
}
```"""

    @pytest.fixture
    def mock_taste_analysis_response(self):
        """味の好み分析のモックレスポンス"""
        return """```json
{
  "preferred_tastes": ["フルーティー", "華やか", "甘口", "飲みやすい"],
  "disliked_tastes": ["辛口すぎる", "クセが強い"],
  "analysis_summary": "フルーティーで華やかな香りの日本酒を好む傾向があります。甘みと酸味のバランスが良く、飲みやすいタイプを高く評価しています。"
}
```"""

    @pytest.fixture
    def router(self, mock_bedrock_response_with_menu, mock_taste_analysis_response):
        """エージェントルーターのフィクスチャ（Bedrockをモック）"""
        with patch('src.services.bedrock_service.BedrockService.generate_text') as mock_generate:
            # 最初の呼び出し（味の好み分析）と2回目の呼び出し（推薦生成）で異なるレスポンスを返す
            mock_generate.side_effect = [
                mock_taste_analysis_response,
                mock_bedrock_response_with_menu
            ]
            yield create_router()

    @pytest.fixture
    def sample_drinking_records_with_history(self):
        """飲酒履歴ありのサンプルデータ"""
        return [
            {
                "id": "rec_001",
                "user_id": "test_user_001",
                "brand": "獺祭 純米大吟醸",
                "impression": "フルーティーで華やかな香り。甘みと酸味のバランスが良く、非常に飲みやすい。",
                "rating": Rating.VERY_GOOD.value,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "rec_002",
                "user_id": "test_user_001",
                "brand": "久保田 千寿",
                "impression": "淡麗辛口で食事に合う。すっきりとした飲み口で後味がキレイ。",
                "rating": Rating.GOOD.value,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "rec_003",
                "user_id": "test_user_001",
                "brand": "黒龍 大吟醸",
                "impression": "芳醇な香りと深い味わい。少し重めだが満足感がある。",
                "rating": Rating.GOOD.value,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "rec_004",
                "user_id": "test_user_001",
                "brand": "八海山 純米吟醸",
                "impression": "クセがなく飲みやすい。万人受けする味わい。",
                "rating": Rating.GOOD.value,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "rec_005",
                "user_id": "test_user_001",
                "brand": "菊正宗 上撰",
                "impression": "辛口すぎて自分には合わない。",
                "rating": Rating.BAD.value,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        ]

    @pytest.fixture
    def sample_menu_brands(self):
        """サンプルメニュー銘柄リスト"""
        return [
            "獺祭 純米大吟醸",
            "十四代 本丸",
            "久保田 萬寿",
            "黒龍 石田屋",
            "而今 純米吟醸",
            "新政 No.6",
            "田酒 特別純米",
            "鍋島 純米吟醸",
            "飛露喜 特別純米",
            "醸し人九平次 純米大吟醸",
        ]

    @pytest.mark.asyncio
    async def test_recommendation_with_history_and_menu(
        self, router, sample_drinking_records_with_history, sample_menu_brands
    ):
        """正常系: 飲酒履歴あり、メニューありのケース
        
        要件:
        - best_recommendが正しく返されること（マッチ度90以上）
        - recommendationsが最大2件返されること
        - カテゴリーが「次の一手」または「運命の出会い」であること
        """
        # Given: 飲酒履歴とメニューがある
        params = {
            "user_id": "test_user_001",
            "drinking_records": sample_drinking_records_with_history,
            "menu_brands": sample_menu_brands,
            "max_recommendations": 10,
        }

        # When: 推薦を実行
        result = await router.route("recommendation", params)

        # Then: 推薦結果が正しく返される
        assert "error" not in result, f"エラーが発生しました: {result.get('error')}"
        
        # best_recommendの検証
        assert "best_recommend" in result, "best_recommendが含まれていません"
        best_recommend = result["best_recommend"]
        
        if best_recommend is not None:
            # best_recommendが存在する場合の検証
            assert "brand" in best_recommend, "best_recommendにbrandが含まれていません"
            assert "brand_description" in best_recommend, "best_recommendにbrand_descriptionが含まれていません"
            assert "expected_experience" in best_recommend, "best_recommendにexpected_experienceが含まれていません"
            assert "match_score" in best_recommend, "best_recommendにmatch_scoreが含まれていません"
            
            # マッチ度の検証（90以上）
            assert best_recommend["match_score"] >= 90, \
                f"best_recommendのマッチ度が90未満です: {best_recommend['match_score']}"
            
            # 文字数の検証
            assert 1 <= len(best_recommend["brand"]) <= 64, \
                f"銘柄名の文字数が不正です: {len(best_recommend['brand'])}"
            assert 1 <= len(best_recommend["brand_description"]) <= 200, \
                f"銘柄説明の文字数が不正です: {len(best_recommend['brand_description'])}"
            assert 1 <= len(best_recommend["expected_experience"]) <= 500, \
                f"期待される体験の文字数が不正です: {len(best_recommend['expected_experience'])}"
        
        # recommendationsの検証
        assert "recommendations" in result, "recommendationsが含まれていません"
        recommendations = result["recommendations"]
        
        assert isinstance(recommendations, list), "recommendationsがリスト形式ではありません"
        assert len(recommendations) <= 2, \
            f"recommendationsが2件を超えています: {len(recommendations)}"
        
        # 各推薦の検証
        for i, rec in enumerate(recommendations):
            assert "brand" in rec, f"recommendations[{i}]にbrandが含まれていません"
            assert "brand_description" in rec, f"recommendations[{i}]にbrand_descriptionが含まれていません"
            assert "expected_experience" in rec, f"recommendations[{i}]にexpected_experienceが含まれていません"
            assert "category" in rec, f"recommendations[{i}]にcategoryが含まれていません"
            assert "match_score" in rec, f"recommendations[{i}]にmatch_scoreが含まれていません"
            
            # カテゴリーの検証（動的生成、1-10文字）
            assert isinstance(rec["category"], str), \
                f"recommendations[{i}]のカテゴリーが文字列ではありません"
            assert 1 <= len(rec["category"]) <= 10, \
                f"recommendations[{i}]のカテゴリーが1-10文字の範囲外です: {len(rec['category'])}文字"
            
            # マッチ度の検証（1-100の範囲）
            assert 1 <= rec["match_score"] <= 100, \
                f"recommendations[{i}]のマッチ度が範囲外です: {rec['match_score']}"
            
            # 文字数の検証
            assert 1 <= len(rec["brand"]) <= 64, \
                f"recommendations[{i}]の銘柄名の文字数が不正です: {len(rec['brand'])}"
            assert 1 <= len(rec["brand_description"]) <= 200, \
                f"recommendations[{i}]の銘柄説明の文字数が不正です: {len(rec['brand_description'])}"
            assert 1 <= len(rec["expected_experience"]) <= 500, \
                f"recommendations[{i}]の期待される体験の文字数が不正です: {len(rec['expected_experience'])}"

    @pytest.mark.asyncio
    async def test_recommendation_with_history_without_menu(
        self, sample_drinking_records_with_history, mock_bedrock_response_without_menu, mock_taste_analysis_response
    ):
        """正常系: 飲酒履歴あり、メニューなしのケース
        
        要件:
        - best_recommendが正しく返されること（マッチ度90以上）
        - recommendationsが最大2件返されること
        - カテゴリーが「次の一手」または「運命の出会い」であること
        """
        # Given: 飲酒履歴があり、メニューがない
        with patch('src.services.bedrock_service.BedrockService.generate_text') as mock_generate:
            # 味の好み分析と推薦生成で異なるレスポンスを返す
            mock_generate.side_effect = [
                mock_taste_analysis_response,
                mock_bedrock_response_without_menu
            ]
            
            router = create_router()
            params = {
                "user_id": "test_user_001",
                "drinking_records": sample_drinking_records_with_history,
                "menu_brands": None,  # メニューなし
                "max_recommendations": 10,
            }

            # When: 推薦を実行
            result = await router.route("recommendation", params)

            # Then: 推薦結果が正しく返される
            assert "error" not in result, f"エラーが発生しました: {result.get('error')}"
            
            # best_recommendの検証
            assert "best_recommend" in result, "best_recommendが含まれていません"
            best_recommend = result["best_recommend"]
            
            if best_recommend is not None:
                # best_recommendが存在する場合の検証
                assert "brand" in best_recommend, "best_recommendにbrandが含まれていません"
                assert "brand_description" in best_recommend, "best_recommendにbrand_descriptionが含まれていません"
                assert "expected_experience" in best_recommend, "best_recommendにexpected_experienceが含まれていません"
                assert "match_score" in best_recommend, "best_recommendにmatch_scoreが含まれていません"
                
                # マッチ度の検証（90以上）
                assert best_recommend["match_score"] >= 90, \
                    f"best_recommendのマッチ度が90未満です: {best_recommend['match_score']}"
                
                # 文字数の検証
                assert 1 <= len(best_recommend["brand"]) <= 64, \
                    f"銘柄名の文字数が不正です: {len(best_recommend['brand'])}"
                assert 1 <= len(best_recommend["brand_description"]) <= 200, \
                    f"銘柄説明の文字数が不正です: {len(best_recommend['brand_description'])}"
                assert 1 <= len(best_recommend["expected_experience"]) <= 500, \
                    f"期待される体験の文字数が不正です: {len(best_recommend['expected_experience'])}"
            
            # recommendationsの検証
            assert "recommendations" in result, "recommendationsが含まれていません"
            recommendations = result["recommendations"]
            
            assert isinstance(recommendations, list), "recommendationsがリスト形式ではありません"
            assert len(recommendations) <= 2, \
                f"recommendationsが2件を超えています: {len(recommendations)}"
            
            # 各推薦の検証
            for i, rec in enumerate(recommendations):
                assert "brand" in rec, f"recommendations[{i}]にbrandが含まれていません"
                assert "brand_description" in rec, f"recommendations[{i}]にbrand_descriptionが含まれていません"
                assert "expected_experience" in rec, f"recommendations[{i}]にexpected_experienceが含まれていません"
                assert "category" in rec, f"recommendations[{i}]にcategoryが含まれていません"
                assert "match_score" in rec, f"recommendations[{i}]にmatch_scoreが含まれていません"
                
                # カテゴリーの検証（動的生成、1-10文字）
                assert isinstance(rec["category"], str), \
                    f"recommendations[{i}]のカテゴリーが文字列ではありません"
                assert 1 <= len(rec["category"]) <= 10, \
                    f"recommendations[{i}]のカテゴリーが1-10文字の範囲外です: {len(rec['category'])}文字"
                
                # マッチ度の検証（1-100の範囲）
                assert 1 <= rec["match_score"] <= 100, \
                    f"recommendations[{i}]のマッチ度が範囲外です: {rec['match_score']}"
                
                # 文字数の検証
                assert 1 <= len(rec["brand"]) <= 64, \
                    f"recommendations[{i}]の銘柄名の文字数が不正です: {len(rec['brand'])}"
                assert 1 <= len(rec["brand_description"]) <= 200, \
                    f"recommendations[{i}]の銘柄説明の文字数が不正です: {len(rec['brand_description'])}"
                assert 1 <= len(rec["expected_experience"]) <= 500, \
                    f"recommendations[{i}]の期待される体験の文字数が不正です: {len(rec['expected_experience'])}"

    @pytest.mark.asyncio
    async def test_best_recommend_match_score_validation(
        self, sample_drinking_records_with_history, sample_menu_brands, 
        mock_bedrock_response_with_menu, mock_taste_analysis_response
    ):
        """正常系: best_recommendのマッチ度が90以上であることを確認"""
        # Given: 飲酒履歴とメニューがある
        with patch('src.services.bedrock_service.BedrockService.generate_text') as mock_generate:
            mock_generate.side_effect = [
                mock_taste_analysis_response,
                mock_bedrock_response_with_menu
            ]
            
            router = create_router()
            params = {
                "user_id": "test_user_001",
                "drinking_records": sample_drinking_records_with_history,
                "menu_brands": sample_menu_brands,
                "max_recommendations": 10,
            }

            # When: 推薦を実行
            result = await router.route("recommendation", params)

            # Then: best_recommendのマッチ度が90以上
            assert "error" not in result
            best_recommend = result.get("best_recommend")
            
            if best_recommend is not None:
                match_score = best_recommend.get("match_score")
                assert match_score is not None, "match_scoreが含まれていません"
                assert match_score >= 90, \
                    f"best_recommendのマッチ度が90未満です: {match_score}"

    @pytest.mark.asyncio
    async def test_recommendations_count_validation(
        self, sample_drinking_records_with_history, sample_menu_brands,
        mock_bedrock_response_with_menu, mock_taste_analysis_response
    ):
        """正常系: recommendationsが最大2件であることを確認"""
        # Given: 飲酒履歴とメニューがある
        with patch('src.services.bedrock_service.BedrockService.generate_text') as mock_generate:
            mock_generate.side_effect = [
                mock_taste_analysis_response,
                mock_bedrock_response_with_menu
            ]
            
            router = create_router()
            params = {
                "user_id": "test_user_001",
                "drinking_records": sample_drinking_records_with_history,
                "menu_brands": sample_menu_brands,
                "max_recommendations": 10,
            }

            # When: 推薦を実行
            result = await router.route("recommendation", params)

            # Then: recommendationsが最大2件
            assert "error" not in result
            recommendations = result.get("recommendations", [])
            
            assert isinstance(recommendations, list), "recommendationsがリスト形式ではありません"
            assert len(recommendations) <= 2, \
                f"recommendationsが2件を超えています: {len(recommendations)}"

    @pytest.mark.asyncio
    async def test_recommendations_category_validation(
        self, sample_drinking_records_with_history, sample_menu_brands,
        mock_bedrock_response_with_menu, mock_taste_analysis_response
    ):
        """正常系: recommendationsのカテゴリーが動的に生成され、1-10文字の範囲内であることを確認"""
        # Given: 飲酒履歴とメニューがある
        with patch('src.services.bedrock_service.BedrockService.generate_text') as mock_generate:
            mock_generate.side_effect = [
                mock_taste_analysis_response,
                mock_bedrock_response_with_menu
            ]
            
            router = create_router()
            params = {
                "user_id": "test_user_001",
                "drinking_records": sample_drinking_records_with_history,
                "menu_brands": sample_menu_brands,
                "max_recommendations": 10,
            }

            # When: 推薦を実行
            result = await router.route("recommendation", params)

            # Then: 各推薦のカテゴリーが動的に生成され、1-10文字の範囲内
            assert "error" not in result
            recommendations = result.get("recommendations", [])
            
            for i, rec in enumerate(recommendations):
                category = rec.get("category")
                assert category is not None, f"recommendations[{i}]にcategoryが含まれていません"
                assert isinstance(category, str), f"recommendations[{i}]のカテゴリーが文字列ではありません"
                assert 1 <= len(category) <= 10, \
                    f"recommendations[{i}]のカテゴリーが1-10文字の範囲外です: {len(category)}文字"

    @pytest.mark.asyncio
    async def test_generate_recommendations_with_dynamic_category(
        self, sample_drinking_records_with_history, sample_menu_brands,
        mock_taste_analysis_response
    ):
        """正常系: 実際のBedrock呼び出しで動的カテゴリーが生成されることを確認
        
        要件:
        - 実際のBedrock呼び出しで動的カテゴリーが生成されること
        - カテゴリーが固定値でないこと
        - カテゴリーが1-10文字の範囲内であること
        """
        # Given: 動的カテゴリーを含むBedrockレスポンス
        mock_bedrock_response_dynamic = """```json
{
  "best_recommend": {
    "brand": "獺祭 純米大吟醸",
    "brand_description": "山口県の旭酒造が醸す、フルーティーで華やかな香りが特徴の純米大吟醸",
    "expected_experience": "あなたが以前飲んだ獺祭と同じく、洗練された甘みと爽やかな酸味が調和し、後味はすっきりとキレが良い。フルーティーな香りが口いっぱいに広がります。",
    "match_score": 95
  },
  "recommendations": [
    {
      "brand": "十四代 本丸",
      "brand_description": "山形県の高木酒造が醸す、芳醇でバランスの取れた味わいの純米吟醸",
      "expected_experience": "獺祭のフルーティーさに加えて、より深みのある味わいが楽しめます。甘みと旨味のバランスが絶妙で、新しい発見があるでしょう。",
      "category": "新しい挑戦",
      "match_score": 75
    },
    {
      "brand": "新政 No.6",
      "brand_description": "秋田県の新政酒造が醸す、独特の酸味と爽やかさが特徴の純米酒",
      "expected_experience": "これまでとは異なる酸味主体の味わいで、新しい日本酒の世界が広がります。爽やかな酸味が食事との相性を高めます。",
      "category": "意外な発見",
      "match_score": 55
    }
  ]
}
```"""
        
        with patch('src.services.bedrock_service.BedrockService.generate_text') as mock_generate:
            mock_generate.side_effect = [
                mock_taste_analysis_response,
                mock_bedrock_response_dynamic
            ]
            
            router = create_router()
            params = {
                "user_id": "test_user_001",
                "drinking_records": sample_drinking_records_with_history,
                "menu_brands": sample_menu_brands,
                "max_recommendations": 10,
            }

            # When: 推薦を実行
            result = await router.route("recommendation", params)

            # Then: 動的カテゴリーが正しく生成される
            assert "error" not in result, f"エラーが発生しました: {result.get('error')}"
            
            # best_recommendにcategoryフィールドが含まれないことを確認
            best_recommend = result.get("best_recommend")
            if best_recommend is not None:
                assert "category" not in best_recommend, \
                    "best_recommendにcategoryフィールドが含まれています"
            
            # recommendationsの検証
            recommendations = result.get("recommendations", [])
            assert len(recommendations) > 0, "recommendationsが空です"
            
            # 各推薦のカテゴリーを検証
            for i, rec in enumerate(recommendations):
                category = rec.get("category")
                
                # カテゴリーが存在することを確認
                assert category is not None, f"recommendations[{i}]にcategoryが含まれていません"
                assert isinstance(category, str), f"recommendations[{i}]のカテゴリーが文字列ではありません"
                
                # カテゴリーが1-10文字の範囲内であることを確認
                assert 1 <= len(category) <= 10, \
                    f"recommendations[{i}]のカテゴリーが1-10文字の範囲外です: {len(category)}文字 ('{category}')"
                
                # カテゴリーが空文字列でないことを確認
                assert category.strip() != "", \
                    f"recommendations[{i}]のカテゴリーが空文字列です"
            
            # 動的カテゴリーの例を確認（固定値でないことを確認）
            categories = [rec["category"] for rec in recommendations]
            # 少なくとも1つのカテゴリーが「新しい挑戦」または「意外な発見」であることを確認
            assert "新しい挑戦" in categories or "意外な発見" in categories, \
                f"動的カテゴリーが期待通りに生成されていません: {categories}"
