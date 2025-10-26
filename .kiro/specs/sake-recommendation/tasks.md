# 実装タスクリスト: 日本酒推薦機能

## 実装方針

- 既存のAgentCoreコードベースを活用し、不足している機能を追加実装
- Next.js API Routesを新規作成
- テストは実装後に追加（実装優先）
- 段階的に機能を追加し、各ステップで動作確認

## タスク一覧

- [x] 1. データモデルとバリデーションの強化
  - 既存のPydanticモデルを確認し、API仕様書に完全準拠させる
  - エラーメッセージを日本語化
  - _要件: 1.3, 1.4, 4.4, 5.4_

- [x] 1.1 DrinkingRecordモデルの更新
  - API仕様書のフィールド名に合わせる（sake_name → brand, taste_impression → impression）
  - Rating Enumの値を確認（VERY_GOOD, GOOD, BAD, VERY_BAD）
  - バリデーションエラーメッセージを日本語化
  - _要件: 1.3, 5.4_

- [x] 1.2 BestRecommendationとRecommendationモデルの更新
  - BestRecommendationモデルの作成（brand, brand_description, expected_experience, match_score）
  - Recommendationモデルの更新（brand, brand_description, expected_experience, category, match_score）
  - マッチ度範囲のバリデーション（1-100）
  - カテゴリーのバリデーション（動的な文言、1-50文字）
  - 文字数バリデーション（brand: 1-64, brand_description: 1-200, expected_experience: 1-500）
  - _要件: 3.3, 3.4, 4.2, 4.3, 4.4, 4.5, 4.8, 4.9_

- [x] 1.3 Menuモデルのバリデーション強化
  - 空リストチェック
  - 各銘柄の文字数チェック（1-64文字）
  - エラーメッセージを日本語化
  - _要件: 1.3, 1.4_

- [x] 2. BedrockServiceの実装完了
  - 既存のgenerate_text()メソッドを確認・修正
  - エラーハンドリングの追加
  - タイムアウト設定（15秒）
  - _要件: 3.3, 5.3, 7.4_

- [x] 2.1 Bedrock呼び出しの実装
  - Claude 3.5 Sonnetモデルの設定確認
  - リクエストボディの構築（anthropic_version, max_tokens, temperature）
  - レスポンスのパース処理
  - _要件: 3.3_

- [x] 2.2 エラーハンドリングとリトライ
  - ClientErrorのハンドリング
  - 2回までの自動リトライ（固定間隔）
  - タイムアウト設定（15秒）
  - 詳細なログ記録
  - _要件: 5.3, 7.4_

- [x] 3. DrinkingRecordServiceの実装完了
  - 既存のget_user_records()メソッドを確認・修正
  - DynamoDB接続の実装
  - エラーハンドリングの追加
  - _要件: 2.1, 2.2, 5.2, 8.1_

- [x] 3.1 DynamoDBクエリの実装
  - user_idでのクエリ実行
  - 最新100件の取得（ScanIndexForward=False, Limit=100）
  - created_atでのソート
  - _要件: 2.1, 7.2, 8.1_

- [x] 3.2 エラーハンドリングとリトライ
  - ClientErrorのハンドリング
  - 3回までの自動リトライ（指数バックオフ）
  - タイムアウト設定（5秒）
  - 詳細なログ記録
  - _要件: 5.2_

- [x] 4. RecommendationServiceの推薦アルゴリズム実装
  - プロンプト構築ロジックの更新（カテゴリー分類要件を含める）
  - Bedrockレスポンスのパース処理（best_recommendとrecommendationsの2層構造）
  - 推薦結果のマッチ度スコアリングとソート
  - カテゴリー分類ロジックの実装
  - _要件: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4.1 味の好み分析の実装
  - 飲酒履歴を評価別に分類（好き/合わない）
  - 味の感想テキストから特徴抽出
  - 好みの傾向をスコア化
  - 分析結果の構造化（preferred_tastes, disliked_tastes, analysis_summary）
  - _要件: 2.2, 2.3, 2.4_

