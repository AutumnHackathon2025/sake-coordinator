# 日本酒推薦サービス - インフラストラクチャ

## 概要

このディレクトリには、日本酒推薦サービスのAWSインフラをTerraformで管理するためのコードとドキュメントが含まれています。

## アーキテクチャ

- **アプリケーション**: Amazon ECS上のNext.jsフルスタックアプリ
- **認証**: Amazon Cognito（Passkey対応）
- **ストレージ**: Amazon S3（画像ファイル保存）
- **データベース**: Amazon DynamoDB（飲酒記録データ）
- **監視**: Amazon CloudWatch
- **ロードバランサー**: Application Load Balancer

## ディレクトリ構造

```
infrastructure/
├── modules/                    # Terraformモジュール
│   ├── networking/            # VPC、サブネット、ルーティング
│   ├── security/              # セキュリティグループ、IAMロール
│   ├── compute/               # ECS、ALB、ECR
│   ├── auth/                  # Cognito設定
│   ├── storage/               # S3、DynamoDB
│   └── monitoring/            # CloudWatch、SNS
├── docs/                      # ドキュメント
│   ├── environment-variables.md   # 環境変数設定ガイド
│   ├── nextjs-setup-guide.md     # Next.jsアプリケーション設定
│   └── deployment-guide.md       # デプロイ手順書
├── scripts/                   # ユーティリティスクリプト
│   └── generate-env-vars.sh   # 環境変数生成スクリプト
├── templates/                 # テンプレートファイル
│   └── ecs-environment-variables.json  # ECSタスク定義用環境変数
├── main.tf                    # メイン設定
├── variables.tf               # 変数定義
├── outputs.tf                 # 出力値定義
├── terraform.tfvars           # 環境固有値
└── README.md                  # このファイル
```

## クイックスタート

### 1. 前提条件

