# 日本酒推薦API 統合ガイド

## 概要

このドキュメントは、Next.jsアプリケーションとAgentCore Runtimeの統合方法を説明します。

## アーキテクチャ

```
Next.js API Route (POST /agent/recommend)
    ↓
1. Cognito JWT認証
    ↓
2. DynamoDBから飲酒履歴を取得
    ↓
3. AgentCore Runtimeを呼び出し
    ↓
4. レスポンスを整形して返却
```

## 環境変数の設定

### Next.js側 (.env.local)

```bash
# AWS設定
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Cognito設定
COGNITO_USER_POOL_ID=ap-northeast-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# AgentCore Runtime設定
AGENTCORE_RUNTIME_ARN=arn:aws:bedrock-agentcore:ap-northeast-1:123456789012:runtime/sake-recommendation-agent
DYNAMODB_TABLE_NAME=drinking_records
```

### AgentCore側 (.env)

```bash
# AWS設定
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Bedrock設定
BEDROCK_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0

# DynamoDB設定（開発環境のみ）
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE_NAME=drinking_records

# ログ設定
LOG_LEVEL=INFO
LOG_FORMAT=json
ENVIRONMENT=development
```

## AgentCoreのデプロイ

### 1. 依存関係のインストール

```bash
cd agentcore
uv sync
```

### 2. ローカルテスト（モック使用）

```bash
# テストスクリプトを実行（AWS認証情報が必要）
uv run python test_local.py
```

### 3. AgentCore Runtimeへのデプロイ

#### Option A: Starter Toolkit使用

```bash
# AgentCoreを設定
agentcore configure --entrypoint src/agent.py

# デプロイ
agentcore launch

# Runtime ARNを取得
agentcore describe
```

#### Option B: 手動デプロイ

```bash
# Dockerイメージをビルド
docker buildx build --platform linux/arm64 -t sake-agent:arm64 --load .

# ECRにプッシュ
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com
docker tag sake-agent:arm64 <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/sake-agent:latest
docker push <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/sake-agent:latest

# AgentCore Runtimeを作成
python deploy_agent.py
```

## Next.jsのセットアップ

### 1. 依存関係のインストール

```bash
cd nextjs
pnpm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、上記の環境変数を設定します。

### 3. 開発サーバーの起動

```bash
pnpm dev
```

## DynamoDBテーブルの作成

### ローカル開発環境（DynamoDB Local）

```bash
# Docker Composeで起動
docker-compose up -d dynamodb-local

# テーブルを作成
aws dynamodb create-table \
  --table-name drinking_records \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=createdAt,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000
```

### 本番環境

```bash
# Terraformでデプロイ（推奨）
cd infrastructure
terraform init
terraform apply

# または、AWS CLIで作成
aws dynamodb create-table \
  --table-name drinking_records \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=createdAt,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-1
```

## APIテスト

### 1. テストデータの投入

```bash
# DynamoDBにテストデータを投入
aws dynamodb put-item \
  --table-name drinking_records \
  --item '{
    "userId": {"S": "test_user_001"},
    "createdAt": {"S": "2025-01-01T00:00:00Z"},
    "id": {"S": "rec_001"},
    "brand": {"S": "獺祭 純米大吟醸"},
    "impression": {"S": "非常にフルーティで飲みやすい"},
    "rating": {"S": "非常に好き"}
  }' \
  --endpoint-url http://localhost:8000
```

### 2. 推薦APIの呼び出し

```bash
# Cognito JWTトークンを取得（実際の認証フローを使用）
TOKEN="your-cognito-jwt-token"

# 推薦APIを呼び出し
curl -X POST http://localhost:3000/api/agent/recommend \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "menu": ["獺祭 純米大吟醸", "十四代 本丸", "黒龍 しずく"]
  }'
```

### 期待されるレスポンス

```json
{
  "recommendations": [
    {
      "brand": "獺祭 純米大吟醸",
      "score": 5,
      "reason": "あなたの「フルーティで飲みやすい」という好みに最も一致します。"
    },
    {
      "brand": "黒龍 しずく",
      "score": 4,
      "reason": "クリアな味わいで、あなたの好みに合うと思います。"
    }
  ]
}
```

## トラブルシューティング

### AgentCore Runtimeへの接続エラー

**エラー**: `AGENTCORE_RUNTIME_ARN環境変数が設定されていません`

**解決策**: `.env.local`に正しいRuntime ARNを設定してください。

```bash
# Runtime ARNを確認
agentcore describe
```

### DynamoDB接続エラー

**エラー**: `飲酒履歴の取得に失敗しました`

**解決策**:
1. DynamoDB Localが起動しているか確認
2. テーブルが作成されているか確認
3. AWS認証情報が正しいか確認

```bash
# DynamoDB Localの確認
docker ps | grep dynamodb

# テーブルの確認
aws dynamodb list-tables --endpoint-url http://localhost:8000
```

### Bedrock接続エラー

**エラー**: `Unable to locate credentials`

**解決策**: AWS認証情報を設定してください。

```bash
# AWS CLIで認証情報を設定
aws configure

# または、環境変数で設定
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
```

### 認証エラー

**エラー**: `401 Unauthorized`

**解決策**:
1. Cognito JWTトークンが有効か確認
2. トークンの有効期限が切れていないか確認
3. Cognito User Pool IDとClient IDが正しいか確認

## パフォーマンス最適化

### キャッシング

AgentCore Memoryを使用して、味の好み分析結果をキャッシュします（TTL: 1時間）。

### 並列処理

DynamoDBクエリとBedrockの呼び出しを並列化して、レスポンス時間を短縮します。

### タイムアウト設定

- API全体: 30秒
- DynamoDBクエリ: 5秒
- Bedrock呼び出し: 15秒

## セキュリティ

### 認証・認可

- すべてのAPIリクエストでCognito JWT認証を必須とします
- ユーザーIDはトークンから抽出し、他のユーザーのデータにアクセスできないようにします

### データ保護

- DynamoDBの暗号化を有効にします
- S3バケットのアクセス制御を適切に設定します
- ログに個人情報を記録しないようにします

## モニタリング

### CloudWatch Metrics

- RecommendationLatency: 推薦処理時間
- RecommendationCount: 推薦実行回数
- ErrorRate: エラー率

### CloudWatch Logs

- 構造化ログ（JSON形式）
- リクエストID、ユーザーIDを含める
- エラー発生時の詳細なスタックトレース

## 次のステップ

1. **テストの実装**: ユニットテスト、統合テスト、E2Eテストを追加
2. **CI/CDの構築**: GitHub Actionsでの自動デプロイ
3. **モニタリングの強化**: CloudWatch Alarmsの設定
4. **パフォーマンステスト**: 負荷テストの実施
