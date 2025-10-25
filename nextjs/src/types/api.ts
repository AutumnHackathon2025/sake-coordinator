/**
 * API設計書に基づいた型定義
 */

// 評価のEnum値
export type Rating = "VERY_GOOD" | "GOOD" | "BAD" | "VERY_BAD";

// 評価のラベルマッピング
export const RATING_LABELS: Record<Rating, string> = {
  VERY_GOOD: "非常に好き",
  GOOD: "好き",
  BAD: "合わない",
  VERY_BAD: "非常に合わない",
};

// 逆引きマッピング
export const LABEL_TO_RATING: Record<string, Rating> = {
  "非常に好き": "VERY_GOOD",
  "好き": "GOOD",
  "合わない": "BAD",
  "非常に合わない": "VERY_BAD",
};

/**
 * 飲酒記録（機能2）
 * API設計書 3.1. DrinkingRecord
 */
export interface DrinkingRecord {
  id: string; // UUID
  userId: string; // Cognito sub
  brand: string; // 銘柄 (1-64文字)
  impression: string; // 味の感想 (1-1000文字)
  rating: Rating; // 評価
  labelImageKey?: string; // S3に保存されたラベル画像のキー
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * 推薦結果（機能1）
 * API設計書 3.2. RecommendationResult
 */
export interface RecommendationResult {
  brand: string; // 銘柄 (1-64文字)
  score: number; // おすすめ度合い (1-5)
  reason: string; // おすすめする理由 (1-500文字)
}

/**
 * メニュー（機能3）
 * API設計書 3.3. Menu
 */
export interface Menu {
  brands: string[];
}

/**
 * API レスポンス型
 */

// POST /api/records のリクエスト
export interface CreateRecordRequest {
  brand: string;
  impression: string;
  rating: Rating;
}

// PUT /api/records/{recordId} のリクエスト
export interface UpdateRecordRequest {
  brand?: string;
  impression?: string;
  rating?: Rating;
  labelImageKey?: string;
}

// POST /agent/recommend のリクエスト
export interface RecommendRequest {
  menu: string[];
}

// POST /agent/recommend のレスポンス
export interface RecommendResponse {
  recommendations: RecommendationResult[];
}

// POST /api/uploads/presigned-url のリクエスト
export interface PresignedUrlRequest {
  contentType: string;
  purpose: "label" | "menu_ocr";
}

// POST /api/uploads/presigned-url のレスポンス
export interface PresignedUrlResponse {
  uploadUrl: string;
  assetKey: string;
}

// POST /api/ocr/menu のリクエスト
export interface OcrMenuRequest {
  assetKey: string;
}

// POST /api/ocr/menu のレスポンス
export interface OcrMenuResponse {
  brands: string[];
}

