import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';

/**
 * AgentCore Runtimeサービス
 * AWS SDKを使用してAgentCore Runtimeを呼び出す
 */
export class AgentCoreService {
  private client: BedrockAgentRuntimeClient;
  private runtimeId: string;

  constructor() {
    const region = process.env.AWS_REGION || 'ap-northeast-1';
    this.runtimeId = process.env.AGENTCORE_RUNTIME_ID || '';

    if (!this.runtimeId) {
      throw new Error('AGENTCORE_RUNTIME_ID環境変数が設定されていません');
    }

    this.client = new BedrockAgentRuntimeClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
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
      // AgentCore Runtimeへのリクエストペイロード
      const payload = {
        action: 'recommend_sake',
        user_id: userId,
        menu: {
          sake_names: menu,
        },
        max_recommendations: maxRecommendations,
      };

      // InvokeAgentCommandを実行
      const command = new InvokeAgentCommand({
        agentId: this.runtimeId,
        agentAliasId: 'TSTALIASID', // テストエイリアス
        sessionId: `session-${userId}-${Date.now()}`,
        inputText: JSON.stringify(payload),
      });

      const response = await this.client.send(command);

      // レスポンスのストリームを処理
      if (!response.completion) {
        throw new Error('AgentCore Runtimeからのレスポンスが空です');
      }

      // ストリームからテキストを抽出
      let responseText = '';
      for await (const event of response.completion) {
        if (event.chunk && event.chunk.bytes) {
          const chunk = new TextDecoder().decode(event.chunk.bytes);
          responseText += chunk;
        }
      }

      // JSONレスポンスをパース
      const result = JSON.parse(responseText) as RecommendationResponse;
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new AgentCoreError(`推薦処理に失敗しました: ${error.message}`);
      }
      throw new AgentCoreError('推薦処理に失敗しました');
    }
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
 * 推薦アイテムの型定義
 */
export interface Recommendation {
  sake_name: string;
  score: number;
  explanation: string;
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
