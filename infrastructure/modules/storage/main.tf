# ストレージモジュール - S3、DynamoDB設定
# 要件4.1, 4.2, 5.1, 5.2: S3バケット、DynamoDBテーブル作成

# 日本酒画像保存用S3バケット
# 要件4.1: バージョニング有効化されたS3バケットを作成すること
# 要件4.2: 安全なアクセス用のS3バケットポリシーを設定すること
resource "aws_s3_bucket" "sake_images" {
  bucket = "${var.project_name}-${var.environment}-sake-images"

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-sake-images"
    Purpose     = "SakeImageStorage"
    Environment = var.environment
  })
}

# S3バケットバージョニング設定
# 要件4.1: バージョニングの有効化
resource "aws_s3_bucket_versioning" "sake_images" {
  bucket = aws_s3_bucket.sake_images.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3バケット暗号化設定
# 要件4.1: サーバーサイド暗号化（AES-256）の設定
resource "aws_s3_bucket_server_side_encryption_configuration" "sake_images" {
  bucket = aws_s3_bucket.sake_images.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}
# S3バケットパブリックアクセスブロック設定
# 要件4.2: パブリックアクセスブロックの設定
resource "aws_s3_bucket_public_access_block" "sake_images" {
  bucket = aws_s3_bucket.sake_images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3バケットCORS設定
# 要件4.3: Webアプリケーションアクセス用のCORS設定を有効にすること
resource "aws_s3_bucket_cors_configuration" "sake_images" {
  bucket = aws_s3_bucket.sake_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"] # 本番環境では具体的なドメインを指定
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3バケット通知設定（将来の拡張用）
resource "aws_s3_bucket_notification" "sake_images" {
  bucket = aws_s3_bucket.sake_images.id
  # 現在は通知設定なし、将来的にLambda関数との連携で使用予定
}

# S3バケットライフサイクル設定
# 要件4.4: コスト最適化のためのライフサイクルポリシーを設定すること
resource "aws_s3_bucket_lifecycle_configuration" "sake_images" {
  bucket = aws_s3_bucket.sake_images.id

  rule {
    id     = "sake_images_lifecycle"
    status = "Enabled"

    # 現在のバージョンのライフサイクル
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    # 古いバージョンのライフサイクル
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    # 古いバージョンの削除（2年後）
    noncurrent_version_expiration {
      noncurrent_days = 730
    }

    # 不完全なマルチパートアップロードの削除
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# DynamoDBテーブル - 飲酒記録用
# 要件5.1: 飲酒記録用のDynamoDBテーブルを作成すること
# 要件5.2: 適切なパーティションキーとソートキーでDynamoDBを設定すること
resource "aws_dynamodb_table" "drinking_records" {
  name         = "${var.project_name}-${var.environment}-drinking-records"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "recordId"

  # パーティションキー: userId (String)
  attribute {
    name = "userId"
    type = "S"
  }

  # ソートキー: recordId (String)
  attribute {
    name = "recordId"
    type = "S"
  }

  # GSI用の属性定義
  attribute {
    name = "sake_name"
    type = "S"
  }

  attribute {
    name = "rating"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  # 保存時暗号化の有効化
  server_side_encryption {
    enabled = true
  }

  # GSI1: 銘柄検索用インデックス
  # 要件5.4: クエリ最適化のためのGlobal Secondary Indexを作成すること
  global_secondary_index {
    name            = "sake_name-created_at-index"
    hash_key        = "sake_name"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  # GSI2: 評価検索用インデックス
  # 要件5.4: クエリ最適化のためのGlobal Secondary Indexを作成すること
  global_secondary_index {
    name            = "rating-created_at-index"
    hash_key        = "rating"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  # ポイントインタイム復旧の有効化（35日間）
  # 要件5.3: データ保護のためのポイントインタイム復旧を有効にすること
  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-drinking-records"
    Purpose     = "DrinkingRecordsStorage"
    Environment = var.environment
  })
}

# DynamoDBバックアップボルト（AWS Backup用）
# 要件5.3: オンデマンドバックアップの設定
resource "aws_backup_vault" "dynamodb_backup_vault" {
  name        = "${var.project_name}-${var.environment}-dynamodb-backup-vault"
  kms_key_arn = aws_kms_key.backup_key.arn

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-dynamodb-backup-vault"
    Purpose     = "DynamoDBBackup"
    Environment = var.environment
  })
}

# バックアップ用KMSキー
resource "aws_kms_key" "backup_key" {
  description             = "KMS key for DynamoDB backup encryption"
  deletion_window_in_days = 7

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-backup-key"
    Purpose     = "BackupEncryption"
    Environment = var.environment
  })
}

# KMSキーエイリアス
resource "aws_kms_alias" "backup_key_alias" {
  name          = "alias/${var.project_name}-${var.environment}-backup-key"
  target_key_id = aws_kms_key.backup_key.key_id
}

# バックアップ計画
resource "aws_backup_plan" "dynamodb_backup_plan" {
  name = "${var.project_name}-${var.environment}-dynamodb-backup-plan"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.dynamodb_backup_vault.name
    schedule          = "cron(0 2 * * ? *)" # 毎日午前2時

    lifecycle {
      cold_storage_after = 30
      delete_after       = 365
    }

    recovery_point_tags = merge(var.tags, {
      BackupType = "Daily"
    })
  }

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-dynamodb-backup-plan"
    Purpose     = "DynamoDBBackup"
    Environment = var.environment
  })
}

# バックアップ選択（DynamoDBテーブル）
resource "aws_backup_selection" "dynamodb_backup_selection" {
  iam_role_arn = aws_iam_role.backup_role.arn
  name         = "${var.project_name}-${var.environment}-dynamodb-backup-selection"
  plan_id      = aws_backup_plan.dynamodb_backup_plan.id

  resources = [
    aws_dynamodb_table.drinking_records.arn
  ]

  condition {
    string_equals {
      key   = "aws:ResourceTag/Environment"
      value = var.environment
    }
  }
}

# バックアップ用IAMロール
resource "aws_iam_role" "backup_role" {
  name = "${var.project_name}-${var.environment}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-backup-role"
    Purpose     = "BackupService"
    Environment = var.environment
  })
}

# バックアップ用IAMポリシーアタッチメント
resource "aws_iam_role_policy_attachment" "backup_policy" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "restore_policy" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}