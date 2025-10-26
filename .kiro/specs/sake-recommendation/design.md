# 設計書: 日本酒推薦機能

## Overview

日本酒推薦機能は、Amazon Bedrock AgentCoreとStrandsフレームワークを活用したAI駆動の推薦システムです。ユーザーの過去の飲酒履歴（銘柄、味の感想、評価）を分析し、提供されたメニューリストから最適な日本酒を推薦します。

### 主要な設計目標

1. **パーソナライゼーション**: ユーザー個別の味覚の好みに基づく推薦
2. **説明可能性**: 推薦理由を明確に提示
3. **パフォーマンス**: 10秒以内のレスポンス時間
4. **スケーラビリティ**: 100リクエスト/秒の同時処理
5. **セキュリティ**: ユーザーデータの厳格な分離

## Architecture

### システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App (ECS)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           POST /agent/recommend                       │   │
│  │  - 認証トークン検証 (Cognito JWT)                      │   │
│  │  - リクエストバリデーション                            │   │
│  │  - AgentCore Runtime呼び出し                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Amazon Bedrock AgentCore Runtime                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         SakeRecommendationAgent (Strands)            │   │
│  │  - recommend_sake(): 推薦実行                         │   │
│  │  - analyze_taste_preference(): 味の好み分析          │   │
│  └──────────────────────────────────────────────────────┘   │
│                              ↓                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         RecommendationService                         │   │
│  │  - generate_recommendations(): 推薦生成              │   │
│  │  - analyze_taste_preference(): 好み分析              │   │
│  │  - _build_recommendation_prompt(): プロンプト構築    │   │
│  └──────────────────────────────────────────────────────┘   │
│         ↓                                    ↓                │
│  ┌──────────────┐                  ┌──────────────────┐     │
│  │ BedrockService│                  │DrinkingRecordSvc │     │
│  │ - Claude 3.5  │                  │ - DynamoDB接続   │     │
│  │ - Titan Embed │                  │ - 履歴取得       │     │
│  └──────────────┘                  └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                    ↓                          ↓
        ┌──────────────────┐      ┌──────────────────┐
        │ Amazon Bedrock   │      │   DynamoDB       │
        │ - Claude 3.5     │      │ - 飲酒履歴テーブル│
        │ - Titan Embed    │      │ - ユーザーID索引 │
        └──────────────────┘      └──────────────────┘
```

### レイヤー構成

1. **API Layer** (Next.js API Routes)
   - 認証・認可
   - リクエストバリデーション
   - エラーハンドリング
   - AgentCore Runtime呼び出し

2. **Agent Layer** (AgentCore + Strands)
   - SakeRecommendationAgent: 推薦ロジックの統括
   - コンテキスト管理
   - エージェント間の協調

3. **Service Layer**
   - RecommendationService: 推薦アルゴリズム
   - DrinkingRecordService: 飲酒履歴管理
   - BedrockService: AI基盤モデル呼び出し

4. **Data Layer**
   - DynamoDB: 飲酒履歴の永続化
   - AgentCore Memory: エージェントの短期・長期記憶

## Components and Interfaces

### 1. API Endpoint (Next.js)

#### POST /agent/recommend

**責務**: 推薦リクエストの受付とレスポンス返却

**インターフェース**:
```typescript
// リクエスト
interface RecommendRequest {
  menu: string[];  // 銘柄リスト
}

// レスポンス（成功）
interface RecommendResponse {
  best_recommend: {
    brand: string;              // 銘柄（1-64文字）
    brand_description: string;  // 銘柄の説明（1-200文字）
    expected_experience: string;// 期待される体験（1-500文字）
    match_score: number;        // マッチ度（1-100）
  };
  recommendations: Array<{
    brand: string;              // 銘柄（1-64文字）
    brand_description: string;  // 銘柄の説明（1-200文字）
    expected_experience: string;// 期待される体験（1-500文字）
    category: string;           // カテゴリー（次の一手 | 運命の出会い）
    match_score: number;        // マッチ度（1-100）
  }>;
}

