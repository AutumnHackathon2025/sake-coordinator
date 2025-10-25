# Sake Coordinator - DynamoDB Local 開発環境

このプロジェクトはNext.jsアプリケーションとDynamoDB Localを使用したローカル開発環境です。

## 📋 前提条件

- Docker
- Docker Compose

## 🚀 開始方法

### 1. プロジェクトのクローンと移動
```bash
cd /Users/shunsuke.a.wakamatsu/programs/autum-hackathon/sake-coordinator
```

### 2. Docker Composeでサービスを起動
```bash
docker-compose up --build
```

## 🔧 サービス

### Next.js アプリケーション
- **URL**: http://localhost:3000
- **テストページ**: http://localhost:3000/dynamodb-test
- DynamoDB Localに接続するWebアプリケーション

### DynamoDB Local
- **URL**: http://localhost:8000
- ローカル開発用のDynamoDBインスタンス
- データは`dynamodb-data`ボリュームに永続化されます

### DynamoDB Admin
- **URL**: http://localhost:8001
- DynamoDB LocalのWeb管理インターface
- テーブルやデータの管理に使用

## 🧪 動作確認

1. http://localhost:3000/dynamodb-test にアクセス
2. 「テーブル作成」ボタンをクリックしてテーブルを作成
3. アイテムを追加・削除してDynamoDB操作を確認
4. http://localhost:8001 でDynamoDB Adminからもデータを確認可能

## 📁 プロジェクト構造

```
.
├── compose.yaml              # Docker Compose設定
├── nextjs/
│   ├── Dockerfile           # Next.js用Dockerfile
│   ├── package.json         # 依存関係（AWS SDK含む）
│   ├── .env.local          # 環境変数（ローカル開発用）
│   └── src/
│       ├── app/
│       │   ├── api/
│       │   │   └── dynamodb/
│       │   │       └── route.ts    # DynamoDB API エンドポイント
│       │   └── dynamodb-test/
│       │       └── page.tsx        # テスト用フロントエンド
│       └── lib/
│           └── dynamodb.ts         # DynamoDB接続設定
```

## 🔌 API エンドポイント

### GET /api/dynamodb
- `?action=list-tables` - テーブル一覧取得
- `?action=create-table` - テーブル作成
- `?action=get-all` - 全アイテム取得
- `?action=get-item&id={id}` - 特定アイテム取得

### POST /api/dynamodb
- アイテム追加
- Body: `{"name": "名前", "description": "説明"}`

### DELETE /api/dynamodb
- `?id={id}` - 特定アイテム削除

## 🛠️ 開発時のTips

### 依存関係の追加
```bash
cd nextjs
pnpm install <package-name>
docker-compose up --build  # 再ビルドが必要
```

### ログの確認
```bash
docker-compose logs nextjs        # Next.jsのログ
docker-compose logs dynamodb-local  # DynamoDBのログ
```

### DynamoDBデータの初期化
```bash
docker-compose down -v  # ボリュームも削除
docker-compose up --build
```

## 🌐 本番環境への展開

本番環境では、`.env.local`の設定を以下のように変更してください：

```env
# DYNAMODB_ENDPOINT=（コメントアウト - AWS DynamoDBを使用）
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=（実際のアクセスキー）
AWS_SECRET_ACCESS_KEY=（実際のシークレットキー）
```

## 📚 参考資料

- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/index.html)
- [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)