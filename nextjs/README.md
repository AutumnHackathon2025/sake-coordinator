# 🍶 味で楽しむ日本酒おすすめサービス - Next.js Frontend

日本酒推薦サービスのNext.jsフロントエンドアプリケーションです。

## 概要

このアプリケーションは、ユーザーの飲酒履歴と味の好みに基づいて、最適な日本酒を推薦するサービスのフロントエンドです。

### 主要機能

1. **日本酒推薦**: メニューとユーザー履歴に基づくAI推薦
2. **飲酒記録**: 銘柄、感想、評価の記録管理
3. **メニューOCR**: 画像からの銘柄自動抽出
4. **ラベル画像管理**: 飲酒記録への画像紐付け
5. **履歴検索**: 過去の飲酒記録の検索機能

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **スタイリング**: TailwindCSS
- **認証**: Amazon Cognito
- **データベース**: Amazon DynamoDB
- **AI Agent**: Amazon Bedrock AgentCore Runtime
- **ストレージ**: Amazon S3

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定します：

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

# 開発環境（DynamoDB Local使用時）
DYNAMODB_ENDPOINT=http://localhost:8000
```

### 3. 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## API エンドポイント

### 推薦API

**POST /api/agent/recommend**

メニューリストとユーザーの飲酒履歴に基づいて、おすすめの日本酒を推薦します。

```bash
curl -X POST http://localhost:3000/api/agent/recommend \
  -H "Authorization: Bearer <cognito-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "menu": ["獺祭 純米大吟醸", "十四代 本丸", "黒龍 しずく"]
  }'
```

レスポンス例：

```json
{
  "recommendations": [
    {
      "brand": "獺祭 純米大吟醸",
      "score": 5,
      "reason": "あなたの「フルーティで飲みやすい」という好みに最も一致します。"
    }
  ]
}
```

### その他のAPI

- **POST /api/records**: 飲酒記録の作成
- **GET /api/records**: 飲酒記録の取得
- **PUT /api/records/{id}**: 飲酒記録の更新
- **DELETE /api/records/{id}**: 飲酒記録の削除
- **POST /api/uploads/presigned-url**: S3アップロード用URL取得
- **POST /api/ocr/menu**: メニュー画像のOCR処理

詳細は [docs/api-doc.md](../docs/api-doc.md) を参照してください。

## プロジェクト構造

```
nextjs/
├── src/
│   ├── app/              # App Router
│   │   ├── api/         # API Routes
│   │   │   ├── agent/   # AgentCore連携
│   │   │   ├── records/ # 飲酒記録API
│   │   │   ├── uploads/ # ファイルアップロード
│   │   │   └── ocr/     # OCR処理
│   │   └── (pages)/     # フロントエンドページ
│   ├── components/      # Reactコンポーネント
│   ├── services/        # ビジネスロジック
│   ├── utils/           # ユーティリティ
│   └── types/           # TypeScript型定義
├── public/              # 静的ファイル
└── package.json
```

## 開発ガイドライン

### コーディング規約

- **ファイル/フォルダ**: `kebab-case`
- **変数/関数**: `camelCase`
- **定数**: `UPPER_SNAKE_CASE`
- **型/クラス**: `PascalCase`

### エラーハンドリング

すべてのAPIレスポンスは統一されたエラー形式を使用します：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ（日本語）"
  }
}
```

### 認証

すべてのAPIリクエストは、Cognito JWTトークンを`Authorization`ヘッダーに含める必要があります：

```
Authorization: Bearer <jwt-token>
```

## テスト

```bash
# ユニットテスト
pnpm test

# E2Eテスト
pnpm test:e2e

# リンティング
pnpm lint

# 型チェック
pnpm type-check
```

## ビルド

```bash
# プロダクションビルド
pnpm build

# ビルドの起動
pnpm start
```

## Docker

```bash
# Dockerイメージのビルド
docker build -t sake-nextjs .

# コンテナの起動
docker run -p 3000:3000 sake-nextjs
```

## トラブルシューティング

### AgentCore接続エラー

**エラー**: `AGENTCORE_RUNTIME_ARN環境変数が設定されていません`

**解決策**: `.env.local`に正しいRuntime ARNを設定してください。

### DynamoDB接続エラー

**エラー**: `飲酒履歴の取得に失敗しました`

**解決策**:
1. DynamoDB Localが起動しているか確認
2. AWS認証情報が正しいか確認

### 認証エラー

**エラー**: `401 Unauthorized`

**解決策**: Cognito JWTトークンが有効か確認してください。

## 関連ドキュメント

- [API仕様書](../docs/api-doc.md)
- [プロダクト仕様書](../docs/product.md)
- [AgentCore統合ガイド](../agentcore/README_INTEGRATION.md)

## ライセンス

MIT
