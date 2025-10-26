import { NextRequest, NextResponse } from "next/server";
import { DynamoDBRecordsService } from "@/services/dynamodb-records";
import { fromDynamoDBRecord, toDynamoDBRecord } from "@/utils/transform";
import { verifyAuthToken, AuthError } from "@/utils/auth";
import { errorResponse, successResponse, ERROR_CODES } from "@/utils/response";
import type { Rating } from "@/types/api";

const service = new DynamoDBRecordsService();

/**
 * PUT /api/records/[recordId] - 飲酒記録の更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const userId = await verifyAuthToken(request);
    const { recordId } = await params;
    const body = await request.json();

    // 既存レコードの確認
    const existing = await service.getRecord(userId, recordId);
    if (!existing) {
      return errorResponse(
        ERROR_CODES.NOT_FOUND,
        "記録が見つかりません",
        404
      );
    }

    // バリデーション: brand（オプション）
    if (body.brand !== undefined) {
      if (typeof body.brand !== "string" || body.brand.length < 1 || body.brand.length > 64) {
        return errorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          "銘柄は1-64文字で入力してください",
          400
        );
      }
    }

    // バリデーション: impression（オプション）
    if (body.impression !== undefined) {
      if (typeof body.impression !== "string" || body.impression.length < 1 || body.impression.length > 1000) {
        return errorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          "感想は1-1000文字で入力してください",
          400
        );
      }
    }

    // バリデーション: rating（オプション）
    if (body.rating !== undefined) {
      const validRatings: Rating[] = ["VERY_GOOD", "GOOD", "BAD", "VERY_BAD"];
      if (!validRatings.includes(body.rating)) {
        return errorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          "評価が不正です",
          400
        );
      }
    }

    // DynamoDB形式に変換
    const updates = toDynamoDBRecord(body, userId);

    // 更新
    const updated = await service.updateRecord(userId, recordId, updates);

    // API形式に変換してレスポンス
    const apiRecord = fromDynamoDBRecord(updated);
    return successResponse(apiRecord);

  } catch (error: any) {
    console.error("PUT /api/records/[recordId] error:", error);

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
      "記録の更新に失敗しました",
      500
    );
  }
}

/**
 * DELETE /api/records/[recordId] - 飲酒記録の削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const userId = await verifyAuthToken(request);
    const { recordId } = await params;

    // 既存レコードの確認
    const existing = await service.getRecord(userId, recordId);
    if (!existing) {
      return errorResponse(
        ERROR_CODES.NOT_FOUND,
        "記録が見つかりません",
        404
      );
    }

    // 削除
    await service.deleteRecord(userId, recordId);

    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error("DELETE /api/records/[recordId] error:", error);

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
      "記録の削除に失敗しました",
      500
    );
  }
}
