"""AgentCoreのローカルテスト"""

import asyncio
import json
from src.agent import invoke


async def test_recommendation():
    """推薦機能のテスト"""
    print("=" * 60)
    print("推薦機能のテスト")
    print("=" * 60)

    # テストペイロード
    payload = {
        "type": "recommendation",
        "user_id": "test_user_001",
        "drinking_records": [
            {
                "id": "rec_001",
                "user_id": "test_user_001",
                "brand": "獺祭 純米大吟醸",
                "impression": "非常にフルーティで飲みやすい。香りが高く、甘みと酸味のバランスが良い。",
                "rating": "非常に好き",
                "created_at": "2025-01-01T00:00:00Z",
            },
            {
                "id": "rec_002",
                "user_id": "test_user_001",
                "brand": "久保田 千寿",
                "impression": "すっきりとした辛口。食事に合わせやすい。",
                "rating": "好き",
                "created_at": "2025-01-05T00:00:00Z",
            },
            {
                "id": "rec_003",
                "user_id": "test_user_001",
                "brand": "八海山 普通酒",
                "impression": "少し辛すぎる。自分の好みではない。",
                "rating": "合わない",
                "created_at": "2025-01-10T00:00:00Z",
            },
        ],
        "menu_brands": ["獺祭 純米大吟醸", "十四代 本丸", "黒龍 しずく", "久保田 千寿"],
        "max_recommendations": 3,
    }

    print("\n📤 リクエストペイロード:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))

    # エージェント呼び出し
    result = await invoke(payload)

    print("\n📥 レスポンス:")
    print(json.dumps(result, indent=2, ensure_ascii=False))

    # 結果の検証
    if "error" in result:
        print("\n❌ エラーが発生しました")
        return False

    if "result" in result:
        recommendations = result["result"].get("recommendations", [])
        print(f"\n✅ 推薦結果: {len(recommendations)}件")
        for i, rec in enumerate(recommendations, 1):
            print(f"\n{i}. {rec.get('brand', 'N/A')}")
            print(f"   スコア: {rec.get('score', 0)}/5")
            print(f"   理由: {rec.get('reason', 'N/A')}")
        return True

    print("\n❌ 予期しないレスポンス形式")
    return False


async def test_taste_analysis():
    """味の好み分析のテスト"""
    print("\n" + "=" * 60)
    print("味の好み分析のテスト")
    print("=" * 60)

    # テストペイロード
    payload = {
        "type": "taste_analysis",
        "user_id": "test_user_001",
        "drinking_records": [
            {
                "id": "rec_001",
                "user_id": "test_user_001",
                "brand": "獺祭 純米大吟醸",
                "impression": "非常にフルーティで飲みやすい。香りが高く、甘みと酸味のバランスが良い。",
                "rating": "非常に好き",
                "created_at": "2025-01-01T00:00:00Z",
            },
            {
                "id": "rec_002",
                "user_id": "test_user_001",
                "brand": "久保田 千寿",
                "impression": "すっきりとした辛口。食事に合わせやすい。",
                "rating": "好き",
                "created_at": "2025-01-05T00:00:00Z",
            },
        ],
    }

    print("\n📤 リクエストペイロード:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))

    # エージェント呼び出し
    result = await invoke(payload)

    print("\n📥 レスポンス:")
    print(json.dumps(result, indent=2, ensure_ascii=False))

    # 結果の検証
    if "error" in result:
        print("\n❌ エラーが発生しました")
        return False

    if "result" in result:
        analysis = result["result"]
        print("\n✅ 分析結果:")
        print(f"   好む味: {analysis.get('preferred_tastes', [])}")
        print(f"   避ける味: {analysis.get('disliked_tastes', [])}")
        print(f"   要約: {analysis.get('analysis_summary', 'N/A')}")
        return True

    print("\n❌ 予期しないレスポンス形式")
    return False


async def main():
    """メインテスト実行"""
    print("\n🍶 日本酒推薦エージェント ローカルテスト")
    print("=" * 60)

    # 推薦機能のテスト
    success1 = await test_recommendation()

    # 味の好み分析のテスト
    success2 = await test_taste_analysis()

    # 結果サマリー
    print("\n" + "=" * 60)
    print("テスト結果サマリー")
    print("=" * 60)
    print(f"推薦機能: {'✅ 成功' if success1 else '❌ 失敗'}")
    print(f"味の好み分析: {'✅ 成功' if success2 else '❌ 失敗'}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
