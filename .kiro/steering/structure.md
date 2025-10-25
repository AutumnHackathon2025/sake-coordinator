---
inclusion: always
---

# Project Structure & Architecture Guidelines

## Core Architecture

This is a Japanese sake recommendation service with Next.js fullstack app + Amazon Bedrock AgentCore AI agent.

**CRITICAL**: Always reference `docs/api-doc.md` and `docs/product.md` before implementing any features.

## Current Project Structure

```text
nextjs/                    # Next.js fullstack application (current workspace)
├── src/app/              # App Router (Next.js 13+)
│   ├── api/             # API Routes (backend)
│   │   ├── records/     # Drinking records API
│   │   ├── uploads/     # File upload API  
│   │   └── ocr/         # OCR processing API
│   ├── (pages)/         # Frontend pages
│   ├── components/      # React components
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utility libraries
│   ├── services/        # Business logic
│   ├── stores/          # State management (Zustand)
│   ├── types/           # TypeScript definitions
│   └── utils/           # Common utilities
├── public/              # Static files
└── package.json
```

**Future Structure** (when expanding):
- `ai-agent/` - Amazon Bedrock AgentCore (Python + uv + Strands)
- `infrastructure/` - Terraform (prod only)
- `docs/` - API specs and product requirements

## Naming Conventions

- **Files/Folders**: `kebab-case` (`route.ts`, `drinking-records/`)
- **Variables/Functions**: `camelCase` (`getUserId`, `drinkingRecord`)
- **Constants**: `UPPER_SNAKE_CASE` (`MAX_FILE_SIZE`, `API_VERSION`)
- **Types/Classes**: `PascalCase` (`DrinkingRecord`, `ApiResponse`)
- **Environment Variables**: `UPPER_SNAKE_CASE` (`COGNITO_USER_POOL_ID`)

## Implementation Guidelines

### API Routes Structure
Create API endpoints following this pattern:
- `POST /api/records` → `src/app/api/records/route.ts`
- `GET /api/records` → `src/app/api/records/route.ts`
- `PUT /api/records/[id]` → `src/app/api/records/[id]/route.ts`
- `DELETE /api/records/[id]` → `src/app/api/records/[id]/route.ts`
- `POST /api/uploads/presigned-url` → `src/app/api/uploads/presigned-url/route.ts`
- `POST /api/ocr/menu` → `src/app/api/ocr/menu/route.ts`

### Frontend Architecture
- **App Router**: Use Next.js 13+ App Router exclusively
- **Components**: Atomic Design pattern (atoms/molecules/organisms)
- **State Management**: React Query (server state) + Zustand (client state)
- **Authentication**: Amazon Cognito + JWT validation
- **Styling**: TailwindCSS

### Required Utility Modules
- `src/utils/auth.ts`: Cognito JWT validation
- `src/utils/response.ts`: Unified API response format
- `src/utils/validation.ts`: Input validation
- `src/types/drinking-record.ts`: Core data models

## Error Handling Standards

**MANDATORY**: All API responses must use this exact format:
```typescript
// Success response
{ data: T }

// Error response  
{ error: { code: string, message: string } }
```

**Requirements**:
- Japanese error messages for user-facing errors
- Proper HTTP status codes (400, 401, 404, 500)
- Structured JSON logging
- Meaningful error codes as constants (e.g., `VALIDATION_ERROR`, `UNAUTHORIZED`)

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
