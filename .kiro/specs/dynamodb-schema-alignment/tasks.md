# Implementation Plan

- [x] 1. 型定義の作成とセットアップ
  - DynamoDBスキーマに準拠した型定義とAPI型定義を分離し、型安全性を確保する
  - _Requirements: 1.3, 4.1, 4.2_

- [x] 1.1 DynamoDB型定義ファイルの作成
  - `nextjs/src/types/dynamodb.ts`を作成
  - `DynamoDBDrinkingRecord`インターフェースを定義（userId, recordId, sake_name, impression, rating, label_image_key, created_at, updated_at）
  - GSIクエリ用の型（`QueryBySakeNameParams`, `QueryByRatingParams`）を定義
  - _Requirements: 1.3, 4.1_

- [x] 1.2 既存API型定義の確認と調整
  - `nextjs/src/types/api.ts`の`DrinkingRecord`インターフェースを確認
  - API仕様書との整合性を確認（id, brand, labelImageKey, createdAt, updatedAt）
  - _Requirements: 3.3, 4.2_

- [x] 2. 変換レイヤーの実装
  - DynamoDB型とAPI型の間の双方向変換関数を実装し、命名規則の違いを吸収する
  - _Requirements: 3.1, 3.2, 4.3_

- [x] 2.1 変換関数の実装
  - `nextjs/src/utils/transform.ts`に`fromDynamoDBRecord`関数を実装（DynamoDB型 → API型）
  - `toDynamoDBRecord`関数を実装（API型 → DynamoDB型）
  - スネークケースとキャメルケースの変換処理を含める
  - _Requirements: 3.1, 3.2, 4.3_

- [x] 2.2 変換関数のユニットテスト作成
  - `nextjs/src/utils/__tests__/transform.test.ts`を作成
  - 正常系のテストケース（完全なデータ、部分的なデータ）
  - エッジケースのテストケース（undefined値、空文字列）
  - _Requirements: 3.1, 3.2, 4.3_

- [x] 3. DynamoDBサービスレイヤーの実装
  - DynamoDBとの通信を担当するサービスクラスを実装し、CRUD操作とGSIクエリをサポートする
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [x] 3.1 DynamoDBサービスクラスの作成
  - `nextjs/src/services/dynamodb-records.ts`を作成
  - `DynamoDBRecordsService`クラスを実装
  - `createRecord`メソッド（PutCommand使用）
  - `getRecordsByUserId`メソッド（QueryCommand使用、userId検索）
  - `getRecord`メソッド（GetCommand使用、userId + recordId検索）
  - _Requirements: 1.1, 1.2_

- [x] 3.2 GSIクエリメソッドの実装
  - `queryBySakeName`メソッド（sake_name-created_at-index使用）
  - `queryByRating`メソッド（rating-created_at-index使用）
  - 日付範囲フィルタリングのサポート
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.3 更新・削除メソッドの実装
  - `updateRecord`メソッド（UpdateCommand使用）
  - `deleteRecord`メソッド（DeleteCommand使用）
  - 動的なUpdateExpression生成
  - _Requirements: 1.1, 1.2_

- [x] 3.4 DynamoDBサービスのユニットテスト作成
  - `nextjs/src/services/__tests__/dynamodb-records.test.ts`を作成
  - モックDynamoDBクライアントを使用
  - 各メソッドの正常系・異常系テスト
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [ ] 4. API Routesの実装
  - 飲酒記録のCRUD操作を提供するAPI Routesを実装し、変換レイヤーとDynamoDBサービスを統合する
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3_

- [x] 4.1 POST /api/records エンドポイントの実装
  - `nextjs/src/app/api/records/route.ts`を作成
  - POST関数を実装（飲酒記録の作成）
  - 認証チェック（validateAuth）
  - リクエストバリデーション（brand: 1-64文字、impression: 1-1000文字、rating: enum値）
  - UUID生成（recordId）
  - DynamoDBサービスを使用してデータ保存
  - API形式でレスポンス返却（201 Created）
  - _Requirements: 1.1, 3.1, 3.2, 3.3_

- [x] 4.2 GET /api/records エンドポイントの実装
  - 同じ`route.ts`にGET関数を実装（飲酒記録の一覧取得）
  - 認証チェック
  - クエリパラメータ`q`のサポート（検索機能）
  - DynamoDBサービスを使用してデータ取得
  - 検索クエリがある場合はフィルタリング
  - API形式でレスポンス返却（200 OK）
  - _Requirements: 1.2, 3.1, 3.2, 3.3_

- [x] 4.3 PUT /api/records/[recordId] エンドポイントの実装
  - `nextjs/src/app/api/records/[recordId]/route.ts`を作成
  - PUT関数を実装（飲酒記録の更新）
  - 認証チェック
  - 既存レコードの存在確認（404エラー処理）
  - 部分更新のサポート
  - DynamoDBサービスを使用してデータ更新
  - API形式でレスポンス返却（200 OK）
  - _Requirements: 1.2, 3.1, 3.2, 3.3_

- [x] 4.4 DELETE /api/records/[recordId] エンドポイントの実装
  - 同じ`[recordId]/route.ts`にDELETE関数を実装（飲酒記録の削除）
  - 認証チェック
  - 既存レコードの存在確認（404エラー処理）
  - DynamoDBサービスを使用してデータ削除
  - 204 No Contentレスポンス返却
  - _Requirements: 1.2, 3.1, 3.2, 3.3_

- [x] 4.5 API Routesの統合テスト作成
  - `nextjs/src/app/api/records/__tests__/route.test.ts`を作成
  - 各エンドポイントの正常系・異常系テスト
  - 認証エラーのテスト
  - バリデーションエラーのテスト
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3_

- [x] 5. 環境設定とドキュメント更新
  - 環境変数の設定とドキュメントの更新を行い、実装を完了する
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5.1 環境変数の設定
  - `nextjs/.env.local`に`DYNAMODB_TABLE_NAME`を追加
  - `nextjs/.env.example`を更新
  - _Requirements: 1.1_

- [x] 5.2 依存関係の確認とインストール
  - `package.json`の依存関係を確認（uuid, @types/uuid）
  - 必要に応じて`npm install uuid @types/uuid`を実行
  - _Requirements: 1.1_

- [x] 5.3 ドキュメントの更新
  - `README.md`にDynamoDBスキーマ情報を追加
  - API仕様書との整合性を文書化
  - _Requirements: 3.3_

- [x] 6. 動作確認とテスト
  - 実装したコードの動作確認を行い、TerraformのDynamoDBスキーマとの整合性を検証する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

- [x] 6.1 DynamoDB Localでの動作確認
  - DynamoDB Localを起動
  - Terraformスキーマに準拠したテーブルを作成
  - API経由でCRUD操作を実行
  - データがスネークケースで保存されることを確認
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 6.2 GSIクエリの動作確認
  - 銘柄検索（sake_name-created_at-index）の動作確認
  - 評価検索（rating-created_at-index）の動作確認
  - クエリ結果が正しくAPI形式に変換されることを確認
  - _Requirements: 2.1, 2.2, 2.3_
