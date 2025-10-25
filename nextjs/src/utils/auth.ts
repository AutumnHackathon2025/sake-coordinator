import { NextRequest } from 'next/server';
import * as jose from 'jose';

/**
 * Cognito JWTトークンを検証し、ユーザーIDを抽出する
 * @param request Next.jsリクエストオブジェクト
 * @returns ユーザーID（Cognito sub）
 * @throws 認証エラー時にエラーをスロー
 */
export async function verifyAuthToken(request: NextRequest): Promise<string> {
  // Authorizationヘッダーからトークンを抽出
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    throw new AuthError('認証トークンが見つかりません');
  }

  // Bearer トークン形式の検証
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AuthError('認証トークンの形式が不正です');
  }

  const token = parts[1];

  try {
    // 環境変数からCognito設定を取得
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const region = process.env.AWS_REGION || 'ap-northeast-1';
    
    if (!userPoolId) {
      throw new Error('COGNITO_USER_POOL_ID環境変数が設定されていません');
    }

    // Cognito JWKSエンドポイントURL
    const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    
    // JWKSを取得してトークンを検証
    const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
    
    // トークンの検証（署名、有効期限、issuer）
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
      audience: process.env.COGNITO_CLIENT_ID,
    });

    // ユーザーID（sub）を抽出
    const userId = payload.sub;
    
    if (!userId || typeof userId !== 'string') {
      throw new AuthError('トークンからユーザーIDを取得できません');
    }

    return userId;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    
    // JWT検証エラー
    if (error instanceof jose.errors.JWTExpired) {
      throw new AuthError('認証トークンの有効期限が切れています');
    }
    
    if (error instanceof jose.errors.JWTClaimValidationFailed) {
      throw new AuthError('認証トークンの検証に失敗しました');
    }
    
    throw new AuthError('認証に失敗しました');
  }
}

/**
 * 認証エラークラス
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
