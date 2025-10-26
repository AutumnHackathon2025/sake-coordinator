import { dynamodbDoc } from "@/lib/dynamodb";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBDrinkingRecord } from "@/types/dynamodb";

const TABLE_NAME =
  process.env.DYNAMODB_TABLE_NAME ||
  "sake-recommendation-dev-drinking-records";

/**
 * DynamoDBとの通信を担当するサービスクラス
 * CRUD操作とGSIクエリをサポート
 */
export class DynamoDBRecordsService {
  /**
   * 飲酒記録を作成
   * @param record - 作成する飲酒記録
   * @returns 作成された飲酒記録
   */
  async createRecord(
    record: DynamoDBDrinkingRecord
  ): Promise<DynamoDBDrinkingRecord> {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: record,
    });

    await dynamodbDoc.send(command);
    return record;
  }

  /**
   * ユーザーの全記録を取得
   * @param userId - ユーザーID（Cognito sub）
   * @returns 飲酒記録の配列（新しい順）
   */
  async getRecordsByUserId(
    userId: string
  ): Promise<DynamoDBDrinkingRecord[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false, // 新しい順（created_atの降順）
    });

    const result = await dynamodbDoc.send(command);
    return (result.Items || []) as DynamoDBDrinkingRecord[];
  }

  /**
   * 特定の記録を取得
   * @param userId - ユーザーID
   * @param recordId - 記録ID
   * @returns 飲酒記録、存在しない場合はnull
   */
  async getRecord(
    userId: string,
    recordId: string
  ): Promise<DynamoDBDrinkingRecord | null> {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        recordId,
      },
    });

    const result = await dynamodbDoc.send(command);
    return (result.Item as DynamoDBDrinkingRecord) || null;
  }

  /**
   * 銘柄で検索 (GSI使用: sake_name-created_at-index)
   * @param sakeName - 検索する銘柄名
   * @param dateRange - 日付範囲フィルタ（任意）
   * @returns 飲酒記録の配列
   */
  async queryBySakeName(
    sakeName: string,
    dateRange?: { from?: string; to?: string }
  ): Promise<DynamoDBDrinkingRecord[]> {
    let keyConditionExpression = "sake_name = :sakeName";
    const expressionAttributeValues: Record<string, any> = {
      ":sakeName": sakeName,
    };

    // 日付範囲フィルタリングの追加
    if (dateRange?.from && dateRange?.to) {
      keyConditionExpression += " AND created_at BETWEEN :from AND :to";
      expressionAttributeValues[":from"] = dateRange.from;
      expressionAttributeValues[":to"] = dateRange.to;
    } else if (dateRange?.from) {
      keyConditionExpression += " AND created_at >= :from";
      expressionAttributeValues[":from"] = dateRange.from;
    } else if (dateRange?.to) {
      keyConditionExpression += " AND created_at <= :to";
      expressionAttributeValues[":to"] = dateRange.to;
    }

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "sake_name-created_at-index",
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    const result = await dynamodbDoc.send(command);
    return (result.Items || []) as DynamoDBDrinkingRecord[];
  }

  /**
   * 評価で検索 (GSI使用: rating-created_at-index)
   * @param rating - 検索する評価
   * @param dateRange - 日付範囲フィルタ（任意）
   * @returns 飲酒記録の配列
   */
  async queryByRating(
    rating: string,
    dateRange?: { from?: string; to?: string }
  ): Promise<DynamoDBDrinkingRecord[]> {
    let keyConditionExpression = "rating = :rating";
    const expressionAttributeValues: Record<string, any> = {
      ":rating": rating,
    };

    // 日付範囲フィルタリングの追加
    if (dateRange?.from && dateRange?.to) {
      keyConditionExpression += " AND created_at BETWEEN :from AND :to";
      expressionAttributeValues[":from"] = dateRange.from;
      expressionAttributeValues[":to"] = dateRange.to;
    } else if (dateRange?.from) {
      keyConditionExpression += " AND created_at >= :from";
      expressionAttributeValues[":from"] = dateRange.from;
    } else if (dateRange?.to) {
      keyConditionExpression += " AND created_at <= :to";
      expressionAttributeValues[":to"] = dateRange.to;
    }

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "rating-created_at-index",
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    const result = await dynamodbDoc.send(command);
    return (result.Items || []) as DynamoDBDrinkingRecord[];
  }

  /**
   * 記録を更新
   * @param userId - ユーザーID
   * @param recordId - 記録ID
   * @param updates - 更新する属性
   * @returns 更新後の飲酒記録
   */
  async updateRecord(
    userId: string,
    recordId: string,
    updates: Partial<DynamoDBDrinkingRecord>
  ): Promise<DynamoDBDrinkingRecord> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // 動的にUpdateExpressionを生成
    Object.entries(updates).forEach(([key, value], index) => {
      // Primary Keyは更新対象外
      if (key !== "userId" && key !== "recordId" && value !== undefined) {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      }
    });

    if (updateExpressions.length === 0) {
      throw new Error("更新する属性が指定されていません");
    }

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId, recordId },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });

    const result = await dynamodbDoc.send(command);
    return result.Attributes as DynamoDBDrinkingRecord;
  }

  /**
   * 記録を削除
   * @param userId - ユーザーID
   * @param recordId - 記録ID
   */
  async deleteRecord(userId: string, recordId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { userId, recordId },
    });

    await dynamodbDoc.send(command);
  }
}
