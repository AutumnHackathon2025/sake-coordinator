/**
 * DynamoDBスキーマに準拠した型定義
 * Terraformのスキーマ定義（infrastructure/modules/storage/main.tf）と完全に一致させる
 */

/**
 * DynamoDB評価のEnum値
 * API型のRatingと同じ値を使用
 */
export type DynamoDBRating = "VERY_GOOD" | "GOOD" | "BAD" | "VERY_BAD";

/**
 * DynamoDBテーブルの実際のスキーマに準拠した型定義
 * テーブル名: sake-recommendation-{environment}-drinking-records
 * 
 * Primary Key:
 * - Partition Key: userId (String)
 * - Sort Key: recordId (String)
 * 
 * Attributes (スネークケース):
 * - sake_name (String) - 銘柄
 * - impression (String) - 感想
 * - rating (String) - 評価
 * - label_image_key (String, Optional) - ラベル画像キー
 * - created_at (String) - 作成日時 (ISO 8601)
 * - updated_at (String) - 更新日時 (ISO 8601)
 */
export interface DynamoDBDrinkingRecord {
  // Primary Keys
  userId: string;           // Partition Key - Cognito sub
  recordId: string;         // Sort Key - UUID
  
  // Attributes (スネークケース)
  sake_name: string;        // 銘柄 (1-64文字)
  impression: string;       // 感想 (1-1000文字)
  rating: DynamoDBRating;   // 評価 (VERY_GOOD | GOOD | BAD | VERY_BAD)
  label_image_key?: string; // ラベル画像キー (S3キー、任意)
  created_at: string;       // 作成日時 (ISO 8601形式)
  updated_at: string;       // 更新日時 (ISO 8601形式)
}

/**
 * GSI1: sake_name-created_at-index 用のクエリパラメータ型
 * 銘柄で検索する際に使用
 */
export interface QueryBySakeNameParams {
  sake_name: string;        // 検索する銘柄名
  created_at?: {            // 日付範囲フィルタ (任意)
    from?: string;          // 開始日時 (ISO 8601)
    to?: string;            // 終了日時 (ISO 8601)
  };
}

/**
 * GSI2: rating-created_at-index 用のクエリパラメータ型
 * 評価で検索する際に使用
 */
export interface QueryByRatingParams {
  rating: DynamoDBRating;   // 検索する評価
  created_at?: {            // 日付範囲フィルタ (任意)
    from?: string;          // 開始日時 (ISO 8601)
    to?: string;            // 終了日時 (ISO 8601)
  };
}