// レスポンス（エラー）
interface ErrorResponse {
  error: {
    code: string;       // エラーコード
    message: string;    // エラーメッセージ（日本語）
  };
}
```

**処理フロー**:
1. Authorizationヘッダーから認証トークンを抽出
2. Cognito JWTトークンを検証
3. トークンからユーザーID（sub）を抽出
4. リクエストボディをバリデーション
5. AgentCore Runtimeに推薦リクエストを送信
6. レスポンスを整形して返却

**エラーハンドリング**:
- 401 Unauthorized: 認証トークンが無効または欠落
- 400 Bad Request: メニューリストが空または不正
- 500 Internal Server Error: AgentCore実行エラー、DB接続エラー

### 2. SakeRecommendationAgent (Strands Agent)

**責務**: 推薦処理の統括とエージェント協調

**クラス定義**:
```python
class SakeRecommendationAgent(Agent):
    """日本酒推薦エージェント"""
    
    def __init__(self):
        super().__init__()
        self.recommendation_service = RecommendationService()
        self.drinking_record_service = DrinkingRecordService()
    
    async def recommend_sake(
        self, 
        context: Context,
        user_id: str,
        menu: Optional[Menu] = None,
        max_recommendations: int = 10
    ) -> RecommendationResponse:
        """日本酒推薦を実行"""
        
    async def analyze_taste_preference(
        self,
        context: Context,
        user_id: str
    ) -> dict:
        """味の好み分析"""
```

**処理フロー**:
1. DrinkingRecordServiceから飲酒履歴を取得
2. RecommendationServiceで推薦を生成
3. 結果をRecommendationResponseに整形
4. エラー時は適切な例外をスロー

### 3. RecommendationService

**責務**: 推薦アルゴリズムの実装

**主要メソッド**:

#### generate_recommendations()
```python
async def generate_recommendations(
    self,
    user_id: str,
    drinking_records: List[DrinkingRecord],
    menu: Optional[Menu] = None
) -> Tuple[Optional[BestRecommendation], List[Recommendation]]:
    """推薦を生成（best_recommendとrecommendationsを返す）"""
```

**アルゴリズム**:
1. **味の好み分析**
   - 飲酒履歴を評価別に分類（好き/合わない）
   - 味の感想テキストから特徴抽出（フルーティ、辛口、甘口等）
   - 好みの傾向をスコア化
   - ユーザーの味覚パーソナリティマップを構築

2. **プロンプト構築**
   - ユーザーの好み分析結果と味覚パーソナリティマップを含める
   - 最新10件の飲酒履歴を含める
   - メニューリスト（指定時）を含める
   - 推薦要件を明示:
     - 最もマッチ度の高い銘柄を「鉄板マッチ」として選択（best_recommend）
     - 残りの銘柄については、AIが文脈に応じて動的にカテゴリーを生成
     - カテゴリー名は推薦理由や特徴を表現する自由な文言（例: "新しい味わいへの挑戦", "あなたの好みに近い一本", "意外な発見"等）
     - 各銘柄に銘柄説明と期待される体験を含める
   - JSON形式でのレスポンスを要求

3. **Bedrock呼び出し**
   - Claude 3.5 Sonnetモデルを使用
   - JSON形式でのレスポンスを要求
   - タイムアウト: 15秒

4. **結果パース**
   - JSONレスポンスをパース
   - BestRecommendationとRecommendationモデルに変換
   - バリデーション（文字数、マッチ度範囲）
   - best_recommend（1件、最もマッチ度が高い銘柄）を抽出
   - recommendations（最大2件）を抽出（カテゴリーはAIが動的に生成）

#### analyze_taste_preference()
```python
async def analyze_taste_preference(
    self,
    user_id: str,
    drinking_records: List[DrinkingRecord]
) -> Dict[str, Any]:
    """味の好み分析"""
```

**分析項目**:
- preferred_tastes: 好む味の特徴リスト
- disliked_tastes: 避けるべき味の特徴リスト
- rating_distribution: 評価の分布
- analysis_summary: 好みの要約（200文字以内）

### 4. DrinkingRecordService

**責務**: 飲酒履歴データの取得

**主要メソッド**:

#### get_user_records()
```python
async def get_user_records(
    self,
    user_id: str,
    limit: Optional[int] = 100
) -> List[DrinkingRecord]:
    """ユーザーの飲酒記録を取得"""
