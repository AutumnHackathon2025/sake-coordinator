# 要件定義書: 日本酒推薦機能

## Introduction

本機能は、ユーザーの過去の飲酒履歴（味の感想と評価）を分析し、提供されたメニューリストから最適な日本酒を推薦するAI駆動の推薦システムです。Amazon Bedrock AgentCoreを活用し、ユーザーの味覚の好みを学習してパーソナライズされた推薦を提供することで、注文時の失敗を減らし、より満足度の高い日本酒体験を実現します。

## Glossary

- **推薦システム**: ユーザーの飲酒履歴とメニューリストを入力として受け取り、おすすめの日本酒リストを出力するAIシステム
- **飲酒履歴**: ユーザーが過去に飲んだ日本酒の記録（銘柄、味の感想、評価を含む）
- **メニューリスト**: 推薦対象となる日本酒の銘柄の配列
- **推薦結果**: 銘柄、おすすめ度合い（1-5のスコア）、推薦理由を含むオブジェクト
- **AgentCore Runtime**: Amazon Bedrock AgentCoreの実行環境
- **認証トークン**: Amazon Cognitoが発行するJWT（IDトークン）
- **ユーザーID**: 認証トークンから抽出されるCognito sub（ユーザー識別子）

## Requirements

### Requirement 1: 推薦リクエストの受付

**User Story:** ユーザーとして、メニューリストを送信して日本酒の推薦を受けたい。そうすることで、自分の好みに合った日本酒を素早く見つけられる。

#### Acceptance Criteria

1. WHEN ユーザーが有効な認証トークンとメニューリストを含むリクエストを送信する, THEN THE 推薦システム SHALL リクエストを受け付け、処理を開始する
2. THE 推薦システム SHALL 認証トークンからユーザーIDを抽出する
3. THE 推薦システム SHALL メニューリストが1件以上の銘柄を含むことを検証する
4. IF メニューリストが空である, THEN THE 推薦システム SHALL 400 Bad Requestステータスコードとエラーコード「VALIDATION_ERROR」、エラーメッセージ「メニューを入力してください」を返す
5. THE 推薦システム SHALL 10秒以内に推薦処理を完了する

### Requirement 2: 飲酒履歴の取得と分析

**User Story:** システムとして、ユーザーの過去の飲酒履歴を取得して分析したい。そうすることで、ユーザーの味覚の好みを理解できる。

#### Acceptance Criteria

1. WHEN 推薦処理が開始される, THEN THE 推薦システム SHALL ユーザーIDに紐づく飲酒履歴をデータベースから取得する
2. THE 推薦システム SHALL 取得した飲酒履歴から銘柄、味の感想、評価の情報を抽出する
3. THE 推薦システム SHALL 味の感想テキストを分析し、ユーザーの好みの特徴（フルーティ、辛口、甘口等）を識別する
4. THE 推薦システム SHALL 評価（非常に好き、好き、合わない、非常に合わない）を数値化し、好みの傾向を計算する
5. IF 飲酒履歴が0件である, THEN THE 推薦システム SHALL 200 OKステータスコードと空の推薦結果配列、メタデータとして「飲酒記録がありません。まずは飲んだお酒を記録してください」を返す

### Requirement 3: メニューとの照合・スコアリング

**User Story:** システムとして、メニューリストの各銘柄をユーザーの好みと照合したい。そうすることで、最適な推薦を生成できる。

#### Acceptance Criteria

1. WHEN 飲酒履歴の分析が完了する, THEN THE 推薦システム SHALL メニューリスト内の各銘柄に対してマッチ度を計算する
2. THE 推薦システム SHALL ユーザーの好みの特徴と各銘柄の特性を比較し、1から100の範囲でマッチ度を算出する
3. THE 推薦システム SHALL 各銘柄に対して1文字以上200文字以内の銘柄説明を生成する
4. THE 推薦システム SHALL 各銘柄に対して1文字以上500文字以内の期待される体験を生成する
5. THE 推薦システム SHALL マッチ度の高い順に銘柄をソートする
6. THE 推薦システム SHALL 最もマッチ度の高い銘柄を「鉄板マッチ」として選択する
7. THE 推薦システム SHALL 残りの銘柄に対して、推薦理由や特徴を表現する動的なカテゴリー名を生成する

### Requirement 4: 推薦結果の返却

**User Story:** ユーザーとして、おすすめの日本酒リストを受け取りたい。そうすることで、どの日本酒を注文すべきか判断できる。

#### Acceptance Criteria

