# 技術スタック

## アーキテクチャ

Next.jsフルスタックアプリケーション（ECS）とAI Agent（Amazon Bedrock AgentCore）を組み合わせた構成

### インフラ構成

- **アプリケーション**: Amazon ECS上のNext.jsフルスタックアプリ
- **AI Agent**: Amazon Bedrock AgentCore（推薦エンジン）
- **認証**: Amazon Cognito
- **ストレージ**: Amazon S3（画像ファイル保存）
- **データベース**: Amazon DynamoDB（飲酒記録データ）
- **IaC**: Terraform（prod環境のみ）

### Next.jsフルスタック技術

- **フレームワーク**: Next.js（React + API Routes）
- **フロントエンド**: React + TypeScript
- **バックエンド**: Next.js API Routes（サーバーサイド）
- **コンテナ**: Docker（ECS上で実行）
- **スタイリング**: TailwindCSS
- **状態管理**: React Query + Zustand
- **型チェック**: TypeScript

### AI Agent技術（Amazon Bedrock AgentCore）

- **言語**: Python
- **パッケージマネージャー**: uv（高速なPythonパッケージマネージャー）
- **フレームワーク**: Strands（マルチエージェントフレームワーク）
- **AgentCore Runtime**: AI Agentのホスティング環境
- **AgentCore Memory**: 短期・長期記憶管理
- **AgentCore Gateway**: Next.js API Routesとの連携
- **AgentCore Identity**: ID・アクセス管理
- **基盤モデル**: Amazon Bedrock（Claude, Titan等）

## API設計原則

- REST APIの設計原則に従う
- エラーレスポンスの統一（error.code, error.message）
- 日本語エラーメッセージの提供
- 適切なHTTPステータスコードの使用

## セキュリティ要件

- 全エンドポイントでCognito JWT認証必須
- S3 Pre-signed URLによる安全なファイルアップロード
- CORS設定の適切な管理
- 入力値バリデーションの徹底

## パフォーマンス要件

- API応答時間: 通常処理は3秒以内
- 推薦処理: 10秒以内
- ファイルアップロード: 最大20MB対応
- 同時接続数: 100リクエスト/秒を想定

## 開発ツール

### Next.js
- **パッケージマネージャー**: npm / yarn
- **リンティング**: ESLint, Prettier
- **テスト**: Jest / Vitest
- **型チェック**: TypeScript

### AI Agent (Python)
- **パッケージマネージャー**: uv
- **リンティング**: ruff, black
- **テスト**: pytest
- **型チェック**: mypy

## 共通コマンド

### フロントエンド（Next.js）
```bash
# ローカル開発
npm run dev

# ビルド
npm run build

# テスト実行
npm test

# リンティング
npm run lint

# 型チェック
npm run type-check
```

### インフラ（Terraform）
```bash
# 初期化
terraform init

# プラン確認
terraform plan

# デプロイ
terraform apply

# 破棄
terraform destroy
```

### AI Agent（Python + uv + Strands）
```bash
# 依存関係インストール
uv sync

# ローカル開発実行
uv run python src/agent.py

# テスト実行
uv run pytest

# リンティング
uv run ruff check
uv run black --check .

# 型チェック
uv run mypy src/

# AgentCore CLI設定
agentcore configure

# エージェントデプロイ
agentcore launch

# エージェント呼び出しテスト
agentcore invoke

# リソース削除
agentcore destroy
```

## 環境変数

### フロントエンド
- `NEXT_PUBLIC_API_URL`: APIエンドポイントURL
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`: CognitoユーザープールID
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`: CognitoクライアントID

### Next.jsサーバーサイド
- `COGNITO_USER_POOL_ID`: Cognitoユーザープール
- `S3_BUCKET_NAME`: ファイル保存用S3バケット
- `DYNAMODB_TABLE_NAME`: 飲酒記録テーブル
- `AGENTCORE_RUNTIME_ID`: AgentCore RuntimeのID
- `AGENTCORE_MEMORY_ID`: AgentCore MemoryのID
- `AWS_REGION`: AWSリージョン