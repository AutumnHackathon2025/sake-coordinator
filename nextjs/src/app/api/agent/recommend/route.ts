import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, AuthError } from '@/utils/auth';
import { validateRecommendRequest, ValidationError } from '@/utils/validation';
import { errorResponse, ERROR_CODES, ERROR_MESSAGES } from '@/utils/response';
import { AgentCoreService, AgentCoreError } from '@/services/agentcore-service';
import { transformToApiResponse } from '@/utils/transform';

/**
 * POST /agent/recommend
 * 日本酒推薦エンドポイント
 * 
 * メニューリストとユーザーの飲酒履歴に基づいて、おすすめの日本酒を推薦します。
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. 認証トークンの検証
    let userId: string;
    try {
      userId = await verifyAuthToken(request);
    } catch (error) {
      if (error instanceof AuthError) {
        return errorResponse(ERROR_CODES.UNAUTHORIZED, error.message, 401);
      }
      return errorResponse(
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED,
        401
      );
    }

    // 2. リクエストボディのパースとバリデーション
    let menu: string[];
    try {
      const body = await request.json();
      menu = validateRecommendRequest(body);
    } catch (error) {
      if (error instanceof ValidationError) {
        return errorResponse(ERROR_CODES.VALIDATION_ERROR, error.message, 400);
      }
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        ERROR_MESSAGES.VALIDATION_ERROR,
        400
      );
    }

    // 3. AgentCore Runtimeの呼び出し
    let agentResponse;
    try {
      const agentService = new AgentCoreService();
      agentResponse = await agentService.recommendSake(userId, menu, 10);
    } catch (error) {
      // 開発モードでは詳細なエラー情報を返す
      const isDev = process.env.SKIP_AUTH === 'true';
      console.error('AgentCore呼び出しエラー:', error);

      if (error instanceof AgentCoreError) {
        const message = isDev
          ? `推薦処理に失敗しました: ${error.message}`
          : error.message;
        return errorResponse(ERROR_CODES.AGENT_ERROR, message, 500);
      }

      const message = isDev
        ? `推薦処理に失敗しました: ${error instanceof Error ? error.message : String(error)}`
        : ERROR_MESSAGES.AGENT_ERROR;
      return errorResponse(ERROR_CODES.AGENT_ERROR, message, 500);
    }

    // 4. レスポンスの整形
    const apiResponse = transformToApiResponse(agentResponse);

    // 5. 成功レスポンスを返す
    return NextResponse.json(apiResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // 予期しないエラー
    console.error('推薦エンドポイントで予期しないエラーが発生:', error);
    return errorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      ERROR_MESSAGES.INTERNAL_ERROR,
      500
    );
  }
}
