# Amazon Bedrock モデル設定ガイド

## 概要

このドキュメントでは、日本酒推薦エージェントで使用できるAmazon Bedrockモデルの設定方法を説明します。

## サポートされているモデル

### Claude系モデル（推奨）

Claude系モデルは直接モデルIDで呼び出すことができます。

```bash
# Claude 3.5 Sonnet v1（推奨・デフォルト）
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0

# Claude 3 Sonnet
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

# Claude 3 Haiku
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

### Nova系モデル

Nova系モデルは**inference profile ARN**を使用する必要があります。

#### リージョン別 inference profile ARN

| リージョン | Nova Lite | Nova Pro | Nova Micro |
|-----------|-----------|----------|------------|
| **us-east-1** | `us.amazon.nova-lite-v1:0` | `us.amazon.nova-pro-v1:0` | `us.amazon.nova-micro-v1:0` |
| **ap-northeast-1** | `ap-northeast-1.amazon.nova-lite-v1:0` | `ap-northeast-1.amazon.nova-pro-v1:0` | `ap-northeast-1.amazon.nova-micro-v1:0` |
| **eu-west-1** | `eu.amazon.nova-lite-v1:0` | `eu.amazon.nova-pro-v1:0` | `eu.amazon.nova-micro-v1:0` |

#### 使用例（ap-northeast-1）

```bash
# Nova Lite
BEDROCK_MODEL_ID=ap-northeast-1.amazon.nova-lite-v1:0
BEDROCK_REGION=ap-northeast-1

# Nova Pro
BEDROCK_MODEL_ID=ap-northeast-1.amazon.nova-pro-v1:0
BEDROCK_REGION=ap-northeast-1
```

## 設定方法

### 1. 環境変数ファイルの作成

```bash
cp .env.example .env
```

### 2. モデルIDとリージョンの設定

`.env` ファイルを編集：

```bash
# Claude 3.5 Sonnet を使用する場合（推奨）
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
BEDROCK_REGION=ap-northeast-1

# または Nova Lite を使用する場合
BEDROCK_MODEL_ID=ap-northeast-1.amazon.nova-lite-v1:0
BEDROCK_REGION=ap-northeast-1
```

### 3. その他のBedrock設定

```bash
BEDROCK_MAX_TOKENS=2000        # 最大トークン数
BEDROCK_TEMPERATURE=0.7        # 温度パラメータ（0.0-1.0）
BEDROCK_TIMEOUT=15             # タイムアウト（秒）
```

## よくあるエラーと対処法

### エラー1: AccessDeniedException

```
User is not authorized to perform: bedrock:InvokeModel
```

**原因**: AWS Service Control Policy (SCP) でモデルへのアクセスが拒否されています。

**対処法**: 
- 組織のSCPで許可されているモデルを確認してください
- IAMロールに適切な権限があることを確認してください

### エラー2: ValidationException (inference profile)

```
Invocation of model ID amazon.nova-pro-v1:0 with on-demand throughput isn't supported.
Retry your request with the ID or ARN of an inference profile that contains this model.
```

**原因**: Nova系モデルを直接モデルIDで呼び出そうとしています。

**対処法**: inference profile ARNを使用してください。

```bash
# ❌ 間違い
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0

# ✅ 正しい（ap-northeast-1の場合）
BEDROCK_MODEL_ID=ap-northeast-1.amazon.nova-pro-v1:0
```

### エラー3: ValidationException (content format)

```
Malformed input request: #/messages/0/content: expected type: JSONArray, found: String
```

**原因**: モデルに応じた正しいリクエストフォーマットが使用されていません。

**対処法**: 
- 最新のコードを使用していることを確認してください
- BedrockServiceは自動的にモデルに応じたフォーマットを使用します

## モデル選択のガイドライン

### Claude 3.5 Sonnet（推奨）

- **用途**: 高品質な推薦と分析
- **特徴**: 最も高性能、日本語対応が優れている
- **コスト**: 中〜高
- **推奨シーン**: 本番環境、高品質な推薦が必要な場合

### Nova Lite

- **用途**: コスト効率重視
- **特徴**: 高速、低コスト
- **コスト**: 低
- **推奨シーン**: 開発環境、テスト、コスト削減が必要な場合

### Nova Pro

- **用途**: バランス型
- **特徴**: 性能とコストのバランスが良い
- **コスト**: 中
- **推奨シーン**: 本番環境、コストと品質のバランスが必要な場合

## リージョン選択のガイドライン

### ap-northeast-1（東京）

- **推奨**: 日本国内のユーザー向け
- **レイテンシ**: 最小
- **データレジデンシー**: 日本国内

### us-east-1（バージニア北部）

- **推奨**: グローバルユーザー向け
- **特徴**: 最も多くのモデルが利用可能
- **レイテンシ**: 日本からは高め

## 参考リンク

- [Amazon Bedrock モデル一覧](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)
- [Inference Profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html)
- [Claude モデル](https://docs.anthropic.com/claude/docs/models-overview)
- [Nova モデル](https://aws.amazon.com/bedrock/nova/)
