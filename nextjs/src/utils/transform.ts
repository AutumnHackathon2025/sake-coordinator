import { RecommendationResponse } from '../services/agentcore-service';
import { DrinkingRecord } from '@/types/api';
import { DynamoDBDrinkingRecord } from '@/types/dynamodb';

/**
 * API仕様書の形式に変換された推薦結果
 */
export interface ApiRecommendationResponse {
  recommendations: ApiRecommendation[];
}

/**
 * API仕様書の推薦アイテム形式
 */
export interface ApiRecommendation {
  brand: string;
  score: number;
  reason: string;
}

/**
 * AgentCoreのレスポンスをAPI仕様書の形式に変換
 * @param agentResponse AgentCoreからのレスポンス
 * @returns API仕様書形式のレスポンス
 */
export function transformToApiResponse(
  agentResponse: RecommendationResponse
): ApiRecommendationResponse {
  // AgentCoreのレスポンスは既にAPI仕様書の形式（brand, score, reason）
  return {
    recommendations: agentResponse.recommendations,
  };
}

/**
 * DynamoDB型からAPI型への変換
 * スネークケース → キャメルケース
 * recordId → id
 * sake_name → brand
 * label_image_key → labelImageKey
 * created_at → createdAt
 * updated_at → updatedAt
 * 
 * @param dbRecord DynamoDBの飲酒記録
 * @returns API形式の飲酒記録
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
 * キャメルケース → スネークケース
 * id → recordId
 * brand → sake_name
 * labelImageKey → label_image_key
 * createdAt → created_at
 * updatedAt → updated_at
 * 
 * 部分更新をサポートするため、Partial型を受け取る
 * userIdとrecordIdは別途指定する
 * 
 * @param apiRecord API形式の飲酒記録（部分的な更新も可能）
 * @param userId ユーザーID（Cognito sub）
 * @param recordId レコードID（UUID、新規作成時は省略可）
 * @returns DynamoDB形式の飲酒記録（部分的）
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
    ...(apiRecord.brand !== undefined && { sake_name: apiRecord.brand }),
    ...(apiRecord.impression !== undefined && { impression: apiRecord.impression }),
    ...(apiRecord.rating !== undefined && { rating: apiRecord.rating }),
    ...(apiRecord.labelImageKey !== undefined && { label_image_key: apiRecord.labelImageKey }),
    ...(apiRecord.createdAt !== undefined && { created_at: apiRecord.createdAt }),
    updated_at: now,
  };
}
