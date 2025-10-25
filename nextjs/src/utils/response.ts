import { NextResponse } from 'next/server';

/**
 * 成功レスポンスを生成
 * @param data レスポンスデータ
 * @param status HTTPステータスコード（デフォルト: 200）
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

/**
 * エラーレスポンスを生成
 * @param code エラーコード
 * @param message エラーメッセージ（日本語）
 * @param status HTTPステータスコード
 */
export function errorResponse(
  code: string,
  message: string,
  status: number
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

/**
 * エラーコード定数
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  AGENT_ERROR: 'AGENT_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * エラーメッセージ定数
 */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: '認証に失敗しました',
  VALIDATION_ERROR: 'リクエストが不正です',
  DATABASE_ERROR: 'データベースへのアクセスに失敗しました',
  AGENT_ERROR: '推薦処理に失敗しました',
  NOT_FOUND: 'リソースが見つかりません',
  INTERNAL_ERROR: '内部エラーが発生しました',
} as const;
