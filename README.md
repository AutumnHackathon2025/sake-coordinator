# 日本酒推薦サービス

Next.jsフルスタックアプリケーションとAmazon Bedrock AgentCoreを組み合わせた日本酒推薦システム

## アーキテクチャ

- **フロントエンド**: Next.js (React + TypeScript)
- **バックエンド**: Next.js API Routes
- **AI Agent**: Amazon Bedrock AgentCore (Python + Strands)
- **データベース**: DynamoDB (本番) / DynamoDB Local (開発)
- **認証**: Amazon Cognito
- **ストレージ**: Amazon S3

## DynamoDBスキーマ

### テーブル名
- **開発環境**: `sake-recommendation-dev-drinking-records`
- **本番環境**: `sake-recommendation-prod-drinking-records`

### スキーマ設計

#### パーティションキー・ソートキー
- **PK (Partition Key)**: `userId` (String) - ユーザーID
- **SK (Sort Key)**: `recordId` (String) - 記録ID（UUID v4形式）

#### 属性
| 属性名 | 型 | 必須 | 説明 |
|--------|-----|------|------|
| userId | String | ✓ | ユーザーID（Cognito Sub） |
| recordId | String | ✓ | 記録ID（UUID v4） |
| sakeName | String | ✓ | 日本酒の銘柄名（1-64文字） |
| impression | String | ✓ | 味の感想（1-1000文字） |
| rating | String | ✓ | 評価（LOVE/LIKE/DISLIKE/HATE） |
| imageUrl | String | - | ラベル画像URL（S3） |
| createdAt | String | ✓ | 作成日時（ISO 8601形式） |
| updatedAt | String | ✓ | 更新日時（ISO 8601形式） |

#### 評価値の定義
- `LOVE`: 非常に好き
- `LIKE`: 好き
- `DISLIKE`: 合わない
- `HATE`: 非常に合わない

### API仕様との整合性

このDynamoDBスキーマは`docs/api-doc.md`で定義されているAPI仕様と完全に整合しています：

- **POST /api/records**: 新規記録作成時に`recordId`（UUID）を自動生成
- **GET /api/records**: `userId`でクエリし、全記録を取得
- **GET /api/records/:recordId**: `userId`と`recordId`で特定の記録を取得
- **PUT /api/records/:recordId**: `userId`と`recordId`で記録を更新
- **DELETE /api/records/:recordId**: `userId`と`recordId`で記録を削除

### データアクセスパターン

1. **ユーザーの全記録取得**: Query操作で`userId`を指定
2. **特定記録の取得**: GetItem操作で`userId`と`recordId`を指定
3. **記録の作成**: PutItem操作で新規UUID生成
4. **記録の更新**: UpdateItem操作で既存レコードを更新
5. **記録の削除**: DeleteItem操作で指定レコードを削除

## プロジェクト構造

```
├── nextjs/                 # Next.jsフルスタックアプリケーション
│   ├── src/app/           # App Router
│   ├── src/components/    # Reactコンポーネント
│   └── src/services/      # ビジネスロジック
├── agentcore/             # AI Agent (Python + Strands)
│   ├── src/agents/        # エージェント実装
│   ├── src/models/        # データモデル
│   └── src/services/      # AIサービス
├── docs/                  # ドキュメント
│   ├── api-doc.md         # API仕様書
│   └── product.md         # プロダクト仕様書
└── compose.yaml           # Docker Compose設定
```

## クイックスタート

### 1. 環境変数の設定

```bash
# Next.js環境変数の設定
cd nextjs
cp .env.example .env.local
# .env.localファイルを編集して必要な環境変数を設定

# AgentCore環境変数の設定
cd ../agentcore
cp .env.example .env
# .envファイルを編集して必要な環境変数を設定
```

#### 必須環境変数（Next.js）

- `DYNAMODB_TABLE_NAME`: DynamoDBテーブル名
- `AWS_REGION`: AWSリージョン
- `DYNAMODB_ENDPOINT`: DynamoDB Localのエンドポイント（開発時のみ）
- `COGNITO_USER_POOL_ID`: CognitoユーザープールID
- `COGNITO_CLIENT_ID`: CognitoクライアントID

### 2. 開発環境の起動

```bash
# 全サービスを起動（Next.js + AgentCore + DynamoDB）
compose up -d

# ログを確認
compose logs -f
```

### 3. アクセス

- **Next.js アプリ**: http://localhost:3000
- **DynamoDB Admin UI**: http://localhost:8001
- **AgentCore**: http://localhost:8000 (開発時)

## 開発コマンド

### 基本操作

```bash
# 全サービス起動
compose up -d

# 特定のサービスのみ起動
compose up nextjs sake-agent-dev

# ログ確認
compose logs -f nextjs
compose logs -f sake-agent-dev

# コンテナに入る
compose exec nextjs bash
compose exec sake-agent-dev bash

# サービス停止
compose down
```

### AgentCore開発

```bash
# テスト実行
compose --profile test run --rm sake-agent-test
# または
compose exec sake-agent-dev uv run test

# リンティング
compose --profile lint run --rm sake-agent-lint
# または
compose exec sake-agent-dev uv run lint

# フォーマット
compose --profile format run --rm sake-agent-format
# または
compose exec sake-agent-dev uv run format

# 型チェック
compose --profile typecheck run --rm sake-agent-typecheck
# または
compose exec sake-agent-dev uv run typecheck

# ホットリロード付きで起動
compose up sake-agent-dev --watch
```

### 本番環境

```bash
# 本番用サービス起動
compose --profile prod up -d sake-agent nextjs
```

## 利用可能なプロファイル

- **prod**: 本番環境
- **test**: テスト環境
- **lint**: リンティング実行
- **format**: コードフォーマット実行
- **typecheck**: 型チェック実行
- **localstack**: LocalStack環境（Bedrock用）

## 機能

### Next.jsアプリケーション
- 飲酒記録の管理
- 日本酒推薦の表示
- メニュー画像のOCR処理
- ユーザー認証（Cognito）

### AI Agent (AgentCore)
- ユーザーの飲酒履歴に基づく推薦
- 味の好みの学習と分析
- メニューからの最適な銘柄選択支援
- 推薦理由の説明生成

## 開発ガイドライン

- **API仕様**: `docs/api-doc.md`を参照
- **プロダクト仕様**: `docs/product.md`を参照
- **技術スタック**: `.kiro/steering/tech.md`を参照
- **プロジェクト構造**: `.kiro/steering/structure.md`を参照

## トラブルシューティング

### ポート競合
- Next.js: 3000
- DynamoDB Local: 8000
- DynamoDB Admin: 8001
- AgentCore: 8000 (開発時)
- LocalStack: 4566

### よくある問題
1. **DynamoDBに接続できない**: DynamoDB Localが起動しているか確認
2. **AgentCoreが起動しない**: 環境変数が正しく設定されているか確認
3. **ビルドエラー**: `compose build --no-cache`でキャッシュをクリア