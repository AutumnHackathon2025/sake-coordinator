# 認証モジュール出力値

output "user_pool_id" {
  description = "Cognito ユーザープール ID"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "Cognito ユーザープール ARN"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_client_id" {
  description = "Cognito ユーザープールクライアント ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "user_pool_domain" {
  description = "Cognito ユーザープールドメイン"
  value       = aws_cognito_user_pool_domain.main.domain
}

output "user_pool_endpoint" {
  description = "Cognito ユーザープールエンドポイント"
  value       = aws_cognito_user_pool.main.endpoint
}

output "identity_pool_id" {
  description = "Cognito アイデンティティプール ID"
  value       = aws_cognito_identity_pool.main.id
}

output "user_pool_client_secret" {
  description = "Cognito user pool client secret (empty for SPA)"
  value       = ""
  sensitive   = true
}