```

**DynamoDBクエリ**:
- テーブル: drinking_records
- パーティションキー: user_id
- ソートキー: created_at（降順）
- 制限: 最新100件（パフォーマンス要件）

### 5. BedrockService

**責務**: Amazon Bedrockとの通信

**主要メソッド**:

#### generate_text()
```python
async def generate_text(
    self,
    prompt: str,
    max_tokens: int = 2000,
    temperature: float = 0.7
) -> str:
    """テキスト生成"""
```

**モデル設定**:
- モデルID: anthropic.claude-3-5-sonnet-20241022-v2:0
- max_tokens: 2000
- temperature: 0.7（バランスの取れた創造性）
- タイムアウト: 15秒

## Data Models

### DrinkingRecord (飲酒履歴)

```python
class DrinkingRecord(BaseModel):
    id: Optional[str]                    # 記録ID (UUID)
    user_id: str                         # ユーザーID
    sake_name: str                       # 銘柄（1-64文字）
    taste_impression: str                # 味の感想（1-1000文字）
    rating: Rating                       # 評価（Enum）
    label_image_url: Optional[str]       # ラベル画像URL
    created_at: Optional[datetime]       # 作成日時
    updated_at: Optional[datetime]       # 更新日時
```

**Rating Enum**:
- LOVE: "非常に好き"
- LIKE: "好き"
- DISLIKE: "合わない"
- HATE: "非常に合わない"

### Menu (メニュー)

```python
class Menu(BaseModel):
    sake_names: List[str]  # 銘柄リスト（各1-64文字）
```

**バリデーション**:
- 空リスト不可
- 各銘柄名は1-64文字
- 重複は自動除去

### BestRecommendation (最優先推薦)

```python
class BestRecommendation(BaseModel):
    brand: str                  # 銘柄（1-64文字）
    brand_description: str      # 銘柄の説明（1-200文字）
    expected_experience: str    # 期待される体験（1-500文字）
    match_score: int            # マッチ度（1-100）
```

### Recommendation (その他の推薦)

```python
class Recommendation(BaseModel):
    brand: str                  # 銘柄（1-64文字）
    brand_description: str      # 銘柄の説明（1-200文字）
    expected_experience: str    # 期待される体験（1-500文字）
    category: str               # カテゴリー（AIが動的に生成、1-50文字）
    match_score: int            # マッチ度（1-100）
```

### RecommendationResponse (推薦レスポンス)

```python
class RecommendationResponse(BaseModel):
    best_recommend: Optional[BestRecommendation]  # 最優先推薦
    recommendations: List[Recommendation]          # その他の推薦リスト（最大2件）
```

## Error Handling

### エラー分類と対応

#### 1. 認証エラー (401 Unauthorized)

**発生条件**:
- 認証トークンが欠落
- トークンの署名が無効
- トークンの有効期限切れ

**レスポンス**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認証に失敗しました"
  }
}
```

#### 2. バリデーションエラー (400 Bad Request)

**発生条件**:
- メニューリストが空
- 銘柄名が64文字超過
- リクエストボディの形式が不正

**レスポンス例**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "メニューを入力してください"
  }
}
```

#### 3. データベースエラー (500 Internal Server Error)

**発生条件**:
- DynamoDBへの接続失敗
- クエリ実行エラー
- タイムアウト

**レスポンス**:
```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "データベースへのアクセスに失敗しました"
  }
}
```

#### 4. AgentCoreエラー (500 Internal Server Error)

**発生条件**:
- Bedrock呼び出し失敗
- プロンプト生成エラー
- レスポンスパースエラー

**レスポンス**:
```json
{
  "error": {
    "code": "AGENT_ERROR",
    "message": "推薦処理に失敗しました"
  }
}
```

### エラーハンドリング戦略

1. **リトライ戦略**
   - DynamoDB: 3回まで自動リトライ（指数バックオフ）
   - Bedrock: 2回まで自動リトライ（固定間隔）

2. **タイムアウト設定**
   - API全体: 30秒
   - DynamoDBクエリ: 5秒
   - Bedrock呼び出し: 15秒

3. **ログ記録**
   - エラー発生時は詳細をstructlogで記録
   - ユーザーIDとリクエストIDを含める
   - 個人情報（銘柄、感想）は記録しない

4. **フォールバック**
   - 飲酒履歴0件: 空の推薦リストを返す（エラーではない）
   - 推薦結果0件: 空の推薦リストを返す（エラーではない）

## Testing Strategy

### 1. ユニットテスト (pytest)

**対象**:
- RecommendationService
  - generate_recommendations()
  - analyze_taste_preference()
  - _build_recommendation_prompt()
  - _parse_recommendations()
- DrinkingRecordService
  - get_user_records()
- BedrockService
  - generate_text()

**モック対象**:
- boto3クライアント（DynamoDB、Bedrock）
- 外部API呼び出し

**テストケース例**:
```python
async def test_generate_recommendations_with_menu():
    """メニュー指定時の推薦生成"""
    # Given
    user_id = "test_user"
    drinking_records = [...]
    menu = Menu(sake_names=["獺祭", "久保田", "黒龍"])
    
    # When
    best_recommend, recommendations = await service.generate_recommendations(
        user_id, drinking_records, menu
    )
    
    # Then
    assert best_recommend is not None
    assert best_recommend.match_score >= 70
    assert len(recommendations) <= 2
    assert all(r.brand in menu.sake_names for r in recommendations)
    assert all(r.category in ["次の一手", "運命の出会い"] for r in recommendations)
