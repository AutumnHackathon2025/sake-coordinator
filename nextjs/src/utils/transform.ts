import { RecommendationResponse, Recommendation } from '../services/agentcore-service';

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
  return {
    recommendations: agentResponse.recommendations.map((rec) =>
      transformRecommendation(rec)
    ),
  };
}

/**
 * 推薦アイテムをAPI仕様書の形式に変換
 * @param recommendation AgentCoreの推薦アイテム
 * @returns API仕様書形式の推薦アイテム
 */
function transformRecommendation(recommendation: Recommendation): ApiRecommendation {
  return {
    brand: recommendation.sake_name,
    score: recommendation.score,
    reason: recommendation.explanation,
  };
}
