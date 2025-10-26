# Design Document

## Overview

このドキュメントは、TerraformのDynamoDBスキーマ定義とNext.jsアプリケーションのデータモデルを整合させるための設計を定義します。主な課題は以下の通りです：

1. **命名規則の不整合**: Terraformではスネークケース（`sake_name`, `created_at`）、API仕様書ではキャメルケース（`brand`, `createdAt`）
2. **キー名の不一致**: 型定義では`id`を使用しているが、Terraformでは`recordId`
3. **変換レイヤーの欠如**: DynamoDBスキーマとAPI仕様書の間の変換処理が未実装

この設計では、DynamoDBの実際のスキーマに準拠しつつ、既存のAPI仕様書との互換性を保つための変換レイヤーを実装します。

## Architecture

### レイヤー構造

```
┌─────────────────────────────────────┐
│   Frontend / API Client             │
│   (キャメルケース: brand, rating)    │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│   API Routes Layer                  │
│   - /api/records (CRUD)             │
│   - リクエスト/レスポンス処理        │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│   Transform Layer (新規)            │
│   - API型 ⇔ DynamoDB型の変換       │
│   - キャメルケース ⇔ スネークケース │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│   DynamoDB Service Layer (新規)     │
│   - CRUD操作                        │
│   - GSIクエリ                       │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│   DynamoDB                          │
│   (スネークケース: sake_name, etc)  │
│   - PK: userId                      │
│   - SK: recordId                    │
└─────────────────────────────────────┘
```

## Components and Interfaces

### 1. 型定義の分離

#### 1.1 DynamoDB型定義 (新規作成)

**ファイル**: `nextjs/src/types/dynamodb.ts`

```typescript
/**
 * DynamoDBテーブルの実際のスキーマに準拠した型定義
 * Terraformのスキーマ定義と完全に一致させる
 */

export type DynamoDBRating = "VERY_GOOD" | "GOOD" | "BAD" | "VERY_BAD";

export interface DynamoDBDrinkingRecord {
  // Primary Keys
  userId: string;           // Partition Key
  recordId: string;         // Sort Key
  
  // Attributes (スネークケース)
  sake_name: string;        // 銘柄
  impression: string;       // 感想
  rating: DynamoDBRating;   // 評価
  label_image_key?: string; // ラベル画像キー
  created_at: string;       // ISO 8601
  updated_at: string;       // ISO 8601
}

// GSI用のクエリパラメータ型
export interface QueryBySakeNameParams {
  sake_name: string;
  created_at?: {
    from?: string;
    to?: string;
  };
}

export interface QueryByRatingParams {
  rating: DynamoDBRating;
  created_at?: {
    from?: string;
    to?: string;
  };
}
```

#### 1.2 API型定義 (既存を維持)

**ファイル**: `nextjs/src/types/api.ts`

既存のAPI仕様書に準拠した型定義を維持します。

```typescript
export interface DrinkingRecord {
  id: string;              // recordIdから変換
  userId: string;
  brand: string;           // sake_nameから変換
  impression: string;
  rating: Rating;
  labelImageKey?: string;  // label_image_keyから変換
  createdAt: string;       // created_atから変換
  updatedAt: string;       // updated_atから変換
}
```

### 2. 変換レイヤー

**ファイル**: `nextjs/src/utils/transform.ts` (既存ファイルを拡張)

```typescript
import { DrinkingRecord } from "@/types/api";
import { DynamoDBDrinkingRecord } from "@/types/dynamodb";

/**
 * DynamoDB型からAPI型への変換
 */
export function fromDynamoDBRecord(
  dbRecord: DynamoDBDrinkingRecord
): DrinkingRecord {
  return {
    id: dbRecord.recordId,
    userId: dbRecord.userId,
    brand: dbRecord.sake_name,
    impression: dbRecord.impression,
    rating: dbRecord.rating,
    labelImageKey: dbRecord.label_image_key,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
  };
}

/**
 * API型からDynamoDB型への変換
 */
export function toDynamoDBRecord(
  apiRecord: Partial<DrinkingRecord>,
  userId: string,
  recordId?: string
): Partial<DynamoDBDrinkingRecord> {
  const now = new Date().toISOString();
  
  return {
    ...(recordId && { recordId }),
    userId,
    ...(apiRecord.brand && { sake_name: apiRecord.brand }),
    ...(apiRecord.impression && { impression: apiRecord.impression }),
    ...(apiRecord.rating && { rating: apiRecord.rating }),
    ...(apiRecord.labelImageKey && { label_image_key: apiRecord.labelImageKey }),
    ...(apiRecord.createdAt && { created_at: apiRecord.createdAt }),
    updated_at: now,
  };
}
```

