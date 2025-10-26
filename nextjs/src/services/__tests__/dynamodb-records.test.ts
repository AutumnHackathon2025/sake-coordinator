/**
 * DynamoDBRecordsService のユニットテスト
 * モックDynamoDBクライアントを使用してCRUD操作とGSIクエリをテスト
 */

import { DynamoDBRecordsService } from '../dynamodb-records';
import { dynamodbDoc } from '@/lib/dynamodb';
import { DynamoDBDrinkingRecord } from '@/types/dynamodb';

// DynamoDBクライアントをモック化
jest.mock('@/lib/dynamodb', () => ({
  dynamodbDoc: {
    send: jest.fn(),
  },
}));

const mockSend = dynamodbDoc.send as jest.MockedFunction<typeof dynamodbDoc.send>;

describe('DynamoDBRecordsService', () => {
  let service: DynamoDBRecordsService;

  beforeEach(() => {
    service = new DynamoDBRecordsService();
    jest.clearAllMocks();
  });

  describe('createRecord', () => {
    it('正常系: 飲酒記録を作成できる', async () => {
      const record: DynamoDBDrinkingRecord = {
        userId: 'user-123',
        recordId: 'record-456',
        sake_name: '獺祭 純米大吟醸',
        impression: '非常にフルーティーで飲みやすい',
        rating: 'VERY_GOOD',
        label_image_key: 'labels/user-123/image.jpg',
        created_at: '2025-01-15T10:30:00.000Z',
        updated_at: '2025-01-15T10:30:00.000Z',
      };

      mockSend.mockResolvedValueOnce({});

      const result = await service.createRecord(record);

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: expect.any(String),
            Item: record,
          }),
        })
      );
      expect(result).toEqual(record);
    });

    it('正常系: label_image_keyなしで記録を作成できる', async () => {
      const record: DynamoDBDrinkingRecord = {
        userId: 'user-123',
        recordId: 'record-456',
        sake_name: '獺祭 純米大吟醸',
        impression: '非常にフルーティーで飲みやすい',
        rating: 'VERY_GOOD',
        created_at: '2025-01-15T10:30:00.000Z',
        updated_at: '2025-01-15T10:30:00.000Z',
      };

      mockSend.mockResolvedValueOnce({});

      const result = await service.createRecord(record);

      expect(result).toEqual(record);
      expect(result.label_image_key).toBeUndefined();
    });

    it('異常系: DynamoDBエラーが発生した場合、エラーをスローする', async () => {
      const record: DynamoDBDrinkingRecord = {
        userId: 'user-123',
        recordId: 'record-456',
        sake_name: '獺祭 純米大吟醸',
        impression: '非常にフルーティーで飲みやすい',
        rating: 'VERY_GOOD',
        created_at: '2025-01-15T10:30:00.000Z',
        updated_at: '2025-01-15T10:30:00.000Z',
      };

      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(service.createRecord(record)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('getRecordsByUserId', () => {
    it('正常系: ユーザーの全記録を取得できる', async () => {
      const records: DynamoDBDrinkingRecord[] = [
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
      ];

      mockSend.mockResolvedValueOnce({ Items: records });

      const result = await service.getRecordsByUserId('user-123');

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: expect.any(String),
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: { ':userId': 'user-123' },
            ScanIndexForward: false,
          }),
        })
      );
      expect(result).toEqual(records);
    });

    it('正常系: 記録が存在しない場合、空配列を返す', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const result = await service.getRecordsByUserId('user-999');

      expect(result).toEqual([]);
    });

    it('正常系: Itemsがundefinedの場合、空配列を返す', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await service.getRecordsByUserId('user-999');

      expect(result).toEqual([]);
    });
  });

  describe('getRecord', () => {
    it('正常系: 特定の記録を取得できる', async () => {
      const record: DynamoDBDrinkingRecord = {
        userId: 'user-123',
        recordId: 'record-456',
        sake_name: '獺祭 純米大吟醸',
        impression: '非常にフルーティーで飲みやすい',
        rating: 'VERY_GOOD',
        created_at: '2025-01-15T10:30:00.000Z',
        updated_at: '2025-01-15T10:30:00.000Z',
      };

      mockSend.mockResolvedValueOnce({ Item: record });

      const result = await service.getRecord('user-123', 'record-456');

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: expect.any(String),
            Key: { userId: 'user-123', recordId: 'record-456' },
          }),
        })
      );
      expect(result).toEqual(record);
    });

    it('正常系: 記録が存在しない場合、nullを返す', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await service.getRecord('user-123', 'record-999');

      expect(result).toBeNull();
    });
  });

  describe('queryBySakeName', () => {
    it('正常系: 銘柄で検索できる（日付範囲なし）', async () => {
      const records: DynamoDBDrinkingRecord[] = [
        {
          userId: 'user-123',
          recordId: 'record-1',
          sake_name: '獺祭 純米大吟醸',
          impression: 'フルーティー',
          rating: 'VERY_GOOD',
          created_at: '2025-01-15T10:30:00.000Z',
          updated_at: '2025-01-15T10:30:00.000Z',
        },
      ];

      mockSend.mockResolvedValueOnce({ Items: records });

      const result = await service.queryBySakeName('獺祭 純米大吟醸');

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: expect.any(String),
            IndexName: 'sake_name-created_at-index',
            KeyConditionExpression: 'sake_name = :sakeName',
            ExpressionAttributeValues: { ':sakeName': '獺祭 純米大吟醸' },
          }),
        })
      );
      expect(result).toEqual(records);
    });

    it('正常系: 銘柄で検索できる（日付範囲あり: from-to）', async () => {
      const records: DynamoDBDrinkingRecord[] = [];

      mockSend.mockResolvedValueOnce({ Items: records });

      const result = await service.queryBySakeName('獺祭 純米大吟醸', {
        from: '2025-01-01T00:00:00.000Z',
        to: '2025-01-31T23:59:59.999Z',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            KeyConditionExpression: 'sake_name = :sakeName AND created_at BETWEEN :from AND :to',
            ExpressionAttributeValues: {
              ':sakeName': '獺祭 純米大吟醸',
              ':from': '2025-01-01T00:00:00.000Z',
              ':to': '2025-01-31T23:59:59.999Z',
            },
          }),
        })
      );
      expect(result).toEqual(records);
    });

    it('正常系: 銘柄で検索できる（日付範囲あり: fromのみ）', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      await service.queryBySakeName('獺祭 純米大吟醸', {
        from: '2025-01-01T00:00:00.000Z',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            KeyConditionExpression: 'sake_name = :sakeName AND created_at >= :from',
            ExpressionAttributeValues: {
              ':sakeName': '獺祭 純米大吟醸',
              ':from': '2025-01-01T00:00:00.000Z',
            },
          }),
        })
      );
    });

    it('正常系: 銘柄で検索できる（日付範囲あり: toのみ）', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      await service.queryBySakeName('獺祭 純米大吟醸', {
        to: '2025-01-31T23:59:59.999Z',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            KeyConditionExpression: 'sake_name = :sakeName AND created_at <= :to',
            ExpressionAttributeValues: {
              ':sakeName': '獺祭 純米大吟醸',
              ':to': '2025-01-31T23:59:59.999Z',
            },
          }),
        })
      );
    });
  });

  describe('queryByRating', () => {
    it('正常系: 評価で検索できる（日付範囲なし）', async () => {
      const records: DynamoDBDrinkingRecord[] = [
        {
          userId: 'user-123',
          recordId: 'record-1',
          sake_name: '獺祭 純米大吟醸',
          impression: 'フルーティー',
          rating: 'VERY_GOOD',
          created_at: '2025-01-15T10:30:00.000Z',
          updated_at: '2025-01-15T10:30:00.000Z',
        },
      ];

      mockSend.mockResolvedValueOnce({ Items: records });

      const result = await service.queryByRating('VERY_GOOD');

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: expect.any(String),
            IndexName: 'rating-created_at-index',
            KeyConditionExpression: 'rating = :rating',
            ExpressionAttributeValues: { ':rating': 'VERY_GOOD' },
          }),
        })
      );
      expect(result).toEqual(records);
    });

    it('正常系: 評価で検索できる（日付範囲あり: from-to）', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      await service.queryByRating('GOOD', {
        from: '2025-01-01T00:00:00.000Z',
        to: '2025-01-31T23:59:59.999Z',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            KeyConditionExpression: 'rating = :rating AND created_at BETWEEN :from AND :to',
            ExpressionAttributeValues: {
              ':rating': 'GOOD',
              ':from': '2025-01-01T00:00:00.000Z',
              ':to': '2025-01-31T23:59:59.999Z',
            },
          }),
        })
      );
    });
  });

  describe('updateRecord', () => {
    it('正常系: 記録を更新できる', async () => {
      const updates = {
        sake_name: '新しい銘柄',
        impression: '更新された感想',
        rating: 'GOOD' as const,
        updated_at: '2025-01-16T10:30:00.000Z',
      };

      const updatedRecord: DynamoDBDrinkingRecord = {
        userId: 'user-123',
        recordId: 'record-456',
        sake_name: '新しい銘柄',
        impression: '更新された感想',
        rating: 'GOOD',
        created_at: '2025-01-15T10:30:00.000Z',
        updated_at: '2025-01-16T10:30:00.000Z',
      };

      mockSend.mockResolvedValueOnce({ Attributes: updatedRecord });

      const result = await service.updateRecord('user-123', 'record-456', updates);

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: expect.any(String),
            Key: { userId: 'user-123', recordId: 'record-456' },
            UpdateExpression: expect.stringContaining('SET'),
            ReturnValues: 'ALL_NEW',
          }),
        })
      );
      expect(result).toEqual(updatedRecord);
    });

    it('正常系: 部分的な更新ができる（sake_nameのみ）', async () => {
      const updates = {
        sake_name: '新しい銘柄',
      };

      const updatedRecord: DynamoDBDrinkingRecord = {
        userId: 'user-123',
        recordId: 'record-456',
        sake_name: '新しい銘柄',
        impression: '元の感想',
        rating: 'VERY_GOOD',
        created_at: '2025-01-15T10:30:00.000Z',
        updated_at: '2025-01-16T10:30:00.000Z',
      };

      mockSend.mockResolvedValueOnce({ Attributes: updatedRecord });

      const result = await service.updateRecord('user-123', 'record-456', updates);

      expect(result.sake_name).toBe('新しい銘柄');
    });

    it('異常系: 更新する属性が指定されていない場合、エラーをスローする', async () => {
      const updates = {};

      await expect(
        service.updateRecord('user-123', 'record-456', updates)
      ).rejects.toThrow('更新する属性が指定されていません');
    });

    it('正常系: userIdとrecordIdは更新対象外', async () => {
      const updates = {
        userId: 'different-user',
        recordId: 'different-record',
        sake_name: '新しい銘柄',
      };

      const updatedRecord: DynamoDBDrinkingRecord = {
        userId: 'user-123',
        recordId: 'record-456',
        sake_name: '新しい銘柄',
        impression: '元の感想',
        rating: 'VERY_GOOD',
        created_at: '2025-01-15T10:30:00.000Z',
        updated_at: '2025-01-16T10:30:00.000Z',
      };

      mockSend.mockResolvedValueOnce({ Attributes: updatedRecord });

      const result = await service.updateRecord('user-123', 'record-456', updates);

      // userIdとrecordIdは元の値のまま
      expect(result.userId).toBe('user-123');
      expect(result.recordId).toBe('record-456');
    });
  });

  describe('deleteRecord', () => {
    it('正常系: 記録を削除できる', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.deleteRecord('user-123', 'record-456');

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: expect.any(String),
            Key: { userId: 'user-123', recordId: 'record-456' },
          }),
        })
      );
    });

    it('異常系: DynamoDBエラーが発生した場合、エラーをスローする', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(service.deleteRecord('user-123', 'record-456')).rejects.toThrow(
        'DynamoDB error'
      );
    });
  });
});
