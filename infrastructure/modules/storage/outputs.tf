# ストレージモジュール出力値

# S3バケット関連出力
output "s3_bucket_name" {
  description = "S3 バケット名"
  value       = aws_s3_bucket.sake_images.id
}

output "s3_bucket_arn" {
  description = "S3 バケット ARN"
  value       = aws_s3_bucket.sake_images.arn
}

output "s3_bucket_domain_name" {
  description = "S3 バケットドメイン名"
  value       = aws_s3_bucket.sake_images.bucket_domain_name
}

output "s3_bucket_regional_domain_name" {
  description = "S3 バケットリージョナルドメイン名"
  value       = aws_s3_bucket.sake_images.bucket_regional_domain_name
}

# DynamoDB関連出力
output "dynamodb_table_name" {
  description = "DynamoDB テーブル名"
  value       = aws_dynamodb_table.drinking_records.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB テーブル ARN"
  value       = aws_dynamodb_table.drinking_records.arn
}

output "dynamodb_gsi_names" {
  description = "DynamoDB Global Secondary Index 名リスト"
  value = [
    "sake_name-created_at-index",
    "rating-created_at-index"
  ]
}

output "dynamodb_table_id" {
  description = "DynamoDB テーブル ID"
  value       = aws_dynamodb_table.drinking_records.id
}

# バックアップ関連出力
output "backup_vault_name" {
  description = "バックアップボルト名"
  value       = aws_backup_vault.dynamodb_backup_vault.name
}

output "backup_vault_arn" {
  description = "バックアップボルト ARN"
  value       = aws_backup_vault.dynamodb_backup_vault.arn
}

output "backup_plan_id" {
  description = "バックアップ計画 ID"
  value       = aws_backup_plan.dynamodb_backup_plan.id
}