### 3. DynamoDBサービスレイヤー

**ファイル**: `nextjs/src/services/dynamodb-records.ts` (新規作成)

```typescript
import { dynamodbDoc } from "@/lib/dynamodb";
import { 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand, 
  DeleteCommand 
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBDrinkingRecord } from "@/types/dynamodb";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "sake-recommendation-dev-drinking-records";

export class DynamoDBRecordsService {
  /**
   * 飲酒記録を作成
   */
  async createRecord(record: DynamoDBDrinkingRecord): Promise<DynamoDBDrinkingRecord> {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: record,
    });
    
    await dynamodbDoc.send(command);
    return record;
  }

  /**
   * ユーザーの全記録を取得
   */
  async getRecordsByUserId(userId: string): Promise<DynamoDBDrinkingRecord[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false, // 新しい順
    });
    
    const result = await dynamodbDoc.send(command);
    return (result.Items || []) as DynamoDBDrinkingRecord[];
  }

  /**
   * 特定の記録を取得
   */
  async getRecord(userId: string, recordId: string): Promise<DynamoDBDrinkingRecord | null> {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        recordId,
      },
    });
    
    const result = await dynamodbDoc.send(command);
    return (result.Item as DynamoDBDrinkingRecord) || null;
  }

  /**
   * 銘柄で検索 (GSI使用)
   */
  async queryBySakeName(
    sakeName: string,
    dateRange?: { from?: string; to?: string }
  ): Promise<DynamoDBDrinkingRecord[]> {
    let keyConditionExpression = "sake_name = :sakeName";
    const expressionAttributeValues: any = {
      ":sakeName": sakeName,
    };

    if (dateRange?.from && dateRange?.to) {
      keyConditionExpression += " AND created_at BETWEEN :from AND :to";
      expressionAttributeValues[":from"] = dateRange.from;
      expressionAttributeValues[":to"] = dateRange.to;
    }

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "sake_name-created_at-index",
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });
    
    const result = await dynamodbDoc.send(command);
    return (result.Items || []) as DynamoDBDrinkingRecord[];
  }

  /**
   * 評価で検索 (GSI使用)
   */
  async queryByRating(
    rating: string,
    dateRange?: { from?: string; to?: string }
  ): Promise<DynamoDBDrinkingRecord[]> {
    let keyConditionExpression = "rating = :rating";
    const expressionAttributeValues: any = {
      ":rating": rating,
    };

    if (dateRange?.from && dateRange?.to) {
      keyConditionExpression += " AND created_at BETWEEN :from AND :to";
      expressionAttributeValues[":from"] = dateRange.from;
      expressionAttributeValues[":to"] = dateRange.to;
    }

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "rating-created_at-index",
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });
    
    const result = await dynamodbDoc.send(command);
    return (result.Items || []) as DynamoDBDrinkingRecord[];
  }

  /**
   * 記録を更新
   */
  async updateRecord(
    userId: string,
    recordId: string,
    updates: Partial<DynamoDBDrinkingRecord>
  ): Promise<DynamoDBDrinkingRecord> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value], index) => {
      if (key !== "userId" && key !== "recordId" && value !== undefined) {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      }
    });

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId, recordId },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });
    
    const result = await dynamodbDoc.send(command);
    return result.Attributes as DynamoDBDrinkingRecord;
  }

  /**
   * 記録を削除
   */
  async deleteRecord(userId: string, recordId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { userId, recordId },
    });
    
    await dynamodbDoc.send(command);
  }
}
```

