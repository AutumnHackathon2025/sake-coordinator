/**
 * API Routes /api/records/[recordId] の統合テスト
 * PUT, DELETEエンドポイントの正常系・異常系、認証、バリデーションをテスト
 */

import { NextRequest } from 'next/server';
import { PUT, DELETE } from '../route';
import { DynamoDBRecordsService } from '@/services/dynamodb-records';
import { verifyAuthToken, AuthError } from '@/utils/auth';

// モック化
jest.mock('@/services/dynamodb-records');
jest.mock('@/utils/auth');

const mockVerifyAuthToken = verifyAuthToken as jest.MockedFunction<typeof verifyAuthToken>;

describe('PUT /api/records/[recordId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常系: 飲酒記録を更新できる', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce('user-123');

    const mockGetRecord = jest.fn().mockResolvedValueOnce({
      userId: 'user-123',
      recordId: 'record-456',
      sake_name: '獺祭 純米大吟醸',
      impression: '元の感想',
      rating: 'VERY_GOOD',
      created_at: '2025-01-15T10:30:00.000Z',
      updated_at: '2025-01-15T10:30:00.000Z',
    });

    const mockUpdateRecord = jest.fn().mockResolvedValueOnce({
      userId: 'user-123',
      recordId: 'record-456',
      sake_name: '新しい銘柄',
      impression: '更新された感想',
      rating: 'GOOD',
      created_at: '2025-01-15T10:30:00.000Z',
      updated_at: '2025-01-16T10:30:00.000Z',
    });

    jest.spyOn(DynamoDBRecordsService.prototype, 'getRecord').mockImplementation(mockGetRecord);
    jest.spyOn(DynamoDBRecordsService.prototype, 'updateRecord').mockImplementation(mockUpdateRecord);

    const request = new NextRequest('http://localhost:3000/api/records/record-456', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        brand: '新しい銘柄',
        impression: '更新された感想',
        rating: 'GOOD',
      }),
    });

    const response = await PUT(request, { params: { recordId: 'record-456' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.brand).toBe('新しい銘柄');
    expect(data.data.impression).toBe('更新された感想');
    expect(data.data.rating).toBe('GOOD');
  });

  it('正常系: 部分的な更新ができる（brandのみ）', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce('user-123');

    const mockGetRecord = jest.fn().mockResolvedValueOnce({
      userId: 'user-123',
      recordId: 'record-456',
      sake_name: '獺祭 純米大吟醸',
      impression: '元の感想',
      rating: 'VERY_GOOD',
      created_at: '2025-01-15T10:30:00.000Z',
      updated_at: '2025-01-15T10:30:00.000Z',
    });

    const mockUpdateRecord = jest.fn().mockResolvedValueOnce({
      userId: 'user-123',
      recordId: 'record-456',
      sake_name: '新しい銘柄',
      impression: '元の感想',
      rating: 'VERY_GOOD',
      created_at: '2025-01-15T10:30:00.000Z',
      updated_at: '2025-01-16T10:30:00.000Z',
    });

    jest.spyOn(DynamoDBRecordsService.prototype, 'getRecord').mockImplementation(mockGetRecord);
    jest.spyOn(DynamoDBRecordsService.prototype, 'updateRecord').mockImplementation(mockUpdateRecord);

    const request = new NextRequest('http://localhost:3000/api/records/record-456', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        brand: '新しい銘柄',
      }),
    });

    const response = await PUT(request, { params: { recordId: 'record-456' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.brand).toBe('新しい銘柄');
    expect(data.data.impression).toBe('元の感想');
  });

  it('異常系: 認証エラー', async () => {
    mockVerifyAuthToken.mockRejectedValueOnce(new AuthError('認証に失敗しました'));

    const request = new NextRequest('http://localhost:3000/api/records/record-456', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand: '新しい銘柄',
      }),
    });

    const response = await PUT(request, { params: { recordId: 'record-456' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('異常系: 記録が見つからない', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce('user-123');

    const mockGetRecord = jest.fn().mockResolvedValueOnce(null);

    jest.spyOn(DynamoDBRecordsService.prototype, 'getRecord').mockImplementation(mockGetRecord);

    const request = new NextRequest('http://localhost:3000/api/records/record-999', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        brand: '新しい銘柄',
      }),
    });

    const response = await PUT(request, { params: { recordId: 'record-999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('NOT_FOUND');
    expect(data.error.message).toContain('見つかりません');
  });

  it('異常系: brandが不正（65文字以上）', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce('user-123');

    const mockGetRecord = jest.fn().mockResolvedValueOnce({
      userId: 'user-123',
      recordId: 'record-456',
      sake_name: '獺祭 純米大吟醸',
      impression: '元の感想',
      rating: 'VERY_GOOD',
      created_at: '2025-01-15T10:30:00.000Z',
      updated_at: '2025-01-15T10:30:00.000Z',
    });

    jest.spyOn(DynamoDBRecordsService.prototype, 'getRecord').mockImplementation(mockGetRecord);

    const request = new NextRequest('http://localhost:3000/api/records/record-456', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        brand: 'a'.repeat(65),
      }),
    });

    const response = await PUT(request, { params: { recordId: 'record-456' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('異常系: ratingが不正な値', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce('user-123');

    const mockGetRecord = jest.fn().mockResolvedValueOnce({
      userId: 'user-123',
      recordId: 'record-456',
      sake_name: '獺祭 純米大吟醸',
      impression: '元の感想',
      rating: 'VERY_GOOD',
      created_at: '2025-01-15T10:30:00.000Z',
      updated_at: '2025-01-15T10:30:00.000Z',
    });

    jest.spyOn(DynamoDBRecordsService.prototype, 'getRecord').mockImplementation(mockGetRecord);

    const request = new NextRequest('http://localhost:3000/api/records/record-456', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        rating: 'INVALID_RATING',
      }),
    });

    const response = await PUT(request, { params: { recordId: 'record-456' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /api/records/[recordId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常系: 飲酒記録を削除できる', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce('user-123');

    const mockGetRecord = jest.fn().mockResolvedValueOnce({
      userId: 'user-123',
      recordId: 'record-456',
      sake_name: '獺祭 純米大吟醸',
      impression: '元の感想',
      rating: 'VERY_GOOD',
      created_at: '2025-01-15T10:30:00.000Z',
      updated_at: '2025-01-15T10:30:00.000Z',
    });

    const mockDeleteRecord = jest.fn().mockResolvedValueOnce(undefined);

    jest.spyOn(DynamoDBRecordsService.prototype, 'getRecord').mockImplementation(mockGetRecord);
    jest.spyOn(DynamoDBRecordsService.prototype, 'deleteRecord').mockImplementation(mockDeleteRecord);

    const request = new NextRequest('http://localhost:3000/api/records/record-456', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer valid-token',
      },
    });

    const response = await DELETE(request, { params: { recordId: 'record-456' } });

    expect(response.status).toBe(204);
    expect(mockDeleteRecord).toHaveBeenCalledWith('user-123', 'record-456');
  });

  it('異常系: 認証エラー', async () => {
    mockVerifyAuthToken.mockRejectedValueOnce(new AuthError('認証に失敗しました'));

    const request = new NextRequest('http://localhost:3000/api/records/record-456', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { recordId: 'record-456' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('異常系: 記録が見つからない', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce('user-123');

    const mockGetRecord = jest.fn().mockResolvedValueOnce(null);

    jest.spyOn(DynamoDBRecordsService.prototype, 'getRecord').mockImplementation(mockGetRecord);

    const request = new NextRequest('http://localhost:3000/api/records/record-999', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer valid-token',
      },
    });

    const response = await DELETE(request, { params: { recordId: 'record-999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('NOT_FOUND');
    expect(data.error.message).toContain('見つかりません');
  });
});