- [x] 4.2 推薦プロンプトの構築
  - ユーザーの好み分析結果と味覚パーソナリティマップを含める
  - 最新10件の飲酒履歴を含める
  - メニューリスト（指定時）を含める
  - カテゴリー分類要件を明示（鉄板マッチは最もマッチ度が高い1件、その他は動的にカテゴリー名を生成）
  - カテゴリー名は推薦理由や特徴を表現する自由な文言（1-50文字）
  - JSON形式でのレスポンスを要求（best_recommendとrecommendations）
  - _要件: 3.1, 3.4, 3.6, 3.7_

- [x] 4.3 推薦結果のパースとバリデーション
  - BedrockのJSONレスポンスをパース（best_recommendとrecommendations）
  - BestRecommendationとRecommendationモデルに変換
  - 文字数とマッチ度範囲のバリデーション
  - カテゴリーのバリデーション（動的な文言、1-50文字）
  - best_recommend（1件、最もマッチ度が高い銘柄）を抽出
  - recommendations（最大2件）を抽出
  - _要件: 3.3, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8, 4.9_

- [x] 4.4 飲酒履歴0件時の処理
  - best_recommendをnullに設定
  - recommendationsを空配列に設定
  - メタデータとして「飲酒記録がありません。まずは飲んだお酒を記録してください」を含める
  - _要件: 2.5, 4.10_

- [x] 5. SakeRecommendationAgentの統合
  - recommend_sake()メソッドの更新
  - サービス層の呼び出しとエラーハンドリング
  - RecommendationResponseの構築（best_recommendとrecommendations）
  - _要件: 1.1, 1.2, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5.1 recommend_sake()の実装
  - DrinkingRecordServiceから飲酒履歴を取得
  - RecommendationServiceで推薦を生成（best_recommendとrecommendations）
  - RecommendationResponseに整形（2層構造）
  - エラー時の適切な例外スロー
  - _要件: 1.1, 1.2, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5.2 analyze_taste_preference()の実装
  - DrinkingRecordServiceから飲酒履歴を取得
  - RecommendationServiceで味の好み分析を実行
  - 分析結果を返却
  - _要件: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Next.js API Routeの実装
  - POST /agent/recommendエンドポイントの作成
  - 認証トークンの検証
  - リクエストバリデーション
  - AgentCore Runtime呼び出し
  - レスポンス整形
  - _要件: 1.1, 1.2, 1.3, 1.4, 5.1, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6.1 認証ミドルウェアの実装
  - Authorizationヘッダーからトークンを抽出
  - Cognito JWTトークンの検証（署名、有効期限、issuer、audience）
  - トークンからユーザーID（sub）を抽出
  - 認証エラー時は401 Unauthorizedを返す
  - _要件: 5.1, 6.5, 8.4_

- [x] 6.2 リクエストバリデーションの実装
  - リクエストボディのパース
  - menuフィールドの存在チェック
  - menuが配列であることを確認
  - menuが空でないことを確認
  - バリデーションエラー時は400 Bad Requestを返す
  - _要件: 1.3, 1.4_

- [x] 6.3 AgentCore Runtime呼び出しの実装
  - SakeRecommendationAgentのrecommend_sake()を呼び出し
  - user_idとmenuを渡す
  - max_recommendations=10を指定
  - タイムアウト設定（30秒）
  - _要件: 1.1, 1.5, 7.1_

- [x] 6.4 レスポンス整形の実装
  - RecommendationResponseをAPI仕様書の形式に変換
  - {"best_recommend": {...}, "recommendations": [{...}]}の2層構造
  - best_recommendにbrand, brand_description, expected_experience, match_scoreを含める
  - recommendationsの各要素にbrand, brand_description, expected_experience, category（動的生成）, match_scoreを含める
  - Content-Type: application/jsonを設定
  - 200 OKステータスコードを返す
  - _要件: 4.2, 4.3, 4.4, 4.5, 6.3, 6.4_