### 4. API Routes の更新

**ファイル**: `nextjs/src/app/api/records/route.ts` (新規作成)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { DynamoDBRecordsService } from "@/services/dynamodb-records";
import { fromDynamoDBRecord, toDynamoDBRecord } from "@/utils/transform";
import { validateAuth } from "@/utils/auth";
import { v4 as uuidv4 } from "uuid";

const service = new DynamoDBRecordsService();

/**
 * POST /api/records - 飲酒記録の作成
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const userId = await validateAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 }
      );
    }

    // リクエストボディの取得
    const body = await request.json();
    const { brand, impression, rating } = body;

    // バリデーション
    if (!brand || brand.length < 1 || brand.length > 64) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "銘柄は1-64文字で入力してください" } },
        { status: 400 }
      );
    }

    if (!impression || impression.length < 1 || impression.length > 1000) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "感想は1-1000文字で入力してください" } },
        { status: 400 }
      );
    }

    if (!["VERY_GOOD", "GOOD", "BAD", "VERY_BAD"].includes(rating)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "評価が不正です" } },
        { status: 400 }
      );
    }

    // DynamoDB形式に変換
    const recordId = uuidv4();
    const now = new Date().toISOString();
    const dbRecord = {
      userId,
      recordId,
      sake_name: brand,
      impression,
      rating,
      created_at: now,
      updated_at: now,
    };

    // 保存
    const created = await service.createRecord(dbRecord);

    // API形式に変換してレスポンス
    const apiRecord = fromDynamoDBRecord(created);
    return NextResponse.json({ data: apiRecord }, { status: 201 });

  } catch (error: any) {
    console.error("POST /api/records error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "記録の作成に失敗しました" } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/records - 飲酒記録の一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const userId = await validateAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 }
      );
    }

    // クエリパラメータの取得
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    let records;
    if (q) {
      // 検索クエリがある場合は全件取得してフィルタリング
      // (より効率的な実装はGSIを活用)
      const allRecords = await service.getRecordsByUserId(userId);
      records = allRecords.filter(
        (r) =>
          r.sake_name.includes(q) || r.impression.includes(q)
      );
    } else {
      // 全件取得
      records = await service.getRecordsByUserId(userId);
    }

    // API形式に変換
    const apiRecords = records.map(fromDynamoDBRecord);
    return NextResponse.json({ data: apiRecords });

  } catch (error: any) {
    console.error("GET /api/records error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "記録の取得に失敗しました" } },
      { status: 500 }
    );
  }
}
```

**ファイル**: `nextjs/src/app/api/records/[recordId]/route.ts` (新規作成)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { DynamoDBRecordsService } from "@/services/dynamodb-records";
import { fromDynamoDBRecord, toDynamoDBRecord } from "@/utils/transform";
import { validateAuth } from "@/utils/auth";

const service = new DynamoDBRecordsService();

/**
 * PUT /api/records/[recordId] - 飲酒記録の更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { recordId: string } }
) {
  try {
    const userId = await validateAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 }
      );
    }

    const { recordId } = params;
    const body = await request.json();

    // 既存レコードの確認
    const existing = await service.getRecord(userId, recordId);
    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "記録が見つかりません" } },
        { status: 404 }
      );
    }

    // DynamoDB形式に変換
    const updates = toDynamoDBRecord(body, userId);

    // 更新
    const updated = await service.updateRecord(userId, recordId, updates);

    // API形式に変換してレスポンス
    const apiRecord = fromDynamoDBRecord(updated);
    return NextResponse.json({ data: apiRecord });

  } catch (error: any) {
    console.error("PUT /api/records/[recordId] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "記録の更新に失敗しました" } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/records/[recordId] - 飲酒記録の削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { recordId: string } }
) {
  try {
    const userId = await validateAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 }
      );
    }

    const { recordId } = params;

    // 既存レコードの確認
    const existing = await service.getRecord(userId, recordId);
    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "記録が見つかりません" } },
        { status: 404 }
      );
    }

    // 削除
    await service.deleteRecord(userId, recordId);

    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error("DELETE /api/records/[recordId] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "記録の削除に失敗しました" } },
        { status: 500 }
    );
  }
}
```

## Data Models

### DynamoDBテーブルスキーマ (Terraform定義)

```
テーブル名: sake-recommendation-{environment}-drinking-records

Primary Key:
- Partition Key: userId (String)
- Sort Key: recordId (String)

Attributes:
- sake_name (String) - 銘柄
- impression (String) - 感想
- rating (String) - 評価 (VERY_GOOD | GOOD | BAD | VERY_BAD)
- label_image_key (String, Optional) - ラベル画像キー
- created_at (String) - 作成日時 (ISO 8601)
- updated_at (String) - 更新日時 (ISO 8601)

Global Secondary Indexes:
1. sake_name-created_at-index
   - Partition Key: sake_name
   - Sort Key: created_at
   
2. rating-created_at-index
   - Partition Key: rating
   - Sort Key: created_at
```

### 変換マッピング

| API (キャメルケース) | DynamoDB (スネークケース) |
|---------------------|--------------------------|
| id                  | recordId                 |
| brand               | sake_name                |
| labelImageKey       | label_image_key          |
| createdAt           | created_at               |
| updatedAt           | updated_at               |

## Error Handling

### エラーレスポンス形式

すべてのエラーは以下の形式で返します：

```typescript
{
  error: {
    code: string,    // エラーコード (VALIDATION_ERROR, UNAUTHORIZED, etc.)
    message: string  // 日本語エラーメッセージ
  }
}
```

### エラーコード一覧

- `UNAUTHORIZED`: 認証エラー (401)
- `VALIDATION_ERROR`: バリデーションエラー (400)
- `NOT_FOUND`: リソースが見つからない (404)
- `INTERNAL_ERROR`: サーバー内部エラー (500)

## Testing Strategy

### ユニットテスト

1. **変換関数のテスト** (`transform.ts`)
   - `fromDynamoDBRecord`: DynamoDB型からAPI型への変換
   - `toDynamoDBRecord`: API型からDynamoDB型への変換
   - エッジケース: undefined値、空文字列の処理

2. **DynamoDBサービスのテスト** (`dynamodb-records.ts`)
   - モックDynamoDBクライアントを使用
   - CRUD操作の正常系・異常系
   - GSIクエリの動作確認

### 統合テスト

1. **API Routesのテスト**
   - 認証フローの確認
   - リクエスト/レスポンスの形式検証
   - エラーハンドリングの確認

2. **DynamoDB Local を使用したテスト**
   - 実際のDynamoDBスキーマでのCRUD操作
   - GSIを使用したクエリの動作確認

## Implementation Notes

### 環境変数

`.env.local` に以下を追加：

```bash
DYNAMODB_TABLE_NAME=sake-recommendation-dev-drinking-records
```

### 依存関係

`package.json` に以下を追加（既存の場合は確認）：

```json
{
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.x.x",
    "@aws-sdk/lib-dynamodb": "^3.x.x",
    "uuid": "^9.x.x"
  },
  "devDependencies": {
    "@types/uuid": "^9.x.x"
  }
}
```

### マイグレーション戦略

既存データがある場合の移行手順：

1. 新しいテーブルスキーマを作成
2. データ移行スクリプトを実行（`id` → `recordId`, `brand` → `sake_name`）
3. アプリケーションコードを更新
4. 旧テーブルを削除

## Performance Considerations

1. **GSIの活用**: 銘柄検索・評価検索にはGSIを使用し、Scanを避ける
2. **ページネーション**: 大量データの取得時はページネーションを実装
3. **キャッシング**: 頻繁にアクセスされるデータはキャッシュを検討

## Security Considerations

1. **認証**: すべてのエンドポイントでCognito JWT検証を実施
2. **認可**: ユーザーは自分のデータのみアクセス可能
3. **入力検証**: すべての入力値を厳密にバリデーション
4. **SQLインジェクション対策**: DynamoDBのパラメータ化クエリを使用
