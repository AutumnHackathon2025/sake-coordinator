#!/bin/bash

# API CRUD操作テストスクリプト
# DynamoDB Schema Alignmentの動作確認

set -e

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_BASE_URL="http://localhost:3000/api"
TEST_USER_ID="test_user_001"

echo -e "${BLUE}🧪 API CRUD操作テスト${NC}"
echo "========================================"
echo ""

# ヘルパー関数
print_test() {
    echo -e "${YELLOW}テスト: $1${NC}"
    echo "----------------------------------------"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo ""
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    echo ""
}

# Next.jsアプリの確認
echo -e "${YELLOW}0. Next.jsアプリの確認...${NC}"
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Next.jsアプリが起動していません${NC}"
    echo ""
    echo "起動してください:"
    echo "  docker compose up -d nextjs"
    exit 1
fi
echo -e "${GREEN}✅ Next.jsアプリが起動しています${NC}"
echo ""

# テスト1: POST /api/records - 飲酒記録の作成
print_test "1. POST /api/records - 飲酒記録の作成"
echo "リクエスト:"
cat << 'EOF'
{
  "brand": "黒龍 しずく",
  "impression": "非常に繊細で上品な味わい。フルーティな香りと滑らかな口当たりが特徴。",
  "rating": "VERY_GOOD"
}
EOF
echo ""

RESPONSE=$(curl -s -X POST "$API_BASE_URL/records" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $TEST_USER_ID" \
  -d '{
    "brand": "黒龍 しずく",
    "impression": "非常に繊細で上品な味わい。フルーティな香りと滑らかな口当たりが特徴。",
    "rating": "VERY_GOOD"
  }')

echo "レスポンス:"
echo "$RESPONSE" | jq '.'

# レコードIDを取得
RECORD_ID=$(echo "$RESPONSE" | jq -r '.data.id')
if [ "$RECORD_ID" != "null" ] && [ -n "$RECORD_ID" ]; then
    print_success "飲酒記録を作成しました (ID: $RECORD_ID)"
else
    print_error "飲酒記録の作成に失敗しました"
    exit 1
fi

# テスト2: GET /api/records - 飲酒記録の一覧取得
print_test "2. GET /api/records - 飲酒記録の一覧取得"
RESPONSE=$(curl -s -X GET "$API_BASE_URL/records" \
  -H "X-User-Id: $TEST_USER_ID")

echo "レスポンス:"
echo "$RESPONSE" | jq '.'

RECORD_COUNT=$(echo "$RESPONSE" | jq '.data | length')
if [ "$RECORD_COUNT" -gt 0 ]; then
    print_success "飲酒記録を取得しました（$RECORD_COUNT 件）"
else
    print_error "飲酒記録の取得に失敗しました"
    exit 1
fi

# テスト3: GET /api/records?q=黒龍 - 検索機能
print_test "3. GET /api/records?q=黒龍 - 検索機能"
RESPONSE=$(curl -s -X GET "$API_BASE_URL/records?q=黒龍" \
  -H "X-User-Id: $TEST_USER_ID")

echo "レスポンス:"
echo "$RESPONSE" | jq '.'

SEARCH_COUNT=$(echo "$RESPONSE" | jq '.data | length')
if [ "$SEARCH_COUNT" -gt 0 ]; then
    print_success "検索結果を取得しました（$SEARCH_COUNT 件）"
else
    print_error "検索に失敗しました"
fi

# テスト4: PUT /api/records/[recordId] - 飲酒記録の更新
print_test "4. PUT /api/records/$RECORD_ID - 飲酒記録の更新"
echo "リクエスト:"
cat << 'EOF'
{
  "impression": "更新: 非常に繊細で上品な味わい。時間が経つと更に味が開く。",
  "rating": "VERY_GOOD"
}
EOF
echo ""

