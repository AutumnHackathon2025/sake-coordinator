import { NextRequest, NextResponse } from "next/server";
import { DynamoDBRecordsService } from "@/services/dynamodb-records";
import { fromDynamoDBRecord, toDynamoDBRecord } from "@/utils/transform";
import { verifyAuthToken, AuthError } from "@/utils/auth";
import { errorResponse, successResponse, ERROR_CODES } from "@/utils/response";
import { v4 as uuidv4 } from "uuid";
import type { Rating } from "@/types/api";

const service = new DynamoDBRecordsService();

/**
 * POST /api/records - 飲酒記録の作成
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const userId = await verifyAuthToken(request);

    // リクエストボディの取得
    const body = await request.json();
    const { brand, impression, rating } = body;

    // バリデーション: brand
    if (!brand || typeof brand !== "string") {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        "銘柄は必須です",
        400
      );
    }

    if (brand.length < 1 || brand.length > 64) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        "銘柄は1-64文字で入力してください",
        400
      );
    }

    // バリデーション: impression
    if (!impression || typeof impression !== "string") {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        "感想は必須です",
        400
      );
    }

    if (impression.length < 1 || impression.length > 1000) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        "感想は1-1000文字で入力してください",
        400
      );
    }

    // バリデーション: rating
    const validRatings: Rating[] = ["VERY_GOOD", "GOOD", "BAD", "VERY_BAD"];
    if (!rating || !validRatings.includes(rating)) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        "評価が不正です",
        400
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
    return successResponse(apiRecord, 201);

  } catch (error: any) {
    console.error("POST /api/records error:", error);

    // 認証エラー
    if (error instanceof AuthError || error?.name === 'AuthError') {
      return errorResponse(
        ERROR_CODES.UNAUTHORIZED,
        error.message,
        401
      );
    }

    // その他のエラー
    return errorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      "記録の作成に失敗しました",
      500
    );
  }
}

/**
 * GET /api/records - 飲酒記録の一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const userId = await verifyAuthToken(request);

    // クエリパラメータの取得
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    let records;
    if (q) {
      // 検索クエリがある場合は全件取得してフィルタリング
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
    return successResponse(apiRecords);

  } catch (error: any) {
    console.error("GET /api/records error:", error);

    // 認証エラー
    if (error instanceof AuthError || error?.name === 'AuthError') {
      return errorResponse(
        ERROR_CODES.UNAUTHORIZED,
        error.message,
        401
      );
    }

    // その他のエラー
    return errorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      "記録の取得に失敗しました",
      500
    );
  }
}
