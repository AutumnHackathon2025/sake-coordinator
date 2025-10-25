# 日本酒推薦サービス

Next.jsフルスタックアプリケーションとAmazon Bedrock AgentCoreを組み合わせた日本酒推薦システム

## アーキテクチャ

- **フロントエンド**: Next.js (React + TypeScript)
- **バックエンド**: Next.js API Routes
- **AI Agent**: Amazon Bedrock AgentCore (Python + Strands)
- **データベース**: DynamoDB (本番) / DynamoDB Local (開発)
- **認証**: Amazon Cognito
- **ストレージ**: Amazon S3

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
# プロジェクトルートで実行
cp .env.example .env
# .envファイルを編集して必要な環境変数を設定
```

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