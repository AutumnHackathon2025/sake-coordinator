# Requirements Document

## Introduction

このspecは、TerraformのDynamoDBスキーマ定義とNext.jsアプリケーションのデータモデルを整合させるための要件を定義します。現在、infrastructure/modules/storage/main.tfで定義されているDynamoDBテーブルのスキーマと、Next.js側の実装（型定義、API Routes）に不整合があり、これを解消する必要があります。

## Glossary

- **DynamoDB**: AWSのNoSQLデータベースサービス
- **Next.js Application**: フロントエンドおよびバックエンドAPIを提供するアプリケーション
- **Terraform**: インフラストラクチャをコードで管理するIaCツール
- **Partition Key**: DynamoDBのプライマリキーの一部（userId）
- **Sort Key**: DynamoDBのプライマリキーの一部（recordId）
- **GSI**: Global Secondary Index - クエリ最適化のための追加インデックス
- **Schema Alignment**: スキーマの整合性を保つこと

## Requirements

### Requirement 1

**User Story:** 開発者として、TerraformのDynamoDBスキーマ定義に完全に準拠したNext.jsのデータモデルを使用したいので、データの保存・取得時にエラーが発生しないようにしたい

#### Acceptance Criteria

1. WHEN Next.jsアプリケーションが飲酒記録を保存する時、THE Next.js Application SHALL Terraformで定義されたパーティションキー（userId）とソートキー（recordId）を使用すること
2. WHEN Next.jsアプリケーションがデータ属性を定義する時、THE Next.js Application SHALL Terraformで定義された属性名（sake_name, rating, created_at）をスネークケースで使用すること
3. WHEN TypeScript型定義を作成する時、THE Next.js Application SHALL DynamoDBの実際のスキーマと一致する属性名を含むこと
4. WHEN APIレスポンスを返す時、THE Next.js Application SHALL フロントエンド向けにキャメルケースに変換した属性名を使用すること

### Requirement 2

**User Story:** 開発者として、DynamoDBのGSI（Global Secondary Index）を活用したクエリを実装したいので、適切なインデックス属性を使用してデータを保存したい

#### Acceptance Criteria

1. WHEN 飲酒記録を保存する時、THE Next.js Application SHALL GSI用の属性（sake_name, rating, created_at）を正しく設定すること
2. WHEN 銘柄で検索する時、THE Next.js Application SHALL sake_name-created_at-indexを使用してクエリを実行すること
3. WHEN 評価で検索する時、THE Next.js Application SHALL rating-created_at-indexを使用してクエリを実行すること

### Requirement 3

**User Story:** 開発者として、既存のAPI仕様書（docs/api-doc.md）との互換性を保ちながらDynamoDBスキーマに準拠したいので、変換レイヤーを実装したい

#### Acceptance Criteria

1. WHEN APIリクエストを受け取る時、THE Next.js Application SHALL キャメルケースのフィールド名をスネークケースに変換すること
2. WHEN APIレスポンスを返す時、THE Next.js Application SHALL スネークケースのフィールド名をキャメルケースに変換すること
3. WHEN 変換処理を実装する時、THE Next.js Application SHALL 既存のAPI仕様書で定義されたフィールド名を維持すること

### Requirement 4

**User Story:** 開発者として、型安全性を保ちながらDynamoDBとの連携を実装したいので、DynamoDB用とAPI用の型定義を分離したい

#### Acceptance Criteria

1. WHEN DynamoDB操作を実行する時、THE Next.js Application SHALL DynamoDBスキーマに準拠した型定義を使用すること
2. WHEN API層で型を使用する時、THE Next.js Application SHALL API仕様書に準拠した型定義を使用すること
3. WHEN 型変換を実装する時、THE Next.js Application SHALL 型安全な変換関数を提供すること