```

### 2. 統合テスト

**対象**:
- SakeRecommendationAgent
  - recommend_sake()の完全フロー
  - DynamoDB → Bedrock → レスポンス

**環境**:
- DynamoDB Local
- Bedrock（実際のAPI、またはLocalStack）

**テストケース**:
- 正常系: 飲酒履歴あり、メニューあり
- 正常系: 飲酒履歴あり、メニューなし
- 正常系: 飲酒履歴なし
- 異常系: DynamoDBエラー
- 異常系: Bedrockエラー

### 3. パフォーマンステスト

**目標**:
- レスポンス時間: 10秒以内（P95）
- スループット: 100リクエスト/秒

**ツール**:
- Locust（負荷テスト）
- pytest-benchmark（ベンチマーク）

**シナリオ**:
- 同時100ユーザー、各10リクエスト
- 飲酒履歴100件のユーザー
- メニュー20件

### 4. E2Eテスト

**対象**:
- Next.js API → AgentCore → DynamoDB → Bedrock

**ツール**:
- Playwright（フロントエンド含む）
- pytest + requests（API単体）

**テストケース**:
- 認証トークン付きリクエスト
- 推薦結果の表示
- エラーメッセージの表示

## Performance Optimization

### 1. キャッシング戦略

**AgentCore Memory活用**:
- ユーザーの味の好み分析結果をキャッシュ（TTL: 1時間）
- 同一メニューの推薦結果をキャッシュ（TTL: 10分）

**実装**:
```python
# 味の好み分析結果をキャッシュ
cache_key = f"taste_preference:{user_id}"
cached_analysis = await context.memory.get(cache_key)
if cached_analysis:
    return cached_analysis

analysis = await self._analyze_taste_preference(...)
await context.memory.set(cache_key, analysis, ttl=3600)
```

### 2. クエリ最適化

**DynamoDB**:
- 最新100件のみ取得（Limit指定）
- 必要な属性のみ取得（ProjectionExpression）
- GSI（Global Secondary Index）の活用

**Bedrock**:
- プロンプトの最適化（トークン数削減）
- 並列処理（複数ユーザーの推薦を同時実行）

### 3. 非同期処理

**asyncio活用**:
- DynamoDBクエリとBedrock呼び出しを並列化
- 複数の推薦リクエストを同時処理

```python
# 並列処理の例
async def recommend_sake(self, ...):
    # 飲酒履歴取得とキャッシュチェックを並列実行
    records_task = self.drinking_record_service.get_user_records(user_id)
    cache_task = context.memory.get(f"recommendations:{user_id}")
    
    records, cached = await asyncio.gather(records_task, cache_task)
