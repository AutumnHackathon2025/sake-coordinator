#!/bin/bash

# DynamoDB Schema Alignment テストスクリプト
# Terraformスキーマに準拠したテーブル作成とCRUD操作の動作確認

set -e

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  DynamoDB Schema Alignment テスト${NC}"
echo "========================================"
echo ""

# 環境変数の設定
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
export AWS_REGION=us-west-2
DYNAMODB_ENDPOINT="http://localhost:8000"
TABLE_NAME="sake-recommendation-dev-drinking-records"

# DynamoDB Localの確認
echo -e "${YELLOW}1. DynamoDB Localの確認...${NC}"
if ! docker ps | grep dynamodb-local > /dev/null; then
    echo -e "${RED}❌ DynamoDB Localが起動していません${NC}"
    echo ""
    echo "起動してください:"
    echo "  docker compose up -d dynamodb-local"
    exit 1
fi
echo -e "${GREEN}✅ DynamoDB Localが起動しています${NC}"
echo ""

# 既存テーブルの削除（存在する場合）
echo -e "${YELLOW}2. 既存テーブルの削除（存在する場合）...${NC}"
aws dynamodb delete-table \
  --table-name "$TABLE_NAME" \
  --endpoint-url "$DYNAMODB_ENDPOINT" \
  --region "$AWS_REGION" \
  2>/dev/null && echo -e "${GREEN}✅ 既存テーブルを削除しました${NC}" || echo -e "${YELLOW}⚠️  テーブルが存在しないか、削除に失敗しました${NC}"
echo ""

# テーブルの作成（Terraformスキーマに準拠）
echo -e "${YELLOW}3. Terraformスキーマに準拠したテーブルの作成...${NC}"
aws dynamodb create-table \
  --table-name "$TABLE_NAME" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=recordId,AttributeType=S \
    AttributeName=sake_name,AttributeType=S \
    AttributeName=rating,AttributeType=S \
    AttributeName=created_at,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=recordId,KeyType=RANGE \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"sake_name-created_at-index\",
        \"KeySchema\": [
          {\"AttributeName\": \"sake_name\", \"KeyType\": \"HASH\"},
          {\"AttributeName\": \"created_at\", \"KeyType\": \"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\": \"ALL\"},
        \"ProvisionedThroughput\": {
          \"ReadCapacityUnits\": 5,
          \"WriteCapacityUnits\": 5
        }
      },
      {
        \"IndexName\": \"rating-created_at-index\",
        \"KeySchema\": [
          {\"AttributeName\": \"rating\", \"KeyType\": \"HASH\"},
          {\"AttributeName\": \"created_at\", \"KeyType\": \"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\": \"ALL\"},
        \"ProvisionedThroughput\": {
          \"ReadCapacityUnits\": 5,
          \"WriteCapacityUnits\": 5
        }
      }
    ]" \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url "$DYNAMODB_ENDPOINT" \
  --region "$AWS_REGION" \
  > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ テーブルを作成しました${NC}"
    echo "   - Table Name: $TABLE_NAME"
    echo "   - Partition Key: userId (String)"
    echo "   - Sort Key: recordId (String)"
    echo "   - GSI1: sake_name-created_at-index"
    echo "   - GSI2: rating-created_at-index"
else
    echo -e "${RED}❌ テーブルの作成に失敗しました${NC}"
    exit 1
fi
echo ""

# テーブルの確認
echo -e "${YELLOW}4. テーブルの確認...${NC}"
aws dynamodb describe-table \
  --table-name "$TABLE_NAME" \
  --endpoint-url "$DYNAMODB_ENDPOINT" \
  --region "$AWS_REGION" \
  --output json | jq '{
    TableName: .Table.TableName,
    KeySchema: .Table.KeySchema,
    AttributeDefinitions: .Table.AttributeDefinitions,
    GlobalSecondaryIndexes: .Table.GlobalSecondaryIndexes | map({IndexName, KeySchema})
  }'
echo ""

# テストデータの投入（スネークケース）
echo -e "${YELLOW}5. テストデータの投入（スネークケース）...${NC}"

