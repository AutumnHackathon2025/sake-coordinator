# 日本酒推薦AI Agent

Amazon Bedrock AgentCoreを使用した日本酒推薦システムのAIエージェント実装

## 技術スタック

- **フレームワーク**: Strands (マルチエージェントフレームワーク)
- **パッケージマネージャー**: uv
- **言語**: Python 3.11+
- **基盤モデル**: Amazon Bedrock (Claude, Titan等)
- **ランタイム**: AgentCore Runtime
- **メモリ**: AgentCore Memory
- **コンテナ**: Docker + Docker Compose

## Docker Compose での開発・運用

### 基本的な使用方法

```bash
# プロジェクトルートから実行

# 開発環境で起動（デフォルト）
compose up sake-agent-dev

# 本番環境で起動
compose --profile prod up sake-agent

# テスト実行
compose --profile test run --rm sake-agent-test

# リンティング
compose --profile lint run --rm sake-agent-lint

# フォーマット
compose --profile format run --rm sake-agent-format

# 型チェック
compose --profile typecheck run --rm sake-agent-typecheck

# LocalStack（AWS サービスのローカル環境）を起動
compose --profile localstack up localstack
```

### 利用可能なプロファイル

- **prod**: 本番環境（sake-agent のみ）
- **test**: テスト環境（sake-agent-test + dynamodb-local）
- **lint**: リンティング実行
- **format**: コードフォーマット実行
- **typecheck**: 型チェック実行
- **localstack**: LocalStack環境（Bedrock用）

### 開発用コマンド

```bash
# プロジェクトルートから実行

# 開発環境でコンテナに入る
compose exec sake-agent-dev bash

# ログを確認
compose logs -f sake-agent-dev

# ファイル変更の監視（ホットリロード）
compose up sake-agent-dev --watch

# コンテナ内でuvスクリプトを直接実行
compose exec sake-agent-dev uv run test      # テスト実行
compose exec sake-agent-dev uv run lint      # リンティング
compose exec sake-agent-dev uv run format    # フォーマット
compose exec sake-agent-dev uv run typecheck # 型チェック
compose exec sake-agent-dev uv run dev       # エージェント実行

# DynamoDB Admin UIにアクセス
# http://localhost:8001

# DynamoDB Localにアクセス
# http://localhost:8000
```

### ビルドとイメージ管理

```bash
# プロジェクトルートから実行

# イメージをビルド（開発用）
compose build sake-agent-dev

# イメージをビルド（本番用）
compose build sake-agent

# 全てのイメージをビルド
compose build

# イメージを削除
compose down --rmi all

# ボリュームも含めて削除
compose down -v --rmi all
```

## ローカル開発セットアップ

### 1. 環境変数の設定

```bash
cp .env.example .env
# .envファイルを編集して必要な環境変数を設定
```

### 2. 開発環境の起動

```bash
# 開発環境を起動（DynamoDB Local + DynamoDB Admin UI も含む）
compose up -d

# ログを確認
compose logs -f sake-agent-dev
```

### 3. AgentCore CLIの設定（本番デプロイ時）

```bash
# AgentCore CLIの設定
agentcore configure

# エージェントデプロイ
agentcore launch

# エージェント呼び出しテスト
agentcore invoke

# リソース削除
agentcore destroy
```

## プロジェクト構造

```
agentcore/
├── src/
│   ├── agents/          # エージェント実装
│   ├── models/          # データモデル
│   ├── services/        # ビジネスロジック
│   ├── utils/           # ユーティリティ
│   └── agent.py         # メインエージェント
├── tests/               # テストファイル
├── config/              # 設定ファイル
└── pyproject.toml       # プロジェクト設定
```

## 機能

- ユーザーの飲酒履歴に基づく日本酒推薦
- 味の好みの学習と分析
- メニューからの最適な銘柄選択支援
- 推薦理由の説明生成

## API使用例

### 日本酒推薦リクエスト

```json
{
  "type": "recommendation",
  "user_id": "test_user_001",
  "drinking_records": [
    {
      "id": "rec_001",
      "user_id": "test_user_001",
      "brand": "獺祭",
      "impression": "フルーティーで飲みやすい",
      "rating": "非常に好き",
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "rec_002",
      "user_id": "test_user_001",
      "brand": "久保田",
      "impression": "すっきりとした味わい",
      "rating": "好き",
      "created_at": "2025-01-02T00:00:00Z"
    }
  ],
  "menu_brands": ["獺祭", "久保田", "十四代", "八海山"],
  "max_recommendations": 3
}
```

### 味の好み分析リクエスト

```json
{
  "type": "taste_analysis",
  "user_id": "test_user_001",
  "drinking_records": [
    {
      "id": "rec_001",
      "user_id": "test_user_001",
      "brand": "獺祭",
      "impression": "フルーティーで飲みやすい",
      "rating": "非常に好き",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**注意**: 飲酒記録データは、Next.js API Routesから取得したデータをリクエストペイロードに含めて送信してください。エージェント側ではDynamoDBへの直接アクセスは行いません。
## クイックスタート

### Docker開発
1. 環境変数の設定: `cp .env.example .env` (値を編集)
2. 開発環境の起動: `compose up -d`
3. ログの確認: `compose logs -f sake-agent-dev`
4. テストの実行: `compose --profile test run --rm sake-agent-test`

### 本番デプロイ
1. 環境変数の設定: `cp .env.example .env` (値を編集)
2. 本番用イメージのビルド: `compose build sake-agent`
3. 本番環境の起動: `compose --profile prod up -d sake-agent`

### 便利なURL
- **Next.js アプリ**: http://localhost:3000
- **DynamoDB Admin UI**: http://localhost:8001 (開発環境時)
- **DynamoDB Local**: http://localhost:8000 (AWS API エンドポイント)
- **LocalStack**: http://localhost:4566 (Bedrock用、オプション)
- **エージェント**: http://localhost:8000 (開発環境時)
#
# uvスクリプト

pyproject.tomlで定義されたスクリプトを使用して、開発タスクを簡単に実行できます：

### ローカル開発（agentcoreディレクトリ内）

```bash
# 依存関係のインストール
uv sync --extra dev

# 各種タスクの実行
uv run test        # テスト実行
uv run lint        # リンティング
uv run lint-fix    # リンティング（自動修正）
uv run format      # コードフォーマット
uv run format-check # フォーマットチェック
uv run typecheck   # 型チェック
uv run dev         # エージェント実行
```

### Docker環境

```bash
# プロジェクトルートから実行

# コンテナ内でuvスクリプトを実行
compose exec sake-agent-dev uv run test
compose exec sake-agent-dev uv run lint
compose exec sake-agent-dev uv run format
compose exec sake-agent-dev uv run typecheck

# または、プロファイルを使用（推奨）
compose --profile test run --rm sake-agent-test
compose --profile lint run --rm sake-agent-lint
compose --profile format run --rm sake-agent-format
compose --profile typecheck run --rm sake-agent-typecheck
```