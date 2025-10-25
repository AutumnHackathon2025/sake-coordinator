#!/bin/bash

# シンプルなAPIテスト（開発モード用）

echo "🍶 日本酒推薦API 簡易テスト"
echo "=============================="
echo ""

# APIが起動しているか確認
echo "1. APIサーバーの確認..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Next.jsサーバーが起動しています"
else
    echo "❌ Next.jsサーバーが起動していません"
    echo ""
    echo "Next.jsを起動してください:"
    echo "  cd nextjs && pnpm dev"
    exit 1
fi

echo ""
echo "2. 推薦APIのテスト..."
echo ""

# テストリクエスト
curl -X POST http://localhost:3000/api/agent/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "menu": ["獺祭 純米大吟醸", "十四代 本丸", "黒龍 しずく"]
  }' \
  -s | python3 -m json.tool 2>/dev/null || echo "レスポンスの取得に失敗しました"

echo ""
echo ""
echo "=============================="
echo "テスト完了"
echo "=============================="
