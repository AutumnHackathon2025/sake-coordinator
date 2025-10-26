/**
 * transform.ts のユニットテスト
 * DynamoDB型とAPI型の変換関数をテスト
 */

import { fromDynamoDBRecord, toDynamoDBRecord } from '../transform';
import { DrinkingRecord } from '@/types/api';
import { DynamoDBDrinkingRecord } from '@/types/dynamodb';

describe('fromDynamoDBRecord', () => {
  describe('正常系: 完全なデータの変換', () => {
    it('すべてのフィールドが存在する場合、正しくAPI型に変換される', () => {
      const dbRecord: DynamoDBDrinkingRecord = {
        userId: 'user-123',
        recordId: 'record-456',
        sake_name: '獺祭 純米大吟醸',
        impression: '非常にフルーティーで飲みやすい',
        rating: 'VERY_GOOD',
        label_image_key: 'labels/user-123/image.jpg',
        created_at: '2025-01-15T10:30:00.000Z',
        updated_at: '2025-01-15T10:30:00.000Z',
      };

      const apiRecord = fromDynamoDBRecord(dbRecord);

      expect(apiRecord).toEqual({
        id: 'record-456',
        userId: 'user-123',
        brand: '獺祭 純米大吟醸',
        impression: '非常にフルーティーで飲みやすい',
        rating: 'VERY_GOOD',
        labelImageKey: 'labels/user-123/image.jpg',
        createdAt: '2025-01-15T10:30:00.000Z',
        updatedAt: '2025-01-15T10:30:00.000Z',
      });
    });

    it('label_image_keyがundefinedの場合、labelImageKeyもundefinedになる', () => {
      const dbRecord: DynamoDBDrinkingRecord = {
        userId: 'user-123',
        recordId: 'record-456',
        sake_name: '獺祭 純米大吟醸',
        impression: '非常にフルーティーで飲みやすい',
        rating: 'VERY_GOOD',
        created_at: '2025-01-15T10:30:00.000Z',
        updated_at: '2025-01-15T10:30:00.000Z',
      };

      const apiRecord = fromDynamoDBRecord(dbRecord);

      expect(apiRecord.labelImageKey).toBeUndefined();
    });
  });

  describe('エッジケース', () => {
    it('空文字列のフィールドも正しく変換される', () => {
      const dbRecord: DynamoDBDrinkingRecord = {
        userId: 'user-123',
        recordId: 'record-456',
        sake_name: '',
        impression: '',
        rating: 'GOOD',
        created_at: '2025-01-15T10:30:00.000Z',
        updated_at: '2025-01-15T10:30:00.000Z',
      };

      const apiRecord = fromDynamoDBRecord(dbRecord);

      expect(apiRecord.brand).toBe('');
      expect(apiRecord.impression).toBe('');
    });

    it('異なる評価値が正しく変換される', () => {
      const ratings: Array<'VERY_GOOD' | 'GOOD' | 'BAD' | 'VERY_BAD'> = [
        'VERY_GOOD',
        'GOOD',
        'BAD',
        'VERY_BAD',
      ];

      ratings.forEach((rating) => {
        const dbRecord: DynamoDBDrinkingRecord = {
          userId: 'user-123',
          recordId: 'record-456',
          sake_name: 'テスト銘柄',
          impression: 'テスト感想',
          rating,
          created_at: '2025-01-15T10:30:00.000Z',
          updated_at: '2025-01-15T10:30:00.000Z',
        };

        const apiRecord = fromDynamoDBRecord(dbRecord);
        expect(apiRecord.rating).toBe(rating);
      });
    });
  });
});

