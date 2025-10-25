#!/bin/bash

# DynamoDB Localにテーブルを作成

echo "🗄️  DynamoDB Local セットアップ"
echo "================================"
echo ""

# DynamoDB Localが起動しているか確認
echo "1. DynamoDB Localの確認..."
if ! docker ps | grep dynamodb-local > /dev/null; then
    echo "❌ DynamoDB Localが起動していません"
    echo ""
    echo "起動してください:"
    echo "  docker-compose up -d dynamodb-local"
    exit 1
fi

echo "✅ DynamoDB Localが起動しています"
echo ""

# ダミーのAWS認証情報を設定（DynamoDB Localでは不要だが、AWS CLIが要求する）
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
export AWS_REGION=us-west-2

# テーブルを作成
echo "2. テーブルの作成..."
aws dynamodb create-table \
  --table-name drinking_records \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=createdAt,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000 \
  --region us-west-2 \
  2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ テーブルを作成しました"
else
    echo ""
    echo "⚠️  テーブルが既に存在するか、作成に失敗しました"
fi

echo ""

# テーブルの確認
echo "3. テーブルの確認..."
aws dynamodb list-tables \
  --endpoint-url http://localhost:8000 \
  --region us-west-2 \
  --output json | jq '.TableNames'

echo ""

# テストデータの投入
echo "4. テストデータの投入..."
echo ""

aws dynamodb put-item \
  --table-name drinking_records \
  --item '{
    "userId": {"S": "test_user_001"},
    "createdAt": {"S": "2025-01-01T00:00:00Z"},
    "id": {"S": "rec_001"},
    "brand": {"S": "獺祭 純米大吟醸"},
    "impression": {"S": "非常にフルーティで飲みやすい。香りが高く、甘みと酸味のバランスが良い。"},
    "rating": {"S": "非常に好き"}
  }' \
  --endpoint-url http://localhost:8000 \
  --region us-west-2

aws dynamodb put-item \
  --table-name drinking_records \
  --item '{
    "userId": {"S": "test_user_001"},
    "createdAt": {"S": "2025-01-05T00:00:00Z"},
    "id": {"S": "rec_002"},
    "brand": {"S": "久保田 千寿"},
    "impression": {"S": "すっきりとした辛口。食事に合わせやすい。"},
    "rating": {"S": "好き"}
  }' \
  --endpoint-url http://localhost:8000 \
  --region us-west-2

aws dynamodb put-item \
  --table-name drinking_records \
  --item '{
    "userId": {"S": "test_user_001"},
    "createdAt": {"S": "2025-01-10T00:00:00Z"},
    "id": {"S": "rec_003"},
    "brand": {"S": "八海山 普通酒"},
    "impression": {"S": "少し辛すぎる。自分の好みではない。"},
    "rating": {"S": "合わない"}
  }' \
  --endpoint-url http://localhost:8000 \
  --region us-west-2

echo ""
echo "✅ テストデータを投入しました（3件）"
echo ""

# データの確認
echo "5. データの確認..."
aws dynamodb query \
  --table-name drinking_records \
  --key-condition-expression "userId = :userId" \
  --expression-attribute-values '{":userId":{"S":"test_user_001"}}' \
  --endpoint-url http://localhost:8000 \
  --region us-west-2 \
  --output json | jq '.Items | length'

echo "件のレコードが登録されています"
echo ""
echo "================================"
echo "セットアップ完了！"
echo "================================"
echo ""
echo "次のステップ:"
echo "  1. Sake Agentを起動: docker-compose up -d sake-agent"
echo "  2. APIをテスト: curl -X POST http://localhost:3000/api/agent/recommend ..."
