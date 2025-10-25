# Terraform状態管理用リソース
# 要件7.4: 状態ロック機能付きのリモート状態バックエンドを設定

# S3バケット（Terraform状態ファイル保存用）
resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.project_name}-${var.environment}-terraform-state"

  tags = merge(local.common_tags, {
    Name        = "${var.project_name}-${var.environment}-terraform-state"
    Type        = "TerraformState"
    Description = "Terraform state file storage S3 bucket with lockfile support"
  })

  lifecycle {
    prevent_destroy = true
  }
}

# S3バケットのバージョニング設定
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3バケットの暗号化設定
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3バケットのパブリックアクセスブロック
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}