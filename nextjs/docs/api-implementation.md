# API実装ドキュメント

## POST /api/agent/recommend

日本酒推薦エンドポイントの実装詳細

### 概要

メニューリストとユーザーの飲酒履歴に基づいて、おすすめの日本酒を推薦します。

### 実装構成

#### 1. 認証ミドルウェア (`src/utils/auth.ts`)

- Authorizationヘッダーからトークンを抽出
- Cognito JWTトークンの検証（署名、有効期限、issuer、audience）
- トークンからユーザーID（sub）を抽出
- 認証エラー時は401 Unauthorizedを返す

#### 2. リクエストバリデーション (`src/utils/validation.ts`)

- リクエストボディのパース
- menuフィールドの存在チェック
- menuが配列であることを確認
- menuが空でないことを確認
- 各銘柄が1-64文字であることを確認
- バリデーションエラー時は400 Bad Requestを返す

#### 3. AgentCore Runtime呼び出し (`src/services/agentcore-service.ts`)

- AWS SDK for JavaScriptを使用
- `@aws-sdk/client-bedrock-agent-runtime`の`InvokeAgentCommand`を実行
- user_idとmenuを渡す
- max_recommendations=10を指定
- タイムアウト設定（AWS SDKのデフォルト）

#### 4. レスポンス整形 (`src/utils/transform.ts`)

- AgentCoreのレスポンスをAPI仕様書の形式に変換
- `{"recommendations": [{"brand": "...", "score": ..., "reason": "..."}]}`
- Content-Type: application/jsonを設定
- 200 OKステータスコードを返す

#### 5. エラーハンドリング (`src/utils/response.ts`)

- 認証エラー: 401 Unauthorized
- バリデーションエラー: 400 Bad Request
- AgentCoreエラー: 500 Internal Server Error
- 統一されたエラーレスポンス形式（error.code, error.message）
- 日本語エラーメッセージ

### リクエスト例

```bash
curl -X POST http://localhost:3000/api/agent/recommend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "menu": [
      "獺祭 純米大吟醸",
      "十四代 本丸",
      "黒龍 しずく",
      "八海山 普通酒"
    ]
  }'
```

### レスポンス例

#### 成功時 (200 OK)

```json
{
  "recommendations": [
    {
      "brand": "獺祭 純米大吟醸",
      "score": 5,
      "reason": "あなたの「フルーティで香りが高い」という好みに最も一致します。"
    },
    {
      "brand": "黒龍 しずく",
      "score": 4,
      "reason": "「飲みやすい」という感想に近く、クリアな味わいがおすすめです。"
    }
  ]
}
```

#### エラー時 (401 Unauthorized)

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認証トークンが見つかりません"
  }
}
```

#### エラー時 (400 Bad Request)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "メニューを入力してください"
  }
}
```

#### エラー時 (500 Internal Server Error)

```json
{
  "error": {
    "code": "AGENT_ERROR",
    "message": "推薦処理に失敗しました"
  }
}
```

### 環境変数

以下の環境変数を`.env.local`に設定する必要があります：

```bash
# AWS設定
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Cognito設定
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id

# AgentCore Runtime設定
AGENTCORE_RUNTIME_ID=your-runtime-id
```

### テスト方法

1. 環境変数を設定
2. Next.jsサーバーを起動: `pnpm dev`
3. 有効なCognito JWTトークンを取得
4. curlまたはPostmanでエンドポイントを呼び出し

### 依存パッケージ

- `@aws-sdk/client-bedrock-agent-runtime`: AgentCore Runtime呼び出し
- `jose`: JWT検証

### セキュリティ考慮事項

- すべてのリクエストでCognito JWT認証が必須
- トークンの署名、有効期限、issuer、audienceを検証
- ユーザーIDはトークンから抽出（改ざん不可）
- エラーメッセージは適切に抽象化（内部情報の漏洩を防ぐ）
