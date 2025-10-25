import { RecommendationResponse } from '../services/agentcore-service';

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