1. WHEN スコアリングが完了する, THEN THE 推薦システム SHALL 最もマッチ度の高い銘柄を`best_recommend`として選択する
2. THE 推薦システム SHALL `best_recommend`に銘柄、銘柄説明、期待される体験、マッチ度を含める
3. THE 推薦システム SHALL 残りの銘柄から上位2件を`recommendations`配列として選択する
4. THE 推薦システム SHALL `recommendations`の各要素に銘柄、銘柄説明、期待される体験、カテゴリー、マッチ度を含める
5. THE 推薦システム SHALL カテゴリーとして推薦理由や特徴を表現する動的な文言を設定する（1文字以上50文字以内）
6. THE 推薦システム SHALL 200 OKステータスコードと推薦結果を返す
7. THE 推薦システム SHALL 各銘柄の文字列が1文字以上64文字以内であることを保証する
8. THE 推薦システム SHALL 銘柄説明が1文字以上200文字以内であることを保証する
9. THE 推薦システム SHALL 期待される体験が1文字以上500文字以内であることを保証する
10. IF 推薦結果が0件である, THEN THE 推薦システム SHALL 200 OKステータスコードと空の推薦結果を返す

### Requirement 5: エラーハンドリング

**User Story:** ユーザーとして、エラーが発生した際に明確なメッセージを受け取りたい。そうすることで、問題を理解し適切に対応できる。

#### Acceptance Criteria

1. IF 認証トークンが無効または欠落している, THEN THE 推薦システム SHALL 401 Unauthorizedステータスコードとエラーコード「UNAUTHORIZED」、エラーメッセージ「認証に失敗しました」を返す
2. IF データベースへのアクセスに失敗する, THEN THE 推薦システム SHALL 500 Internal Server Errorステータスコードとエラーコード「DATABASE_ERROR」、エラーメッセージ「データベースへのアクセスに失敗しました」を返す
3. IF AgentCore Runtimeの実行に失敗する, THEN THE 推薦システム SHALL 500 Internal Server Errorステータスコードとエラーコード「AGENT_ERROR」、エラーメッセージ「推薦処理に失敗しました」を返す
4. THE 推薦システム SHALL すべてのエラーレスポンスに統一されたJSON形式（error.code、error.message）を使用する
5. THE 推薦システム SHALL すべてのエラーメッセージを日本語で提供する

### Requirement 6: API仕様への準拠

**User Story:** 開発者として、API仕様書に定義された通りにエンドポイントが動作してほしい。そうすることで、フロントエンドとの統合がスムーズに行える。

#### Acceptance Criteria

1. THE 推薦システム SHALL POST /agent/recommendエンドポイントでリクエストを受け付ける
2. THE 推薦システム SHALL リクエストボディとして{"menu": ["銘柄1", "銘柄2", ...]}形式のJSONを受け付ける
3. THE 推薦システム SHALL レスポンスボディとして以下の形式のJSONを返す:
   ```json
   {
     "best_recommend": {
       "brand": "銘柄",
       "brand_description": "説明",
       "expected_experience": "体験",
       "match_score": 数値
     },
     "recommendations": [
       {
         "brand": "銘柄",
         "brand_description": "説明",
         "expected_experience": "体験",
         "category": "カテゴリー",
         "match_score": 数値
       }
     ]
   }
   ```
4. THE 推薦システム SHALL Content-Typeヘッダーとしてapplication/jsonを使用する
5. THE 推薦システム SHALL すべてのリクエストでAuthorizationヘッダー（Bearer トークン）を要求する

### Requirement 7: パフォーマンス要件

**User Story:** ユーザーとして、推薦結果を迅速に受け取りたい。そうすることで、店内でストレスなくサービスを利用できる。

#### Acceptance Criteria

1. THE 推薦システム SHALL 通常の推薦処理を10秒以内に完了する
2. WHEN 飲酒履歴が100件以上存在する, THEN THE 推薦システム SHALL 最新の100件を分析対象として使用する
3. THE 推薦システム SHALL 同時に100リクエスト/秒を処理できる
4. THE 推薦システム SHALL AgentCore Runtimeとの通信タイムアウトを15秒に設定する
5. IF 処理時間が10秒を超える, THEN THE 推薦システム SHALL 処理を継続し、完了時にレスポンスを返す

### Requirement 8: セキュリティ要件

**User Story:** ユーザーとして、自分の飲酒履歴が他のユーザーに見られないようにしたい。そうすることで、安心してサービスを利用できる。

#### Acceptance Criteria

1. THE 推薦システム SHALL 認証トークンから抽出したユーザーIDに紐づく飲酒履歴のみを取得する
2. THE 推薦システム SHALL 他のユーザーの飲酒履歴にアクセスしない
3. THE 推薦システム SHALL すべてのデータベースクエリにユーザーIDフィルタを適用する
4. THE 推薦システム SHALL 認証トークンの署名を検証する
5. THE 推薦システム SHALL ログに個人を特定できる情報（銘柄、感想の詳細）を記録しない
