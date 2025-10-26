/**
 * API Routes /api/agent/recommend の異常系テスト
 * 認証エラー、バリデーションエラー、データベースエラー、AgentCoreエラーをテスト
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { verifyAuthToken, AuthError } from '@/utils/auth';
import { AgentCoreService, AgentCoreError } from '@/services/agentcore-service';

// モック化
jest.mock('@/utils/auth');
jest.mock('@/services/agentcore-service');

const mockVerifyAuthToken = verifyAuthToken as jest.MockedFunction<typeof verifyAuthToken>;

describe('POST /api/agent/recommend - 異常系テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('認証エラー（401）', () => {
    it('認証トークンなしのケース', async () => {
      // 認証エラーをシミュレート
      const authError = Object.assign(new Error('認証トークンが見つかりません'), {
        name: 'AuthError',
      });
      mockVerifyAuthToken.mockRejectedValueOnce(authError);

      const request = new NextRequest('http://localhost:3000/api/agent/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menu: ['獺祭 純米大吟醸', '久保田 千寿'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBeDefined();
    });

    it('認証トークンの形式が不正なケース', async () => {
      const authError = Object.assign(new Error('認証トークンの形式が不正です'), {
        name: 'AuthError',
      });
      mockVerifyAuthToken.mockRejectedValueOnce(authError);

      const request = new NextRequest('http://localhost:3000/api/agent/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'InvalidFormat',
        },
        body: JSON.stringify({
          menu: ['獺祭 純米大吟醸'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBeDefined();
    });

    it('認証トークンの有効期限切れのケース', async () => {
      const authError = Object.assign(new Error('認証トークンの有効期限が切れています'), {
        name: 'AuthError',
      });
      mockVerifyAuthToken.mockRejectedValueOnce(authError);

      const request = new NextRequest('http://localhost:3000/api/agent/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer expired-token',
        },
        body: JSON.stringify({
          menu: ['獺祭 純米大吟醸'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBeDefined();
    });
  });

  describe('バリデーションエラー（400）', () => {
    beforeEach(() => {
      // 認証は成功させる
      mockVerifyAuthToken.mockResolvedValue('test-user-123');
    });

    it('メニューが空のケース', async () => {
      const request = new NextRequest('http://localhost:3000/api/agent/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({
          menu: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('メニューを入力してください');
    });

    it('menuフィールドが存在しないケース', async () => {
      const request = new NextRequest('http://localhost:3000/api/agent/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('menuフィールドが必要です');
    });

    it('menuが配列でないケース', async () => {
      const request = new NextRequest('http://localhost:3000/api/agent/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({
          menu: '獺祭 純米大吟醸',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('menuは配列である必要があります');
    });

    it('銘柄が65文字以上のケース', async () => {
      const longBrand = 'あ'.repeat(65);
      const request = new NextRequest('http://localhost:3000/api/agent/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({
          menu: [longBrand],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('銘柄は1文字以上64文字以内である必要があります');
    });

    it('リクエストボディが不正なJSON形式のケース', async () => {
      const request = new NextRequest('http://localhost:3000/api/agent/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: 'invalid-json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('飲酒履歴0件のケース（200）', () => {
    beforeEach(() => {
      mockVerifyAuthToken.mockResolvedValue('test-user-123');
    });

    it('飲酒履歴が0件の場合、best_recommend: null, recommendations: []を返す', async () => {
      // AgentCoreServiceのモック
      const mockRecommendSake = jest.fn().mockResolvedValueOnce({
        best_recommend: null,
        recommendations: [],
        metadata: '飲酒記録がありません。まずは飲んだお酒を記録してください',
      });

      jest.spyOn(AgentCoreService.prototype, 'recommendSake').mockImplementation(mockRecommendSake);

      const request = new NextRequest('http://localhost:3000/api/agent/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({
          menu: ['獺祭 純米大吟醸', '久保田 千寿'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.best_recommend).toBeNull();
      expect(data.recommendations).toEqual([]);
      expect(mockRecommendSake).toHaveBeenCalledWith('test-user-123', ['獺祭 純米大吟醸', '久保田 千寿'], 10);
    });
  });

  describe('データベースエラー（500）', () => {
    beforeEach(() => {
      mockVerifyAuthToken.mockResolvedValue('test-user-123');
    });

    it('DynamoDBエラーのシミュレーション', async () => {
      // DynamoDBエラーをシミュレート
      const mockRecommendSake = jest.fn().mockRejectedValueOnce(
        new Error('飲酒履歴の取得に失敗しました')
      );

      jest.spyOn(AgentCoreService.prototype, 'recommendSake').mockImplementation(mockRecommendSake);

      const request = new NextRequest('http://localhost:3000/api/agent/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({
          menu: ['獺祭 純米大吟醸'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('AGENT_ERROR');
      expect(data.error.message).toContain('推薦処理に失敗しました');
    });

    it('DynamoDB接続タイムアウトのシミュレーション', async () => {
      const mockRecommendSake = jest.fn().mockRejectedValueOnce(
        new Error('TimeoutError: Request timed out')
      );

      jest.spyOn(AgentCoreService.prototype, 'recommendSake').mockImplementation(mockRecommendSake);

      const request = new NextRequest('http://localhost:3000/api/agent/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({
          menu: ['獺祭 純米大吟醸'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('AGENT_ERROR');
    });
  });

  describe('AgentCoreエラー（500）', () => {
    beforeEach(() => {
      mockVerifyAuthToken.mockResolvedValue('test-user-123');
    });

    it('AgentCore Runtime呼び出しエラー', async () => {
      const agentError = Object.assign(new Error('AgentCore Runtimeの実行に失敗しました'), {
        name: 'AgentCoreError',
      });
      const mockRecommendSake = jest.fn().mockRejectedValueOnce(agentError);

      jest.spyOn(AgentCoreService.prototype, 'recommendSake').mockImplementation(mockRecommendSake);

      const request = new NextRequest('http://localhost:3000/api/agent/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({
          menu: ['獺祭 純米大吟醸'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('AGENT_ERROR');
      expect(data.error.message).toBeDefined();
    });

    it('Bedrockモデル呼び出しエラー', async () => {
      const agentError = Object.assign(new Error('Bedrockモデルの呼び出しに失敗しました'), {
        name: 'AgentCoreError',
      });
      const mockRecommendSake = jest.fn().mockRejectedValueOnce(agentError);

      jest.spyOn(AgentCoreService.prototype, 'recommendSake').mockImplementation(mockRecommendSake);

      const request = new NextRequest('http://localhost:3000/api/agent/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({
          menu: ['獺祭 純米大吟醸'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('AGENT_ERROR');
      expect(data.error.message).toBeDefined();
    });

    it('レスポンスパースエラー', async () => {
      const agentError = Object.assign(new Error('レスポンスのパースに失敗しました'), {
        name: 'AgentCoreError',
      });
      const mockRecommendSake = jest.fn().mockRejectedValueOnce(agentError);

      jest.spyOn(AgentCoreService.prototype, 'recommendSake').mockImplementation(mockRecommendSake);

      const request = new NextRequest('http://localhost:3000/api/agent/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({
          menu: ['獺祭 純米大吟醸'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('AGENT_ERROR');
      expect(data.error.message).toBeDefined();
    });
  });

  describe('予期しないエラー（500）', () => {
    beforeEach(() => {
      mockVerifyAuthToken.mockResolvedValue('test-user-123');
    });

    it('予期しない例外が発生した場合', async () => {
      const mockRecommendSake = jest.fn().mockRejectedValueOnce(
        new Error('予期しないエラー')
      );

      jest.spyOn(AgentCoreService.prototype, 'recommendSake').mockImplementation(mockRecommendSake);

      const request = new NextRequest('http://localhost:3000/api/agent/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({
          menu: ['獺祭 純米大吟醸'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('AGENT_ERROR');
    });
  });
});
