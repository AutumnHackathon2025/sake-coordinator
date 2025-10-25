# プロジェクト構造

## 組織化の原則

- Next.jsフルスタック構成（フロントエンド + API Routes）
- 機能別にファイルを整理（API エンドポイント別）
- 共通ロジックは再利用可能なモジュールとして分離
- インフラコードとアプリケーションコードを明確に分離

## 推奨フォルダ構造

```text
.
├── .kiro/                     # Kiro設定とステアリング
│   └── steering/             # AIアシスタントガイダンス文書
├── docs/                     # プロジェクトドキュメント
│   ├── api-doc.md           # REST API仕様書（必須参照）
│   ├── product.md           # プロダクト機能仕様書（必須参照）
│   └── agent-core.md        # Amazon Bedrock AgentCore技術資料
├── app/                     # Next.jsフルスタックアプリケーション
│   ├── src/
│   │   ├── app/            # App Router（Next.js 13+）
│   │   │   ├── api/       # API Routes（バックエンド）
│   │   │   │   ├── records/    # 飲酒記録関連API
│   │   │   │   ├── uploads/    # ファイルアップロード関連
│   │   │   │   └── ocr/        # OCR処理関連
│   │   │   ├── (pages)/   # フロントエンドページ
│   │   │   └── globals.css
│   │   ├── components/     # Reactコンポーネント
│   │   ├── hooks/          # カスタムフック
│   │   ├── lib/            # ユーティリティライブラリ
│   │   ├── services/       # ビジネスロジック
│   │   ├── stores/         # 状態管理（Zustand）
│   │   ├── types/          # TypeScript型定義
│   │   └── utils/          # 共通ユーティリティ
│   ├── public/             # 静的ファイル
│   ├── Dockerfile          # ECS用Dockerファイル
│   ├── package.json
│   └── next.config.js
├── ai-agent/               # Amazon Bedrock AgentCore (Python + uv + Strands)
│   ├── src/
│   │   ├── agent.py       # メインエージェントロジック（Strands使用）
│   │   ├── agents/        # 個別エージェント実装
│   │   ├── tools/         # カスタムツール実装
│   │   ├── memory/        # メモリ戦略設定
│   │   └── utils/         # ユーティリティ
│   ├── tests/             # Pythonテスト
│   ├── Dockerfile         # AgentCore Runtime用
│   ├── pyproject.toml     # uv設定ファイル
│   ├── uv.lock           # uvロックファイル
│   └── .bedrock_agentcore.yaml  # AgentCore設定
├── infrastructure/         # Terraformインフラコード（prod環境のみ）
│   ├── modules/           # 再利用可能なTerraformモジュール
│   │   ├── ecs/          # ECS関連リソース
│   │   ├── agentcore/    # AgentCore関連リソース
│   │   ├── storage/      # S3, DynamoDB関連
│   │   └── cognito/      # Cognito関連リソース
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── tests/                  # テストファイル
│   ├── app/               # Next.jsアプリテスト
│   ├── ai-agent/          # AIエージェントテスト
│   └── e2e/               # E2Eテスト
└── scripts/               # デプロイ・ビルドスクリプト
```

## 命名規則

### ファイル・フォルダ

- API Routes: `kebab-case` (例: `route.ts`, `create-record/route.ts`)
- ディレクトリ: `kebab-case` (例: `drinking-records/`)
- 設定ファイル: `kebab-case` (例: `next.config.js`)

### コード

- 変数・関数: `camelCase` (例: `getUserId`, `drinkingRecord`)
- 定数: `UPPER_SNAKE_CASE` (例: `MAX_FILE_SIZE`, `API_VERSION`)
- クラス・型: `PascalCase` (例: `DrinkingRecord`, `ApiResponse`)
- 環境変数: `UPPER_SNAKE_CASE` (例: `COGNITO_USER_POOL_ID`)

## 各層の実装方針

### Next.jsフルスタック（ECS）

#### フロントエンド