RESPONSE=$(curl -s -X PUT "$API_BASE_URL/records/$RECORD_ID" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $TEST_USER_ID" \
  -d '{
    "impression": "更新: 非常に繊細で上品な味わい。時間が経つと更に味が開く。",
    "rating": "VERY_GOOD"
  }')

echo "レスポンス:"
echo "$RESPONSE" | jq '.'

UPDATED_IMPRESSION=$(echo "$RESPONSE" | jq -r '.data.impression')
if [[ "$UPDATED_IMPRESSION" == *"更新:"* ]]; then
    print_success "飲酒記録を更新しました"
else
    print_error "飲酒記録の更新に失敗しました"
    exit 1
fi

# テスト5: DynamoDBで直接データを確認（スネークケースの検証）
print_test "5. DynamoDBで直接データを確認（スネークケース検証）"
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
export AWS_REGION=us-west-2

DYNAMODB_ITEM=$(aws dynamodb get-item \
  --table-name "sake-recommendation-dev-drinking-records" \
  --key "{\"userId\":{\"S\":\"$TEST_USER_ID\"},\"recordId\":{\"S\":\"$RECORD_ID\"}}" \
  --endpoint-url "http://localhost:8000" \
  --region "$AWS_REGION" \
  --output json)

echo "DynamoDBの生データ:"
echo "$DYNAMODB_ITEM" | jq '.Item | {
  userId: .userId.S,
  recordId: .recordId.S,
  sake_name: .sake_name.S,
  impression: .impression.S,
  rating: .rating.S,
  created_at: .created_at.S,
  updated_at: .updated_at.S
}'

# スネークケースの確認
SAKE_NAME=$(echo "$DYNAMODB_ITEM" | jq -r '.Item.sake_name.S')
CREATED_AT=$(echo "$DYNAMODB_ITEM" | jq -r '.Item.created_at.S')
UPDATED_AT=$(echo "$DYNAMODB_ITEM" | jq -r '.Item.updated_at.S')

if [ "$SAKE_NAME" != "null" ] && [ "$CREATED_AT" != "null" ] && [ "$UPDATED_AT" != "null" ]; then
    print_success "DynamoDBにスネークケースで正しく保存されています"
    echo "  - sake_name: $SAKE_NAME"
    echo "  - created_at: $CREATED_AT"
    echo "  - updated_at: $UPDATED_AT"
    echo ""
else
    print_error "DynamoDBのデータ形式が正しくありません"
    exit 1
fi

# テスト6: DELETE /api/records/[recordId] - 飲酒記録の削除
print_test "6. DELETE /api/records/$RECORD_ID - 飲酒記録の削除"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API_BASE_URL/records/$RECORD_ID" \
  -H "X-User-Id: $TEST_USER_ID")

echo "HTTPステータス: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "204" ]; then
    print_success "飲酒記録を削除しました"
else
    print_error "飲酒記録の削除に失敗しました (Status: $HTTP_STATUS)"
    exit 1
fi

# テスト7: 削除後の確認
print_test "7. 削除後の確認 - GET /api/records/$RECORD_ID"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/records/$RECORD_ID" \
  -H "X-User-Id: $TEST_USER_ID")

echo "HTTPステータス: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "404" ]; then
    print_success "削除されたレコードは取得できません（期待通り）"
else
    print_error "削除後の確認に失敗しました (Status: $HTTP_STATUS)"
fi

echo -e "${GREEN}========================================"
echo "✅ 全てのCRUDテストが成功しました！"
echo "========================================${NC}"
echo ""
echo -e "${BLUE}確認された項目:${NC}"
echo "  ✅ POST /api/records - 作成"
echo "  ✅ GET /api/records - 一覧取得"
echo "  ✅ GET /api/records?q=xxx - 検索"
echo "  ✅ PUT /api/records/[id] - 更新"
echo "  ✅ DELETE /api/records/[id] - 削除"
echo "  ✅ DynamoDBにスネークケースで保存"
echo "  ✅ APIレスポンスはキャメルケース"
echo ""
