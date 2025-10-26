import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from '@aws-sdk/client-bedrock-agentcore';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

/**
 * DynamoDBから取得した生データの型
 */
interface DynamoDBRecordRaw {
  userId: string;
  id: string;
  brand: string;
  impression: string;
  rating: 'VERY_GOOD' | 'GOOD' | 'BAD' | 'VERY_BAD' | string; // 既に日本語の可能性もある
  labelImageKey?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Python DrinkingRecordモデルが期待する形式
 */
interface PythonDrinkingRecord {
  id: string;
  userId: string;
  brand: string;
  impression: string;
  rating: string;
  labelImageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * AgentCoreへのリクエストペイロード
 */
interface AgentCoreRequestPayload {
  type: 'recommendation' | 'taste_analysis';
  user_id: string;
  drinking_records: PythonDrinkingRecord[];
  menu_brands?: string[];
  max_recommendations?: number;
}

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

    const dynamoConfig: {
      region: string;
      endpoint?: string;
    } = {
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
   * @returns 飲酒履歴の配列（Python側が期待する形式に変換済み）
   */
  private async getDrinkingRecords(userId: string): Promise<PythonDrinkingRecord[]> {
    try {
      console.log('  🔍 DynamoDB Query実行中...');
      console.log('  クエリパラメータ:', {
        TableName: this.tableName,
        userId: userId,
      });

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
      console.log('  ✅ DynamoDBレスポンス受信');
      console.log('  レスポンス詳細:', {
        itemCount: response.Items?.length || 0,
        consumedCapacity: response.ConsumedCapacity,
        scannedCount: response.ScannedCount,
      });
      
      if (!response.Items || response.Items.length === 0) {
        console.warn('  ⚠️ DynamoDBにデータなし（Items配列が空）');
        return [];
      }

      // DynamoDB形式からJavaScriptオブジェクトに変換
      const rawRecords = response.Items.map((item) => unmarshall(item) as DynamoDBRecordRaw);
      console.log('  ✅ unmarshall完了:', rawRecords.length, '件');
      
      // 🔍 デバッグ: 実際のDynamoDBフィールド名を確認
      if (rawRecords.length > 0) {
        console.log('  🔍 DynamoDB実際のフィールド名:', Object.keys(rawRecords[0]));
        console.log('  🔍 DynamoDB生データサンプル:', JSON.stringify(rawRecords[0], null, 2));
      }
      
      // Python側が期待する形式に変換（DynamoDBスキーマ → Python DrinkingRecordモデル）
      const records = rawRecords.map((record) => this.convertToPythonFormat(record));
      console.log('  ✅ Python形式への変換完了:', records.length, '件');
      
      return records;
    } catch (error) {
      console.error('  ❌ DynamoDB飲酒履歴取得エラー:', error);
      if (error instanceof Error) {
        console.error('  エラー詳細:', {
          name: error.name,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        });
      }
      throw new Error('飲酒履歴の取得に失敗しました');
    }
  }

  /**
   * DynamoDBレコードをPython側が期待する形式に変換
   * @param record DynamoDBから取得した生データ
   * @returns Python DrinkingRecordモデルが期待する形式
   */
  private convertToPythonFormat(record: DynamoDBRecordRaw): PythonDrinkingRecord {
    // 評価値の変換マップ（DynamoDB英語定数 → Python日本語値）
    const ratingMap: Record<string, string> = {
      'VERY_GOOD': '非常に好き',
      'GOOD': '好き',
      'BAD': '合わない',
      'VERY_BAD': '非常に合わない',
    };

    // DynamoDBのratingが既に日本語の場合もあるのでチェック
    const rating = ratingMap[record.rating] || record.rating;

    return {
      id: record.id,                 // そのまま
      userId: record.userId,         // そのまま
      brand: record.brand,           // そのまま
      impression: record.impression, // そのまま
      rating: rating,                // 英語定数の場合のみ日本語に変換
      labelImageUrl: record.labelImageKey, // labelImageKey → labelImageUrl
      createdAt: record.createdAt,   // そのまま
      updatedAt: record.updatedAt,   // そのまま（オプション）
    };
  }

  /**
   * 日本酒推薦を実行
   * @param userId ユーザーID
   * @param menu メニューリスト
   * @param maxRecommendations 最大推薦件数(デフォルト: 10)
   * @returns 推薦結果
   */
  async recommendSake(
    userId: string,
    menu: string[],
    maxRecommendations: number = 10
  ): Promise<RecommendationResponse> {
    try {
      console.log('=====================================');
      console.log('📊 推薦処理開始');
      console.log('=====================================');
      console.log('入力パラメータ:', {
        userId,
        menuCount: menu.length,
        menu: menu,
        maxRecommendations,
      });

      // 1. DynamoDBから飲酒履歴を取得
      console.log('\n[STEP 1] DynamoDB飲酒履歴取得開始...');
      const drinkingRecords = await this.getDrinkingRecords(userId);
      console.log(`✅ 飲酒履歴取得完了: ${drinkingRecords.length}件`);
      if (drinkingRecords.length > 0) {
        console.log('飲酒履歴サンプル（最新3件）:', drinkingRecords.slice(0, 3));
      } else {
        console.warn('⚠️ 飲酒履歴が0件です');
      }

      // 2. AgentCore Runtimeへのリクエストペイロード
      const payload: AgentCoreRequestPayload = {
        type: 'recommendation',
        user_id: userId,
        drinking_records: drinkingRecords,
        menu_brands: menu.length > 0 ? menu : undefined,
        max_recommendations: maxRecommendations,
      };
      console.log('\n[STEP 2] リクエストペイロード構築完了');
      console.log('ペイロード詳細:', JSON.stringify(payload, null, 2));

      // ローカル開発モードの判定
      const isLocalDev = process.env.USE_LOCAL_AGENT === 'true';
      console.log('\n[STEP 3] 実行モード判定:', isLocalDev ? 'ローカル開発' : 'AWS AgentCore');

      let result: RecommendationResponse;
      if (isLocalDev) {
        // ローカルエージェントにHTTPリクエスト
        console.log('→ ローカルエージェント呼び出しへ');
        result = await this.callLocalAgent(payload);
      } else {
        // AgentCore Runtimeを呼び出し
        console.log('→ AWS AgentCore Runtime呼び出しへ');
        result = await this.callAgentCoreRuntime(payload, userId);
      }

      console.log('\n[STEP 4] レスポンス受信完了');
      console.log('レスポンス詳細:', JSON.stringify(result, null, 2));
      console.log('推薦結果サマリー:', {
        hasBestRecommend: !!result.best_recommend,
        recommendationsCount: result.recommendations?.length || 0,
        hasMetadata: !!result.metadata,
      });
      
      if (!result.best_recommend && (!result.recommendations || result.recommendations.length === 0)) {
        console.warn('⚠️⚠️⚠️ 推薦結果が空です！ ⚠️⚠️⚠️');
      } else {
        console.log('✅ 推薦結果あり');
      }
      
      console.log('=====================================');
      console.log('📊 推薦処理完了');
      console.log('=====================================\n');

      return result;
    } catch (error) {
      console.error('\n❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
      console.error('❌ AgentCore推薦処理エラー');
      console.error('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
      console.error('エラーオブジェクト:', error);
      
      if (error instanceof Error) {
        // エラーの詳細をログに出力
        console.error('エラー詳細:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
        throw new AgentCoreError(`${error.name}: ${error.message}`);
      }
      throw new AgentCoreError('推薦処理に失敗しました（不明なエラー）');
    }
  }  /**
   * ローカルエージェントにHTTPリクエストを送信
   */
  private async callLocalAgent(payload: AgentCoreRequestPayload): Promise<RecommendationResponse> {
    const localAgentUrl = process.env.LOCAL_AGENT_URL || 'http://localhost:8080';
    console.log('  🏠 ローカルエージェント呼び出し');
    console.log('  エンドポイント:', `${localAgentUrl}/invocations`);
    console.log('  リクエストボディ:', JSON.stringify(payload, null, 2));

    const startTime = Date.now();
    const response = await fetch(`${localAgentUrl}/invocations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const elapsed = Date.now() - startTime;

    console.log('  ✅ HTTPレスポンス受信');
    console.log('  ステータス:', response.status, response.statusText);
    console.log('  処理時間:', elapsed, 'ms');

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('  ❌ HTTPエラーレスポンス:', errorBody);
      throw new Error(`ローカルエージェントエラー: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('  ✅ JSONパース完了');
    console.log('  生レスポンス:', JSON.stringify(result, null, 2));

    // エラーチェック
    if (result.error) {
      console.error('  ❌ レスポンスにerrorフィールドあり:', result.error);
      throw new Error(result.error);
    }

    // 結果を抽出（agentcoreは{"result": {...}}の形式で返す）
    const data = result.result || result;
    console.log('  📦 抽出データ:', {
      hasBestRecommend: !!data.best_recommend,
      recommendationsCount: data.recommendations?.length || 0,
      hasMetadata: !!data.metadata,
    });

    const finalResult = {
      best_recommend: data.best_recommend || null,
      recommendations: data.recommendations || [],
      metadata: data.metadata,
    };
    
    console.log('  ✅ ローカルエージェント処理完了');
    return finalResult;
  }

  /**
   * AgentCore Runtimeを呼び出し
   */
  private async callAgentCoreRuntime(payload: AgentCoreRequestPayload, userId: string): Promise<RecommendationResponse> {
    if (!this.agentCoreClient) {
      console.error('  ❌ AgentCore Clientが未初期化');
      throw new Error('AgentCore Clientが初期化されていません（USE_LOCAL_AGENT=trueの場合は使用できません）');
    }

    // 3. セッションIDを生成（33文字以上必要）
    const sessionId = `session-${userId}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    console.log('  🔑 セッションID生成:', sessionId);
    console.log('  セッションID長:', sessionId.length, '文字');

    // 4. InvokeAgentRuntimeCommandを実行
    console.log('  🚀 AgentCore Runtime呼び出し開始...');
    console.log('  Runtime ARN:', this.runtimeArn);
    console.log('  リクエストペイロード:', JSON.stringify(payload, null, 2));

    const command = new InvokeAgentRuntimeCommand({
      agentRuntimeArn: this.runtimeArn,
      runtimeSessionId: sessionId,
      payload: JSON.stringify(payload),
    });

    const startTime = Date.now();
    const response = await this.agentCoreClient.send(command);
    const elapsed = Date.now() - startTime;

    console.log('  ✅ AgentCore Runtimeからレスポンス受信');
    console.log('  処理時間:', elapsed, 'ms');
    console.log('  レスポンスオブジェクト型:', typeof response.response);

    // 5. レスポンスを処理
    if (!response.response) {
      console.error('  ❌ レスポンスが空（nullまたはundefined）');
      throw new Error('AgentCore Runtimeからのレスポンスが空です');
    }

    // レスポンスボディを読み取り（ストリームの場合）
    let responseBody: string;
    if (response.response instanceof Uint8Array) {
      // Uint8Arrayの場合
      console.log('  📦 レスポンス形式: Uint8Array');
      responseBody = new TextDecoder().decode(response.response);
    } else if (typeof response.response === 'string') {
      // 文字列の場合
      console.log('  📦 レスポンス形式: string');
      responseBody = response.response;
    } else {
      // ストリームの場合（Readable）
      console.log('  📦 レスポンス形式: Stream');
      const chunks: Uint8Array[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const chunk of response.response as any) {
        console.log('    チャンク受信:', chunk.length, 'bytes');
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      responseBody = buffer.toString('utf-8');
      console.log('  ✅ ストリーム読み取り完了:', buffer.length, 'bytes');
    }

    console.log('  📄 生レスポンスボディ:', responseBody);

    const result = JSON.parse(responseBody);
    console.log('  ✅ JSONパース完了');
    console.log('  パース結果:', JSON.stringify(result, null, 2));

    // エラーチェック
    if (result.error) {
      console.error('  ❌ レスポンスにerrorフィールドあり:', result.error);
      throw new Error(result.error);
    }

    // 結果を抽出（agentcoreは{"result": {...}}の形式で返す）
    const data = result.result || result;
    console.log('  📦 抽出データ:', {
      hasBestRecommend: !!data.best_recommend,
      recommendationsCount: data.recommendations?.length || 0,
      hasMetadata: !!data.metadata,
    });

    const finalResult = {
      best_recommend: data.best_recommend || null,
      recommendations: data.recommendations || [],
      metadata: data.metadata,
    };

    console.log('  ✅ AgentCore Runtime処理完了');
    return finalResult;
  }
}

/**
 * 推薦結果の型定義（AgentCoreからのレスポンス）
 */
export interface RecommendationResponse {
  best_recommend: BestRecommendation | null;
  recommendations: Recommendation[];
  metadata?: string;
}

/**
 * 最優先推薦の型定義（鉄板マッチ）
 */
export interface BestRecommendation {
  brand: string;
  brand_description: string;
  expected_experience: string;
  match_score: number;
}

/**
 * 推薦アイテムの型定義（次の一手・運命の出会い）
 */
export interface Recommendation {
  brand: string;
  brand_description: string;
  expected_experience: string;
  category: string;
  match_score: number;
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
