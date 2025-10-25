#!/bin/bash

# 日本酒推薦API テストスクリプト

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 設定
API_URL="http://localhost:3000/api/agent/recommend"

echo "🍶 日本酒推薦API テストスクリプト"
echo "=================================="
echo ""

# 認証トークンの確認
if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠️  認証トークンが設定されていません${NC}"
    echo -e "${GREEN}✅ 開発モード: 認証なしでテストを実行します${NC}"
    echo ""
fi

# テスト1: 正常系 - メニューありの推薦
echo -e "${GREEN}テスト1: 正常系 - メニューありの推薦${NC}"
echo "-----------------------------------"
echo "リクエスト:"
cat << EOF
{
  "menu": ["獺祭 純米大吟醸", "十四代 本丸", "黒龍 しずく", "久保田 千寿"]
}
EOF
echo ""
echo "レスポンス:"

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "menu": ["獺祭 純米大吟醸", "十四代 本丸", "黒龍 しずく", "久保田 千寿"]
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "エラー: APIに接続できません"

echo ""
echo ""

# テスト2: 異常系 - メニューが空
echo -e "${GREEN}テスト2: 異常系 - メニューが空${NC}"
echo "-----------------------------------"
echo "リクエスト:"
cat << EOF
{
  "menu": []
}
EOF
echo ""
echo "レスポンス:"

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "menu": []
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "エラー: APIに接続できません"

echo ""
echo ""

# テスト3: 正常系 - 少数のメニュー（開発モードでは認証スキップ）
echo -e "${GREEN}テスト3: 正常系 - 少数のメニュー${NC}"
echo "-----------------------------------"
echo "リクエスト:"
cat << EOF
{
  "menu": ["獺祭 純米大吟醸"]
}
EOF
echo ""
echo "レスポンス:"

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "menu": ["獺祭 純米大吟醸"]
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "エラー: APIに接続できません"

echo ""
echo ""

# テスト4: 正常系 - 複数のメニュー
echo -e "${GREEN}テスト4: 正常系 - 複数のメニュー${NC}"
echo "-----------------------------------"
echo "リクエスト:"
cat << EOF
{
  "menu": ["獺祭 純米大吟醸", "久保田 千寿"]
}
EOF
echo ""
echo "レスポンス:"

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "menu": ["獺祭 純米大吟醸", "久保田 千寿"]
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "エラー: APIに接続できません"

echo ""
echo ""
echo "=================================="
echo "テスト完了"
echo "=================================="