describe('toDynamoDBRecord', () => {
  describe('正常系: 完全なデータの変換', () => {
    it('すべてのフィールドが存在する場合、正しくDynamoDB型に変換される', () => {
      const apiRecord: DrinkingRecord = {
        id: 'record-456',
        userId: 'user-123',
        brand: '獺祭 純米大吟醸',
        impression: '非常にフルーティーで飲みやすい',
        rating: 'VERY_GOOD',
        labelImageKey: 'labels/user-123/image.jpg',
        createdAt: '2025-01-15T10:30:00.000Z',
        updatedAt: '2025-01-15T10:30:00.000Z',
      };

      const dbRecord = toDynamoDBRecord(apiRecord, 'user-123', 'record-456');

      expect(dbRecord.userId).toBe('user-123');
      expect(dbRecord.recordId).toBe('record-456');
      expect(dbRecord.sake_name).toBe('獺祭 純米大吟醸');
      expect(dbRecord.impression).toBe('非常にフルーティーで飲みやすい');
      expect(dbRecord.rating).toBe('VERY_GOOD');
      expect(dbRecord.label_image_key).toBe('labels/user-123/image.jpg');
      expect(dbRecord.created_at).toBe('2025-01-15T10:30:00.000Z');
      // updated_atは現在時刻で上書きされるため、ISO 8601形式であることのみ確認
      expect(dbRecord.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('recordIdを省略した場合、recordIdフィールドは含まれない', () => {
      const apiRecord: Partial<DrinkingRecord> = {
        brand: '獺祭 純米大吟醸',
        impression: '非常にフルーティーで飲みやすい',
        rating: 'VERY_GOOD',
      };

      const dbRecord = toDynamoDBRecord(apiRecord, 'user-123');

      expect(dbRecord.recordId).toBeUndefined();
      expect(dbRecord.userId).toBe('user-123');
    });
  });

  describe('正常系: 部分的なデータの変換', () => {
    it('brandのみ更新する場合、sake_nameのみ含まれる', () => {
      const apiRecord: Partial<DrinkingRecord> = {
        brand: '新しい銘柄',
      };

      const dbRecord = toDynamoDBRecord(apiRecord, 'user-123', 'record-456');

      expect(dbRecord.userId).toBe('user-123');
      expect(dbRecord.recordId).toBe('record-456');
      expect(dbRecord.sake_name).toBe('新しい銘柄');
      expect(dbRecord.impression).toBeUndefined();
      expect(dbRecord.rating).toBeUndefined();
      expect(dbRecord.label_image_key).toBeUndefined();
      expect(dbRecord.created_at).toBeUndefined();
      // updated_atは常に設定される
      expect(dbRecord.updated_at).toBeDefined();
    });

    it('impressionとratingのみ更新する場合、該当フィールドのみ含まれる', () => {
      const apiRecord: Partial<DrinkingRecord> = {
        impression: '更新された感想',
        rating: 'GOOD',
      };

      const dbRecord = toDynamoDBRecord(apiRecord, 'user-123', 'record-456');

      expect(dbRecord.userId).toBe('user-123');
      expect(dbRecord.recordId).toBe('record-456');
      expect(dbRecord.sake_name).toBeUndefined();
      expect(dbRecord.impression).toBe('更新された感想');
      expect(dbRecord.rating).toBe('GOOD');
      expect(dbRecord.label_image_key).toBeUndefined();
    });

    it('labelImageKeyのみ更新する場合、label_image_keyのみ含まれる', () => {
      const apiRecord: Partial<DrinkingRecord> = {
        labelImageKey: 'labels/user-123/new-image.jpg',
      };

      const dbRecord = toDynamoDBRecord(apiRecord, 'user-123', 'record-456');

      expect(dbRecord.label_image_key).toBe('labels/user-123/new-image.jpg');
      expect(dbRecord.sake_name).toBeUndefined();
      expect(dbRecord.impression).toBeUndefined();
      expect(dbRecord.rating).toBeUndefined();
    });
  });

  describe('エッジケース', () => {
    it('undefinedフィールドは変換結果に含まれない', () => {
      const apiRecord: Partial<DrinkingRecord> = {
        brand: '獺祭 純米大吟醸',
        impression: undefined,
        rating: 'VERY_GOOD',
        labelImageKey: undefined,
      };

      const dbRecord = toDynamoDBRecord(apiRecord, 'user-123', 'record-456');

      expect(dbRecord.sake_name).toBe('獺祭 純米大吟醸');
      expect(dbRecord.impression).toBeUndefined();
      expect(dbRecord.rating).toBe('VERY_GOOD');
      expect(dbRecord.label_image_key).toBeUndefined();
    });

    it('空文字列のフィールドも正しく変換される', () => {
      const apiRecord: Partial<DrinkingRecord> = {
        brand: '',
        impression: '',
      };

      const dbRecord = toDynamoDBRecord(apiRecord, 'user-123', 'record-456');

      expect(dbRecord.sake_name).toBe('');
      expect(dbRecord.impression).toBe('');
    });

    it('空のオブジェクトでも userId と updated_at は設定される', () => {
      const apiRecord: Partial<DrinkingRecord> = {};

      const dbRecord = toDynamoDBRecord(apiRecord, 'user-123', 'record-456');

      expect(dbRecord.userId).toBe('user-123');
      expect(dbRecord.recordId).toBe('record-456');
      expect(dbRecord.updated_at).toBeDefined();
      expect(dbRecord.sake_name).toBeUndefined();
      expect(dbRecord.impression).toBeUndefined();
      expect(dbRecord.rating).toBeUndefined();
    });

    it('異なる評価値が正しく変換される', () => {
      const ratings: Array<'VERY_GOOD' | 'GOOD' | 'BAD' | 'VERY_BAD'> = [
        'VERY_GOOD',
        'GOOD',
        'BAD',
        'VERY_BAD',
      ];

      ratings.forEach((rating) => {
        const apiRecord: Partial<DrinkingRecord> = {
          brand: 'テスト銘柄',
          impression: 'テスト感想',
          rating,
        };

        const dbRecord = toDynamoDBRecord(apiRecord, 'user-123', 'record-456');
        expect(dbRecord.rating).toBe(rating);
      });
    });
  });

  describe('updated_atの自動設定', () => {
    it('updated_atは常に現在時刻で上書きされる', () => {
      const apiRecord: Partial<DrinkingRecord> = {
        brand: '獺祭 純米大吟醸',
        updatedAt: '2020-01-01T00:00:00.000Z', // 古い日時を指定
      };

      const beforeTime = new Date().toISOString();
      const dbRecord = toDynamoDBRecord(apiRecord, 'user-123', 'record-456');
      const afterTime = new Date().toISOString();

      // updated_atは現在時刻で上書きされる
      expect(dbRecord.updated_at).not.toBe('2020-01-01T00:00:00.000Z');
      expect(dbRecord.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      // 実行前後の時刻の範囲内であることを確認
      expect(dbRecord.updated_at! >= beforeTime).toBe(true);
      expect(dbRecord.updated_at! <= afterTime).toBe(true);
    });
  });
});