# レコード1
aws dynamodb put-item \
  --table-name "$TABLE_NAME" \
  --item '{
    "userId": {"S": "test_user_001"},
    "recordId": {"S": "rec_001"},
    "sake_name": {"S": "獺祭 純米大吟醸"},
    "impression": {"S": "非常にフルーティで飲みやすい。香りが高く、甘みと酸味のバランスが良い。"},
    "rating": {"S": "VERY_GOOD"},
    "created_at": {"S": "2025-01-01T00:00:00.000Z"},
    "updated_at": {"S": "2025-01-01T00:00:00.000Z"}
  }' \
  --endpoint-url "$DYNAMODB_ENDPOINT" \
  --region "$AWS_REGION"

# レコード2
aws dynamodb put-item \
  --table-name "$TABLE_NAME" \
  --item '{
    "userId": {"S": "test_user_001"},
    "recordId": {"S": "rec_002"},
    "sake_name": {"S": "久保田 千寿"},
    "impression": {"S": "すっきりとした辛口。食事に合わせやすい。"},
    "rating": {"S": "GOOD"},
    "created_at": {"S": "2025-01-05T00:00:00.000Z"},
    "updated_at": {"S": "2025-01-05T00:00:00.000Z"}
  }' \
  --endpoint-url "$DYNAMODB_ENDPOINT" \
  --region "$AWS_REGION"

# レコード3
aws dynamodb put-item \
  --table-name "$TABLE_NAME" \
  --item '{
    "userId": {"S": "test_user_001"},
    "recordId": {"S": "rec_003"},
    "sake_name": {"S": "八海山 普通酒"},
    "impression": {"S": "少し辛すぎる。自分の好みではない。"},
    "rating": {"S": "BAD"},
    "created_at": {"S": "2025-01-10T00:00:00.000Z"},
    "updated_at": {"S": "2025-01-10T00:00:00.000Z"}
  }' \
  --endpoint-url "$DYNAMODB_ENDPOINT" \
  --region "$AWS_REGION"

# レコード4（別の銘柄、VERY_GOOD評価）
aws dynamodb put-item \
  --table-name "$TABLE_NAME" \
  --item '{
    "userId": {"S": "test_user_001"},
    "recordId": {"S": "rec_004"},
    "sake_name": {"S": "十四代 本丸"},
    "impression": {"S": "バランスが良く、非常に美味しい。"},
    "rating": {"S": "VERY_GOOD"},
    "created_at": {"S": "2025-01-15T00:00:00.000Z"},
    "updated_at": {"S": "2025-01-15T00:00:00.000Z"}
  }' \
  --endpoint-url "$DYNAMODB_ENDPOINT" \
  --region "$AWS_REGION"

echo -e "${GREEN}✅ テストデータを投入しました（4件）${NC}"
echo ""

# データの確認
echo -e "${YELLOW}6. データの確認（userId でクエリ）...${NC}"
aws dynamodb query \
  --table-name "$TABLE_NAME" \
  --key-condition-expression "userId = :userId" \
  --expression-attribute-values '{":userId":{"S":"test_user_001"}}' \
  --endpoint-url "$DYNAMODB_ENDPOINT" \
  --region "$AWS_REGION" \
  --output json | jq '.Items | map({
    recordId: .recordId.S,
    sake_name: .sake_name.S,
    rating: .rating.S,
    created_at: .created_at.S
  })'
echo ""

# スネークケースの確認
echo -e "${YELLOW}7. スネークケース属性の確認...${NC}"
ITEM=$(aws dynamodb get-item \
  --table-name "$TABLE_NAME" \
  --key '{"userId":{"S":"test_user_001"},"recordId":{"S":"rec_001"}}' \
  --endpoint-url "$DYNAMODB_ENDPOINT" \
  --region "$AWS_REGION" \
  --output json)

echo "$ITEM" | jq '.Item | {
  "✅ sake_name (スネークケース)": .sake_name.S,
  "✅ created_at (スネークケース)": .created_at.S,
  "✅ updated_at (スネークケース)": .updated_at.S
}'
echo ""

echo -e "${GREEN}========================================"
echo "✅ DynamoDB Localセットアップ完了！"
echo "========================================${NC}"
echo ""
echo -e "${BLUE}次のステップ:${NC}"
echo "  1. Next.jsアプリを起動: docker compose up -d nextjs"
echo "  2. APIテストを実行: ./test_api_crud.sh"
echo ""