- [x] 6.5 エラーハンドリングの実装
  - 認証エラー: 401 Unauthorized
  - バリデーションエラー: 400 Bad Request
  - データベースエラー: 500 Internal Server Error
  - AgentCoreエラー: 500 Internal Server Error
  - 統一されたエラーレスポンス形式（error.code, error.message）
  - 日本語エラーメッセージ
  - _要件: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. 設定ファイルとユーティリティの実装
  - 環境変数の読み込み
  - 設定ファイルの管理
  - ログ設定
  - _要件: 5.5, 8.5_

- [x] 7.1 環境変数の設定
  - .env.exampleファイルの作成
  - 必要な環境変数のリスト化（BEDROCK_REGION, BEDROCK_MODEL_ID, DYNAMODB_TABLE_NAME等）
  - 開発環境と本番環境の設定分離
  - _要件: 該当なし（インフラ設定）_

- [x] 7.2 ログ設定の実装
  - structlogの設定
  - ログレベルの設定（開発: DEBUG, 本番: INFO）
  - ログフォーマットの統一（JSON形式）
  - 個人情報のマスキング
  - _要件: 5.5, 8.5_

- [x] 8. 統合とエンドツーエンドテスト
  - 全コンポーネントの統合
  - エンドツーエンドでの動作確認
  - エラーケースの確認
  - _要件: 全要件_

- [x] 8.1 開発環境でのテスト実行
  - Docker Composeで全サービスを起動
  - DynamoDB Localにテストデータを投入
  - POST /agent/recommendエンドポイントを呼び出し
  - レスポンスの確認
  - _要件: 全要件_

- [x] 8.2 正常系のテスト
  - 飲酒履歴あり、メニューありのケース
  - 飲酒履歴あり、メニューなしのケース
  - best_recommendが正しく返されることを確認（最もマッチ度が高い銘柄）
  - recommendationsが最大2件返されることを確認
  - カテゴリーが動的に生成された文言であることを確認（1-50文字）
  - _要件: 1.1, 1.2, 2.1, 3.1, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8.3 異常系のテスト
  - 認証トークンなしのケース（401エラー）
  - メニューが空のケース（400エラー）
  - 飲酒履歴0件のケース（best_recommend: null, recommendations: []）
  - DynamoDBエラーのシミュレーション（500エラー）
  - _要件: 1.4, 2.5, 4.10, 5.1, 5.2_

- [x] 8.4 パフォーマンステスト
  - レスポンス時間の測定（10秒以内を確認）
  - 複数リクエストの同時実行
  - メモリ使用量の確認
  - _要件: 7.1, 7.3_

- [x] 9. カテゴリー分類ロジックの更新
  - 「鉄板マッチ」: 最もマッチ度が高い銘柄を選択（best_recommend）
  - その他の銘柄: AIが文脈に応じて動的にカテゴリー名を生成
  - カテゴリー名は推薦理由や特徴を表現する自由な文言（1-50文字）
  - プロンプトでAIにカテゴリー生成の指示を含める
  - _要件: 3.6, 3.7, 4.5_

- [-] 10. ドキュメントの更新
  - README.mdの更新（API使用方法）
  - 新しいレスポンス形式の説明
  - カテゴリーの意味の説明
  - 環境変数の説明
  - トラブルシューティングガイド
  - _要件: 該当なし（ドキュメント）_

- [ ] 10.1 API使用方法のドキュメント作成
  - エンドポイントの説明
  - リクエスト例
  - レスポンス例（新しい2層構造）
  - カテゴリーの意味の説明
  - エラーレスポンス例
  - _要件: 該当なし（ドキュメント）_

- [ ] 10.2 開発環境セットアップガイドの更新
  - Docker Composeの使用方法
  - 環境変数の設定方法
  - テストデータの投入方法
  - _要件: 該当なし（ドキュメント）_
