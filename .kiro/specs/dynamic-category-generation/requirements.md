# 要件定義書: 推薦カテゴリーの動的生成

## Introduction

本機能は、日本酒推薦システムにおいて、固定されたカテゴリー名（「次の一手」「運命の出会い」）から、AIが文脈に応じて動的に生成するカテゴリー名への変更を実装します。これにより、より柔軟で説明的な推薦理由をユーザーに提供できるようになります。

## Glossary

- **推薦システム**: ユーザーの飲酒履歴とメニューリストを入力として受け取り、おすすめの日本酒リストを出力するAIシステム
- **best_recommend**: 最もマッチ度が高い1件の推薦（鉄板マッチ）
- **recommendations**: best_recommend以外の推薦リスト（最大2件）
- **動的カテゴリー**: AIが推薦理由や特徴に応じて自由に生成するカテゴリー名（1-50文字）
- **RecommendationService**: 推薦アルゴリズムを実装するサービスクラス
- **Bedrock**: Amazon Bedrockの基盤モデル（Claude 3.5 Sonnet）

## Requirements

### Requirement 1: カテゴリー生成ロジックの変更

**User Story:** 開発者として、推薦カテゴリーをマッチ度ベースの固定値から動的生成に変更したい。そうすることで、より柔軟で説明的な推薦理由を提供できる。

#### Acceptance Criteria

1. THE 推薦システム SHALL 最もマッチ度が高い銘柄をbest_recommendとして選択する
2. THE 推薦システム SHALL best_recommendにカテゴリーフィールドを含めない
3. THE 推薦システム SHALL recommendations配列の各要素に動的に生成されたカテゴリーを含める
4. THE 推薦システム SHALL カテゴリー名として推薦理由や特徴を表現する文言を生成する
5. THE 推薦システム SHALL カテゴリー名が1文字以上10文字以内であることを保証する

### Requirement 2: プロンプトの更新

**User Story:** 開発者として、Bedrockへのプロンプトを更新してカテゴリー動的生成を指示したい。そうすることで、AIが適切なカテゴリー名を生成できる。

#### Acceptance Criteria

1. THE 推薦システム SHALL プロンプトにカテゴリー動的生成の指示を含める
2. THE 推薦システム SHALL カテゴリー名の例を提示する（「新しい挑戦」「好みに近い」「意外な発見」等）
3. THE 推薦システム SHALL カテゴリー名の文字数制限（1-10文字）を明示する
4. THE 推薦システム SHALL best_recommendにはカテゴリーを含めないことを明示する
5. THE 推薦システム SHALL recommendationsの各要素にカテゴリーを含めることを明示する

### Requirement 3: データモデルの更新

**User Story:** 開発者として、Recommendationモデルのカテゴリーバリデーションを更新したい。そうすることで、動的に生成されたカテゴリー名を正しく検証できる。

#### Acceptance Criteria

1. THE 推薦システム SHALL Recommendationモデルのcategoryフィールドを文字列型として定義する
2. THE 推薦システム SHALL categoryフィールドに1文字以上10文字以内のバリデーションを適用する
3. THE 推薦システム SHALL categoryフィールドが空文字列でないことを検証する
4. THE 推薦システム SHALL 固定値（「次の一手」「運命の出会い」）のバリデーションを削除する
5. THE 推薦システム SHALL バリデーションエラー時に日本語のエラーメッセージを返す

### Requirement 4: レスポンスパース処理の更新

**User Story:** 開発者として、BedrockのJSONレスポンスをパースする処理を更新したい。そうすることで、動的に生成されたカテゴリーを正しく抽出できる。

#### Acceptance Criteria

1. WHEN BedrockからJSONレスポンスを受信する, THEN THE 推薦システム SHALL best_recommendオブジェクトを抽出する
2. THE 推薦システム SHALL best_recommendにcategoryフィールドが含まれていないことを確認する
3. THE 推薦システム SHALL recommendationsオブジェクトを抽出する
4. THE 推薦システム SHALL recommendationsの各要素からcategoryフィールドを抽出する
5. THE 推薦システム SHALL categoryフィールドが1-10文字の範囲内であることを検証する
6. IF categoryフィールドが範囲外である, THEN THE 推薦システム SHALL バリデーションエラーをスローする

### Requirement 5: 既存テストの更新

**User Story:** 開発者として、既存のテストを更新してカテゴリー動的生成に対応したい。そうすることで、変更後も品質を保証できる。

#### Acceptance Criteria

1. THE 推薦システム SHALL ユニットテストでカテゴリーが動的な文言であることを検証する
2. THE 推薦システム SHALL 統合テストでBedrockが動的なカテゴリーを生成することを確認する
3. THE 推薦システム SHALL テストで固定値（「次の一手」「運命の出会い」）のアサーションを削除する
4. THE 推薦システム SHALL テストでカテゴリーの文字数（1-10文字）を検証する
5. THE 推薦システム SHALL テストでbest_recommendにcategoryフィールドが含まれないことを確認する

### Requirement 6: 後方互換性の確保

**User Story:** 開発者として、既存のAPIレスポンス形式を維持したい。そうすることで、フロントエンドへの影響を最小限に抑えられる。

#### Acceptance Criteria

1. THE 推薦システム SHALL レスポンス形式（best_recommend, recommendations）を維持する
2. THE 推薦システム SHALL best_recommendの構造（brand, brand_description, expected_experience, match_score）を維持する
3. THE 推薦システム SHALL recommendationsの構造（brand, brand_description, expected_experience, category, match_score）を維持する
4. THE 推薦システム SHALL categoryフィールドの型（文字列）を維持する
5. THE 推薦システム SHALL 既存のエラーハンドリング（error.code, error.message）を維持する

### Requirement 7: ドキュメントの更新

**User Story:** 開発者として、カテゴリー動的生成に関するドキュメントを更新したい。そうすることで、他の開発者が変更内容を理解できる。

#### Acceptance Criteria

1. THE 推薦システム SHALL README.mdにカテゴリー動的生成の説明を追加する
2. THE 推薦システム SHALL カテゴリー名の例を記載する
3. THE 推薦システム SHALL カテゴリー名の文字数制限（1-10文字）を記載する
4. THE 推薦システム SHALL best_recommendにカテゴリーが含まれないことを記載する
5. THE 推薦システム SHALL レスポンス例を更新する
