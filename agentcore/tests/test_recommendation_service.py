"""推薦サービスのユニットテスト"""

import json
import pytest

from src.services.recommendation_service import RecommendationService
from src.models import BestRecommendation, Recommendation


class TestRecommendationService:
    """RecommendationServiceのテスト"""

    def test_parse_recommendations_with_dynamic_category(self):
        """動的カテゴリーが正しくパースされることを確認"""
        service = RecommendationService()
        
        # テスト用のJSONレスポンス（動的カテゴリー）
        response_json = {
            "best_recommend": {
                "brand": "獺祭 純米大吟醸",
                "brand_description": "山口県の旭酒造が醸す、フルーティーで華やかな香りが特徴の純米大吟醸",
                "expected_experience": "洗練された甘みと爽やかな酸味が調和し、後味はすっきりとキレが良い。",
                "match_score": 95
            },
            "recommendations": [
                {
                    "brand": "久保田 千寿",
                    "brand_description": "新潟県の朝日酒造が醸す、淡麗辛口の代表格",
                    "expected_experience": "すっきりとした飲み口で、食事との相性が抜群。",
                    "category": "新しい挑戦",
                    "match_score": 85
                },
                {
                    "brand": "黒龍 石田屋",
                    "brand_description": "福井県の黒龍酒造が醸す、芳醇な香りと深い味わいが特徴",
                    "expected_experience": "濃厚な旨味と複雑な香りが楽しめる、贅沢な一杯。",
                    "category": "好みに近い",
                    "match_score": 80
                }
            ]
        }
        
        response_text = json.dumps(response_json, ensure_ascii=False)
        
        # パース実行
        result = service._parse_recommendations(response_text)
        
        # best_recommendの検証
        assert result.best_recommend is not None
        assert result.best_recommend.brand == "獺祭 純米大吟醸"
        assert result.best_recommend.match_score == 95
        # best_recommendにcategoryフィールドが含まれないことを確認
        assert not hasattr(result.best_recommend, 'category')
        
        # recommendationsの検証
        assert len(result.recommendations) == 2
        
        # 1件目の推薦
        rec1 = result.recommendations[0]
        assert rec1.brand == "久保田 千寿"
        assert rec1.category == "新しい挑戦"
        assert rec1.match_score == 85
        # カテゴリーが1-10文字の範囲内であることを確認
        assert isinstance(rec1.category, str)
        assert 1 <= len(rec1.category) <= 10
        
        # 2件目の推薦
        rec2 = result.recommendations[1]
        assert rec2.brand == "黒龍 石田屋"
        assert rec2.category == "好みに近い"
        assert rec2.match_score == 80
        # カテゴリーが1-10文字の範囲内であることを確認
        assert isinstance(rec2.category, str)
        assert 1 <= len(rec2.category) <= 10


    def test_parse_recommendations_with_invalid_category(self):
        """無効なカテゴリーのハンドリングをテスト"""
        service = RecommendationService()
        
        # テストケース1: 空文字列のカテゴリー
        response_json_empty = {
            "best_recommend": {
                "brand": "獺祭",
                "brand_description": "フルーティーで華やか",
                "expected_experience": "洗練された味わい",
                "match_score": 95
            },
            "recommendations": [
                {
                    "brand": "久保田",
                    "brand_description": "淡麗辛口",
                    "expected_experience": "すっきりとした飲み口",
                    "category": "",  # 空文字列
                    "match_score": 85
                }
            ]
        }
        
        response_text_empty = json.dumps(response_json_empty, ensure_ascii=False)
        result_empty = service._parse_recommendations(response_text_empty)
        
        # デフォルトカテゴリー（「おすすめ」）が設定されることを確認
        assert len(result_empty.recommendations) == 1
        assert result_empty.recommendations[0].category == "おすすめ"
        assert 1 <= len(result_empty.recommendations[0].category) <= 10
        
        # テストケース2: 10文字超過のカテゴリー
        response_json_long = {
            "best_recommend": {
                "brand": "獺祭",
                "brand_description": "フルーティーで華やか",
                "expected_experience": "洗練された味わい",
                "match_score": 95
            },
            "recommendations": [
                {
                    "brand": "黒龍",
                    "brand_description": "芳醇な香り",
                    "expected_experience": "深い味わい",
                    "category": "これは10文字を超える非常に長いカテゴリー名です",  # 10文字超過
                    "match_score": 80
                }
            ]
        }
        
        response_text_long = json.dumps(response_json_long, ensure_ascii=False)
        result_long = service._parse_recommendations(response_text_long)
        
        # デフォルトカテゴリー（「おすすめ」）が設定されることを確認
        assert len(result_long.recommendations) == 1
        assert result_long.recommendations[0].category == "おすすめ"
        assert 1 <= len(result_long.recommendations[0].category) <= 10
        
        # テストケース3: 複数の無効なカテゴリーが混在
        response_json_mixed = {
            "best_recommend": {
                "brand": "獺祭",
                "brand_description": "フルーティーで華やか",
                "expected_experience": "洗練された味わい",
                "match_score": 95
            },
            "recommendations": [
                {
                    "brand": "久保田",
                    "brand_description": "淡麗辛口",
                    "expected_experience": "すっきりとした飲み口",
                    "category": "",  # 空文字列
                    "match_score": 85
                },
                {
                    "brand": "黒龍",
                    "brand_description": "芳醇な香り",
                    "expected_experience": "深い味わい",
                    "category": "これは10文字を超える長いカテゴリー",  # 10文字超過
                    "match_score": 80
                }
            ]
        }
        
        response_text_mixed = json.dumps(response_json_mixed, ensure_ascii=False)
        result_mixed = service._parse_recommendations(response_text_mixed)
        
        # 両方ともデフォルトカテゴリー（「おすすめ」）が設定されることを確認
        assert len(result_mixed.recommendations) == 2
        assert result_mixed.recommendations[0].category == "おすすめ"
        assert result_mixed.recommendations[1].category == "おすすめ"
        assert all(1 <= len(rec.category) <= 10 for rec in result_mixed.recommendations)
