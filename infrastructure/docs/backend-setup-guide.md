# Terraform状態管理セットアップガイド（v1.10+ lockfile方式）

## 概要

このガイドでは、Terraformの状態管理をローカルファイルからS3リモートバックエンドに移行する手順を説明します。Terraform v1.10以降の新しいlockfile機能を使用するため、DynamoDBテーブルは不要です。

## 前提条件

- AWS CLIが設定済みであること
- 適切なAWS権限を持つIAMユーザー/ロールでアクセスできること
- Terraformがインストール済みであること

## セットアップ手順

### 1. 状態管理リソースの作成

まず、状態管理用のS3バケットを作成します。Terraform v1.10以降ではDynamoDBテーブルは不要です。

```bash
# infrastructureディレクトリに移動
cd infrastructure

# backend.tfを一時的に無効化
mv backend.tf backend.tf.tmp

# 初期化
terraform init

# S3バケットのみを作成（DynamoDBテーブルは不要）
terraform plan -target=aws_s3_bucket.terraform_state
terraform apply -target=aws_s3_bucket.terraform_state

# backend.tfを復元
mv backend.tf.tmp backend.tf
```

### 2. バックエンド設定ファイルの作成

プロジェクト設定に応じて`backend-config.hcl`ファイルを作成します。

```hcl
# backend-config.hcl
bucket       = "sake-recommendation-prod-terraform-state"
key          = "terraform.tfstate"
region       = "ap-northeast-1"
use_lockfile = true
encrypt      = true
```

### 3. main.tfのバックエンド設定を有効化

`main.tf`ファイル内のバックエンド設定のコメントアウトを解除し、実際の値に置き換えます。

```hcl
terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.18.0"
    }
  }

  # S3バックエンド設定（状態ファイル保存用）
  # Terraform v1.10以降の新しいlockfile機能を使用
  backend "s3" {
    bucket       = "sake-recommendation-prod-terraform-state"
    key          = "terraform.tfstate"
    region       = "ap-northeast-1"
    use_lockfile = true
    encrypt      = true
  }
}
```

### 4. 状態の移行

ローカル状態をリモートバックエンドに移行します。

```bash
# バックエンド設定で初期化（状態を移行）
terraform init -backend-config=backend-config.hcl -migrate-state

# 移行の確認
terraform state list
```

### 5. 検証

セットアップが正常に完了したことを確認します。

```bash
# 状態ファイルの確認
terraform state list

# S3バケットの確認
aws s3 ls s3://sake-recommendation-prod-terraform-state/

# lockfileの確認（terraform操作中のみ存在）
aws s3 ls s3://sake-recommendation-prod-terraform-state/ | grep tflock
```

## 自動セットアップスクリプト

手動セットアップが面倒な場合は、提供されているスクリプトを使用できます。

```bash
# スクリプトに実行権限を付与
chmod +x scripts/setup-backend.sh

# スクリプトを実行
./scripts/setup-backend.sh [project_name] [environment] [aws_region]

# 例：
./scripts/setup-backend.sh sake-recommendation prod ap-northeast-1
```

## 注意事項

### セキュリティ

- `backend-config.hcl`ファイルは機密情報を含む可能性があるため、`.gitignore`に追加してください
- S3バケットとDynamoDBテーブルには`prevent_destroy = true`が設定されています
- 状態ファイルは暗号化されて保存されます

### タグ設定

- S3バケットのタグには日本語文字を使用しないでください（AWS APIエラーの原因となります）
- タグの値は英数字、ハイフン、アンダースコアのみを使用することを推奨します

### バックアップ

- S3バケットはバージョニングが有効になっています
- DynamoDBテーブルはポイントインタイム復旧が有効になっています
- 重要な変更前には手動バックアップを推奨します

### チーム開発

チーム開発時は、全メンバーが同じ`backend-config.hcl`設定を使用する必要があります。

```bash
# チームメンバーの初期化
terraform init -backend-config=backend-config.hcl
```

## トラブルシューティング

### 状態ロックエラー

```bash
# ロックが残っている場合の強制解除（注意して使用）
terraform force-unlock [LOCK_ID]
```

### 状態ファイルの破損

```bash
# 状態ファイルのバックアップから復元
aws s3 cp s3://sake-recommendation-prod-terraform-state/terraform.tfstate.backup ./terraform.tfstate
terraform state push terraform.tfstate
```

### リソースがtainted状態になった場合

```bash
# taintedマークを解除
terraform untaint <resource_name>

# 例：S3バケットのtaintedマークを解除
terraform untaint aws_s3_bucket.terraform_state
```

### バックエンド設定の変更

```bash
# 新しいバックエンド設定で再初期化
terraform init -backend-config=new-backend-config.hcl -migrate-state
```

## 関連ファイル

- `backend.tf`: 状態管理リソースの定義
- `scripts/setup-backend.sh`: 自動セットアップスクリプト
- `backend-config.hcl`: バックエンド設定ファイル（作成後）
- `.gitignore`: 機密ファイルの除外設定

## 参考資料

- [Terraform Backend Configuration](https://www.terraform.io/docs/language/settings/backends/s3.html)
- [AWS S3 Backend](https://www.terraform.io/docs/language/settings/backends/s3.html)
- [State Locking](https://www.terraform.io/docs/language/state/locking.html)