- [Terraform](https://www.terraform.io/downloads.html) v1.0以上
- [AWS CLI](https://aws.amazon.com/cli/) v2.0以上
- 適切なAWS認証情報の設定

### 2. インフラのデプロイ

```bash
# 1. Terraformの初期化
terraform init

# 2. 変数ファイルの編集
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvarsを編集

# 3. デプロイ計画の確認
terraform plan

# 4. インフラのデプロイ
terraform apply
```

### 3. 環境変数の生成

```bash
# Next.js用の環境変数ファイルを生成
./scripts/generate-env-vars.sh -o ../nextjs/.env.local

# JSON形式で出力（CI/CD用）
./scripts/generate-env-vars.sh -f json -o environment.json
```

### 4. アプリケーションのデプロイ

詳細は [デプロイ手順書](docs/deployment-guide.md) を参照してください。

## 主要なTerraform出力値

| 出力値 | 説明 | 用途 |
|--------|------|------|
| `alb_dns_name` | ALBのDNS名 | アプリケーションアクセス |
| `ecr_repository_url` | ECRリポジトリURL | Dockerイメージプッシュ |
| `cognito_user_pool_id` | CognitoユーザープールID | 認証設定 |
| `cognito_user_pool_client_id` | CognitoクライアントID | 認証設定 |
| `s3_bucket_name` | S3バケット名 | 画像アップロード |
| `dynamodb_table_name` | DynamoDBテーブル名 | データ保存 |
| `environment_variables` | 環境変数一覧 | アプリケーション設定 |

## ドキュメント

- [環境変数設定ガイド](docs/environment-variables.md) - 環境変数の設定方法
- [Next.jsアプリケーション設定ガイド](docs/nextjs-setup-guide.md) - アプリケーションの設定方法
- [デプロイ手順書](docs/deployment-guide.md) - 詳細なデプロイ手順

## 監視とアラート

### CloudWatchダッシュボード

```bash
# ダッシュボードURLを取得
terraform output cloudwatch_dashboard_url
```

### アラート設定

```bash
# SNSトピックにメール通知を設定
aws sns subscribe \
  --topic-arn $(terraform output -raw sns_topic_arn) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## セキュリティ

### IAMロール

- **ECSタスク実行ロール**: ECR、CloudWatchログへの最小権限
- **ECSタスクロール**: S3、DynamoDB、Cognitoへの最小権限
- **Cognito認証済みユーザーロール**: リソースアクセス権限

### セキュリティグループ

- **ALB**: HTTP/HTTPS（80/443）のみ許可
- **ECS**: ALBからのアクセスのみ許可
- **VPCエンドポイント**: ECSからのHTTPS通信のみ許可

### データ暗号化

- **S3**: サーバーサイド暗号化（AES-256）
- **DynamoDB**: 保存時暗号化
- **CloudWatch**: ログ暗号化
- **ALB**: HTTPS強制リダイレクト

## コスト最適化

### リソース最適化設定

- **ECS**: Fargateオートスケーリング（CPU使用率ベース）
- **S3**: ライフサイクルポリシー（90日後IA、365日後Glacier）
- **CloudWatch**: ログ保持期間30日
- **DynamoDB**: オンデマンド課金

### コスト監視

```bash
# ECSサービスのメトリクス確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=$(terraform output -raw ecs_service_name) \
  --start-time $(date -d '24 hours ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average
```

## トラブルシューティング

### よくある問題

1. **Terraformエラー**:
   ```bash
   # 状態ファイルの確認
   terraform show
   
   # リソースの再インポート
   terraform import aws_instance.example i-1234567890abcdef0
   ```

2. **ECSタスク起動失敗**:
   ```bash
   # サービスイベントの確認
   aws ecs describe-services \
     --cluster $(terraform output -raw ecs_cluster_name) \
     --services $(terraform output -raw ecs_service_name)
   ```

3. **ALBヘルスチェック失敗**:
   ```bash
   # ターゲットグループの状態確認
   aws elbv2 describe-target-health \
     --target-group-arn $(terraform output -raw target_group_arn)
   ```

### ログ確認

```bash
# アプリケーションログ
aws logs tail /ecs/sake-recommendation-nextjs --follow

# ALBアクセスログ
aws logs tail /aws/alb/sake-recommendation --follow

# VPCフローログ
aws logs tail /aws/vpc/flowlogs --follow
```

## バックアップとリストア

### DynamoDBバックアップ

- **ポイントインタイム復旧**: 35日間有効
- **オンデマンドバックアップ**: 手動作成可能

```bash
# 手動バックアップの作成
aws dynamodb create-backup \
  --table-name $(terraform output -raw dynamodb_table_name) \
  --backup-name "manual-backup-$(date +%Y%m%d-%H%M%S)"
```

### S3バックアップ

- **バージョニング**: 有効
- **ライフサイクルポリシー**: 自動アーカイブ

## 災害復旧

### 復旧手順

1. **インフラの再構築**:
   ```bash
   terraform apply
   ```

2. **データの復旧**:
   ```bash
   # DynamoDBテーブルの復旧
   aws dynamodb restore-table-from-backup \
     --target-table-name $(terraform output -raw dynamodb_table_name) \
     --backup-arn <backup-arn>
   ```

3. **アプリケーションの再デプロイ**:
   ```bash
   # ECRイメージのプッシュとECSサービス更新
   # 詳細はデプロイ手順書を参照
   ```

## 開発・運用チーム向け情報

### 環境変数の更新

```bash
# 環境変数ファイルの再生成
./scripts/generate-env-vars.sh -o ../nextjs/.env.local

# ECSサービスの再起動（環境変数更新後）
aws ecs update-service \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --service $(terraform output -raw ecs_service_name) \
  --force-new-deployment
```

### スケーリング設定の変更

```bash
# 最小/最大タスク数の変更
# variables.tfのmin_capacity、max_capacityを編集後
terraform apply
```

### 新しいリソースの追加

1. 適切なモジュールディレクトリに追加
2. `main.tf`でモジュールを呼び出し
3. 必要に応じて`outputs.tf`に出力値を追加
4. `terraform plan`で確認後、`terraform apply`

## サポート

### 緊急時連絡先

- **インフラ担当**: [連絡先情報]
- **アプリケーション担当**: [連絡先情報]
- **AWS サポート**: [サポートケース作成方法]

### 参考資料

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Amazon ECS Developer Guide](https://docs.aws.amazon.com/ecs/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

