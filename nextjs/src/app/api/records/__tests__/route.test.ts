/**
 * API Routes /api/records の統合テスト
 * 各エンドポイントの正常系・異常系、認証、バリデーションをテスト
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { DynamoDBRecordsService } from '@/services/dynamodb-records';
import { verifyAuthToken, AuthError } from '@/utils/auth';

// モック化
jest.mock('@/services/dynamodb-records');
jest.mock('@/utils/auth');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

const mockVerifyAuthToken = verifyAuthToken as jest.MockedFunction<typeof verifyAuthToken>;

describe('POST /api/records', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常系: 飲酒記録を作成できる', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce('user-123');
    
    const mockCreateRecord = jest.fn().mockResolvedValueOnce({
      userId: 'user-123',
      recordId: 'test-uuid-123',
      sake_name: '獺祭 純米大吟醸',
      impression: '非常にフルーティーで飲みやすい',
      rating: 'VERY_GOOD',
      created_at: '2025-01-15T10:30:00.000Z',
      updated_at: '2025-01-15T10:30:00.000Z',
    });

    jest.spyOn(DynamoDBRecordsService.prototype, 'createRecord').mockImplementation(mockCreateRecord);

    const request = new NextRequest('http://localhost:3000/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        brand: '獺祭 純米大吟醸',
        impression: '非常にフルーティーで飲みやすい',
        rating: 'VERY_GOOD',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toHaveProperty('id');
    expect(data.data.brand).toBe('獺祭 純米大吟醸');
    expect(data.data.impression).toBe('非常にフルーティーで飲みやすい');
    expect(data.data.rating).toBe('VERY_GOOD');
  });

  it('異常系: 認証エラー', async () => {
    mockVerifyAuthToken.mockRejectedValueOnce(new AuthError('認証に失敗しました'));

    const request = new NextRequest('http://localhost:3000/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand: '獺祭 純米大吟醸',
        impression: '非常にフルーティーで飲みやすい',
        rating: 'VERY_GOOD',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('異常系: brandが空文字', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce('user-123');

    const request = new NextRequest('http://localhost:3000/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        brand: '',
        impression: '非常にフルーティーで飲みやすい',
        rating: 'VERY_GOOD',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.message).toContain('銘柄');
  });

  it('異常系: brandが65文字以上', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce('user-123');

    const request = new NextRequest('http://localhost:3000/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        brand: 'a'.repeat(65),
        impression: '非常にフルーティーで飲みやすい',
        rating: 'VERY_GOOD',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('異常系: impressionが空文字', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce('user-123');

    const request = new NextRequest('http://localhost:3000/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        brand: '獺祭 純米大吟醸',
        impression: '',
        rating: 'VERY_GOOD',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.message).toContain('感想');
  });

  it('異常系: impressionが1001文字以上', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce('user-123');

    const request = new NextRequest('http://localhost:3000/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        brand: '獺祭 純米大吟醸',
        impression: 'a'.repeat(1001),
        rating: 'VERY_GOOD',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('異常系: ratingが不正な値', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce('user-123');

    const request = new NextRequest('http://localhost:3000/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        brand: '獺祭 純米大吟醸',
        impression: '非常にフルーティーで飲みやすい',
        rating: 'INVALID_RATING',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.message).toContain('評価');
  });
});

describe('GET /api/records', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常系: 飲酒記録の一覧を取得できる', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce('user-123');

    const mockGetRecordsByUserId = jest.fn().mockResolvedValueOnce([
      {
        userId: 'user-123',
        recordId: 'record-1',
        sake_name: '獺祭 純米大吟醸',
        impression: 'フルーティー',
        rating: 'VERY_GOOD',
        created_at: '2025-01-15T10:30:00.000Z',
        updated_at: '2025-01-15T10:30:00.000Z',
      },
      {
        userId: 'user-123',
        recordId: 'record-2',
        sake_name: '久保田 千寿',
        impression: 'すっきり',
        rating: 'GOOD',
        created_at: '2025-01-14T10:30:00.000Z',
        updated_at: '2025-01-14T10:30:00.000Z',
      },
    ]);

    jest.spyOn(DynamoDBRecordsService.prototype, 'getRecordsByUserId').mockImplementation(mockGetRecordsByUserId);

    const request = new NextRequest('http://localhost:3000/api/records', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].brand).toBe('獺祭 純米大吟醸');
    expect(data.data[1].brand).toBe('久保田 千寿');
  });

  it('正常系: 検索クエリで絞り込みができる', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce('user-123');

    const mockGetRecordsByUserId = jest.fn().mockResolvedValueOnce([
      {
        userId: 'user-123',
        recordId: 'record-1',
        sake_name: '獺祭 純米大吟醸',
        impression: 'フルーティー',
        rating: 'VERY_GOOD',
        created_at: '2025-01-15T10:30:00.000Z',
        updated_at: '2025-01-15T10:30:00.000Z',
      },
      {
        userId: 'user-123',
        recordId: 'record-2',
        sake_name: '久保田 千寿',
        impression: 'すっきり',
        rating: 'GOOD',
        created_at: '2025-01-14T10:30:00.000Z',
        updated_at: '2025-01-14T10:30:00.000Z',
      },
    ]);

    jest.spyOn(DynamoDBRecordsService.prototype, 'getRecordsByUserId').mockImplementation(mockGetRecordsByUserId);

    const request = new NextRequest('http://localhost:3000/api/records?q=獺祭', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].brand).toBe('獺祭 純米大吟醸');
  });

  it('異常系: 認証エラー', async () => {
    mockVerifyAuthToken.mockRejectedValueOnce(new AuthError('認証に失敗しました'));

    const request = new NextRequest('http://localhost:3000/api/records', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
});