```

## Security Considerations

### 1. 認証・認可

**Cognito JWT検証**:
- トークンの署名検証
- 有効期限チェック
- issuer、audienceの検証

**ユーザーデータ分離**:
- すべてのDynamoDBクエリにuser_idフィルタを適用
- 他のユーザーのデータへのアクセスを防止

### 2. 入力バリデーション

**Pydanticモデル**:
- すべての入力をPydanticモデルで検証
- 文字数制限、型チェック
- SQLインジェクション対策（DynamoDBはNoSQL）

### 3. ログとモニタリング

**ログ記録**:
- structlogで構造化ログ
- リクエストID、ユーザーIDを含める
- 個人情報（銘柄、感想）は記録しない

**モニタリング**:
- CloudWatch Metricsでパフォーマンス監視
- エラー率、レスポンス時間、スループット
- アラート設定（エラー率 > 5%）

### 4. レート制限

**API Gateway**:
- ユーザーごとのレート制限（100リクエスト/分）
- バーストトラフィック対策

## Deployment Architecture

### 開発環境

**Docker Compose**:
```yaml
services:
  sake-agent-dev:
    build: ./agentcore
    environment:
      - DYNAMODB_ENDPOINT=http://dynamodb-local:8000
      - BEDROCK_REGION=us-east-1
    depends_on:
      - dynamodb-local
  
  dynamodb-local:
    image: amazon/dynamodb-local
    ports:
      - "8000:8000"
```

### 本番環境

**AgentCore Runtime**:
- AWS Lambda（コンテナイメージ）
- メモリ: 2048MB
- タイムアウト: 30秒
- 同時実行数: 100

**DynamoDB**:
- オンデマンドキャパシティ
- ポイントインタイムリカバリ有効
- 暗号化有効（AWS KMS）

**Bedrock**:
- Claude 3.5 Sonnet
- リージョン: us-east-1
- スロットリング: 100リクエスト/秒

## Configuration Management

### 環境変数

```bash
# AgentCore
BEDROCK_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
DYNAMODB_REGION=ap-northeast-1
DYNAMODB_TABLE_NAME=drinking_records
DYNAMODB_ENDPOINT=  # 開発環境のみ指定

# Next.js
AGENTCORE_RUNTIME_ID=  # AgentCore RuntimeのID
AGENTCORE_MEMORY_ID=   # AgentCore MemoryのID
AWS_REGION=ap-northeast-1
```

### 設定ファイル

**agentcore/config/config.yaml**:
```yaml
bedrock:
  region: us-east-1
  model_id: anthropic.claude-3-5-sonnet-20241022-v2:0
  max_tokens: 2000
  temperature: 0.7

dynamodb:
  region: ap-northeast-1
  table_name: drinking_records
  max_records: 100

recommendation:
  max_recommendations: 10
  cache_ttl: 600  # 10分
```

## Monitoring and Observability

### メトリクス

**CloudWatch Metrics**:
- RecommendationLatency: 推薦処理時間
- RecommendationCount: 推薦実行回数
- ErrorRate: エラー率
- BedrockLatency: Bedrock呼び出し時間
- DynamoDBLatency: DynamoDB呼び出し時間

### ログ

**structlog形式**:
```json
{
  "timestamp": "2025-10-25T12:34:56Z",
  "level": "info",
  "event": "日本酒推薦を完了",
  "user_id": "user_123",
  "request_id": "req_456",
  "recommendation_count": 5,
  "latency_ms": 3500
}
```

### アラート

**CloudWatch Alarms**:
- エラー率 > 5%（5分間）
- レスポンス時間 > 10秒（P95、5分間）
- DynamoDB読み取りエラー > 10件（1分間）
- Bedrockスロットリング > 5件（1分間）

## Future Enhancements

### Phase 2

1. **推薦精度向上**
   - ユーザーフィードバックの収集
   - 推薦結果のクリック率分析
   - A/Bテストによるアルゴリズム改善

2. **パーソナライゼーション強化**
   - 時間帯別の推薦（昼/夜）
   - 季節別の推薦（夏/冬）
   - 料理との相性を考慮

3. **マルチエージェント協調**
   - 味の分析エージェント
   - メニュー分析エージェント
   - 推薦生成エージェント
   - 各エージェントの専門化

### Phase 3

1. **リアルタイム学習**
   - ユーザーの評価を即座に反映
   - オンライン学習アルゴリズム

2. **ソーシャル機能**
   - 友人の推薦を参考
   - コミュニティの人気銘柄

3. **多言語対応**
   - 英語、中国語での推薦
   - 多言語の味の感想分析
