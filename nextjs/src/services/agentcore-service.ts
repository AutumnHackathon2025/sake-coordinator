import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from '@aws-sdk/client-bedrock-agentcore';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

/**
 * AgentCore Runtimeサービス
 * AWS SDKを使用してAgentCore Runtimeを呼び出す
 */
export class AgentCoreService {
  private agentCoreClient?: BedrockAgentCoreClient;
  private dynamoClient: DynamoDBClient;
  private runtimeArn: string;
  private tableName: string;

  constructor() {
    const region = process.env.AWS_REGION || 'ap-northeast-1';
    this.runtimeArn = process.env.AGENTCORE_RUNTIME_ARN || '';
    this.tableName = process.env.DYNAMODB_TABLE_NAME || 'drinking_records';

    // ローカル開発モードの判定
    const isLocalDev = process.env.USE_LOCAL_AGENT === 'true';

    console.log('🔧 AgentCoreService初期化:', {
      region,
      runtimeArn: this.runtimeArn ? `${this.runtimeArn.substring(0, 50)}...` : '未設定',
      tableName: this.tableName,
      hasAwsKey: !!process.env.AWS_ACCESS_KEY_ID,
      isLocalDev,
      localAgentUrl: process.env.LOCAL_AGENT_URL,
    });

    // ローカル開発モードでない場合のみAWS SDKを初期化
    if (!isLocalDev) {
      if (!this.runtimeArn) {
        throw new Error('AGENTCORE_RUNTIME_ARN環境変数が設定されていません');
      }

      this.agentCoreClient = new BedrockAgentCoreClient({
        region,
        // credentials: {
        //   accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        // },
      });
    }

    const dynamoConfig: any = {
      region,
      // credentials: {
      //   accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      // },
    };

    // DynamoDB Localのエンドポイント設定
    if (process.env.DYNAMODB_ENDPOINT) {
      dynamoConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
      console.log('📍 DynamoDB Local使用:', process.env.DYNAMODB_ENDPOINT);
    }

    this.dynamoClient = new DynamoDBClient(dynamoConfig);
  }

  /**
   * DynamoDBからユーザーの飲酒履歴を取得
   * @param userId ユーザーID
   * @returns 飲酒履歴の配列
   */
  private async getDrinkingRecords(userId: string): Promise<any[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId },
        },
        ScanIndexForward: false, // 降順（最新順）
        Limit: 100, // 最新100件
      });

      const response = await this.dynamoClient.send(command);
      
      if (!response.Items || response.Items.length === 0) {
        return [];
      }

      // DynamoDB形式からJavaScriptオブジェクトに変換
      return response.Items.map((item) => unmarshall(item));
    } catch (error) {
      console.error('DynamoDB飲酒履歴取得エラー:', error);
      throw new Error('飲酒履歴の取得に失敗しました');
    }
  }

  /**
   * 日本酒推薦を実行
   * @param userId ユーザーID
   * @param menu メニューリスト
   * @param maxRecommendations 最大推薦件数（デフォルト: 10）
   * @returns 推薦結果
   */
  async recommendSake(
    userId: string,
    menu: string[],
    maxRecommendations: number = 10
  ): Promise<RecommendationResponse> {
    try {
      console.log('📊 推薦処理開始:', { userId, menuCount: menu.length });

      // 1. DynamoDBから飲酒履歴を取得
      const drinkingRecords = await this.getDrinkingRecords(userId);
      console.log(`📚 飲酒履歴取得: ${drinkingRecords.length}件`);

      // 2. AgentCore Runtimeへのリクエストペイロード
      const payload = {
        type: 'recommendation',
        user_id: userId,
        drinking_records: drinkingRecords,
        menu_brands: menu.length > 0 ? menu : undefined,
        max_recommendations: maxRecommendations,
      };

      // ローカル開発モードの判定
      const isLocalDev = process.env.USE_LOCAL_AGENT === 'true';

      if (isLocalDev) {
        // ローカルエージェントにHTTPリクエスト
        return await this.callLocalAgent(payload);
      } else {
        // AgentCore Runtimeを呼び出し
        return await this.callAgentCoreRuntime(payload, userId);
      }
    } catch (error) {
      console.error('❌ AgentCore推薦処理エラー:', error);
      
      if (error instanceof Error) {
        // エラーの詳細をログに出力
        console.error('エラー詳細:', {
          name: error.name,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        });
        throw new AgentCoreError(`${error.name}: ${error.message}`);
      }
      throw new AgentCoreError('推薦処理に失敗しました（不明なエラー）');
    }
  }

  /**
   * ローカルエージェントにHTTPリクエストを送信
   */
  private async callLocalAgent(payload: any): Promise<RecommendationResponse> {
    const localAgentUrl = process.env.LOCAL_AGENT_URL || 'http://localhost:8080';
    console.log('🏠 ローカルエージェント呼び出し:', localAgentUrl);

    const response = await fetch(`${localAgentUrl}/invocations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`ローカルエージェントエラー: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ ローカルエージェントからレスポンス受信');

    // エラーチェック
    if (result.error) {
      throw new Error(result.error);
    }

    // 結果を抽出
    const agentResult = result.result;
    
    return {
      user_id: agentResult.user_id,
      recommendations: agentResult.recommendations || [],
      total_count: agentResult.total_count || 0,
    };
  }

  /**
   * AgentCore Runtimeを呼び出し
   */
  private async callAgentCoreRuntime(payload: any, userId: string): Promise<RecommendationResponse> {
    if (!this.agentCoreClient) {
      throw new Error('AgentCore Clientが初期化されていません（USE_LOCAL_AGENT=trueの場合は使用できません）');
    }

    // 3. セッションIDを生成（33文字以上必要）
    const sessionId = `session-${userId}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    console.log('🔑 セッションID生成:', sessionId);

    // 4. InvokeAgentRuntimeCommandを実行
    console.log('🚀 AgentCore Runtime呼び出し開始...');
    const command = new InvokeAgentRuntimeCommand({
      agentRuntimeArn: this.runtimeArn,
      runtimeSessionId: sessionId,
      payload: JSON.stringify(payload),
    });

    const response = await this.agentCoreClient.send(command);
    console.log('✅ AgentCore Runtimeからレスポンス受信');

    // 5. レスポンスを処理
    if (!response.response) {
      throw new Error('AgentCore Runtimeからのレスポンスが空です');
    }

    // レスポンスボディを読み取り（ストリームの場合）
    let responseBody: string;
    if (response.response instanceof Uint8Array) {
      // Uint8Arrayの場合
      responseBody = new TextDecoder().decode(response.response);
    } else if (typeof response.response === 'string') {
      // 文字列の場合
      responseBody = response.response;
    } else {
      // ストリームの場合（Readable）
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.response as any) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      responseBody = buffer.toString('utf-8');
    }

    const result = JSON.parse(responseBody);

    // エラーチェック
    if (result.error) {
      throw new Error(result.error);
    }

    // 結果を抽出
    const agentResult = result.result;
    
    return {
      user_id: agentResult.user_id,
      recommendations: agentResult.recommendations || [],
      total_count: agentResult.total_count || 0,
    };
  }
}

/**
 * 推薦結果の型定義
 */
export interface RecommendationResponse {
  user_id: string;
  recommendations: Recommendation[];
  total_count: number;
}

/**
 * 推薦アイテムの型定義（AgentCoreのレスポンス形式）
 */
export interface Recommendation {
  brand: string;
  score: number;
  reason: string;
}

/**
 * AgentCoreエラークラス
 */
export class AgentCoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentCoreError';
  }
}