- **App Router**: Next.js 13+のApp Routerを使用
- **コンポーネント設計**: Atomic Designパターンを採用
- **状態管理**: サーバー状態はReact Query、クライアント状態はZustand
- **認証**: Amazon Cognito + JWT
- **API通信**: 内部API Routes呼び出し

#### バックエンド（API Routes）

各APIエンドポイントはNext.js API Routesとして実装：

**飲酒記録関連**

- `POST /api/records` → `app/src/app/api/records/route.ts`
- `GET /api/records` → `app/src/app/api/records/route.ts`
- `PUT /api/records/[id]` → `app/src/app/api/records/[id]/route.ts`
- `DELETE /api/records/[id]` → `app/src/app/api/records/[id]/route.ts`

**ファイルアップロード関連**

- `POST /api/uploads/presigned-url` → `app/src/app/api/uploads/presigned-url/route.ts`

**OCR関連**

- `POST /api/ocr/menu` → `app/src/app/api/ocr/menu/route.ts`

**推薦関連（AgentCore連携）**

- `POST /agent/recommend` → Amazon Bedrock AgentCore Runtime

### AI Agent（Amazon Bedrock AgentCore + Strands）

- **推薦エンジン**: `POST /agent/recommend`エンドポイント
- **フレームワーク**: Strands（マルチエージェントフレームワーク）
- **パッケージ管理**: uv（高速Pythonパッケージマネージャー）
- **AgentCore Runtime**: Pythonベースのエージェント実装
- **AgentCore Memory**: ユーザーの飲酒履歴を長期記憶として活用
- **AgentCore Gateway**: Next.js API Routesとの連携
- **エージェント構成**: 複数の専門エージェントによる協調処理

### 共通モジュール

- `app/src/utils/auth.ts`: Cognito JWT検証
- `app/src/utils/response.ts`: 統一レスポンス形式
- `app/src/utils/validation.ts`: 入力値検証
- `app/src/types/drinking-record.ts`: データモデル定義

## エラーハンドリング

- 統一されたエラーレスポンス形式を使用（`{error: {code: string, message: string}}`）
- 日本語エラーメッセージを提供
- 適切なHTTPステータスコードの使用（400, 401, 404, 500等）
- ログ出力は構造化ログ（JSON形式）を使用
- エラーコードは意味のある定数として定義（VALIDATION_ERROR等）

## テスト構成

### Next.jsアプリケーション

- **ユニットテスト**: Jest + React Testing Library
- **API Routesテスト**: Jest（エンドポイント単位）
- **コンポーネントテスト**: Storybook
- **E2Eテスト**: Playwright
- **モックデータ**: `tests/fixtures/` に配置

### AI Agent（Python + uv + Strands）

- **ユニットテスト**: pytest（エージェントロジック単位）
- **統合テスト**: AgentCore Runtime経由でのテスト
- **推薦精度テスト**: 実際のデータセットでの評価
- **Strandsテスト**: マルチエージェント協調動作のテスト
- **テスト実行**: `uv run pytest`

## インフラ管理（Terraform）

- **単一環境**: prod環境のみ
- **モジュール化**: 再利用可能なTerraformモジュール
- **状態管理**: S3バックエンドでのstate管理
- **CI/CD**: GitHub ActionsでのTerraform自動実行

## ドキュメント管理

- **docs/api-doc.md**: REST API仕様書（実装時必須参照・準拠）
- **docs/product.md**: プロダクト機能仕様書（実装時必須参照・準拠）
- **docs/agent-core.md**: Amazon Bedrock AgentCore技術資料
- **README.md**: プロジェクト概要とセットアップ手順
- **各コンポーネント**: TSDoc/JSDocコメントを記載
- **複雑なビジネスロジック**: 詳細コメントを追加

## 実装時の重要な注意点

- **API仕様準拠**: docs/api-doc.mdのエンドポイント定義に完全準拠
- **機能仕様準拠**: docs/product.mdの機能要件と異常系処理に完全準拠
- **データモデル準拠**: 飲酒歴、推薦結果、メニューの各データ形式に準拠
- **実装優先順**: 1.推薦機能 → 2.飲酒記録 → 3.OCR → 4.画像管理 → 5.検索
