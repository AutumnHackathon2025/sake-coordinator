# セキュリティモジュール出力値

# セキュリティグループ出力
output "alb_security_group_id" {
  description = "ALB セキュリティグループ ID"
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "ECS セキュリティグループ ID"
  value       = aws_security_group.ecs.id
}

output "vpc_endpoint_security_group_id" {
  description = "VPCエンドポイント セキュリティグループ ID"
  value       = aws_security_group.vpc_endpoint.id
}

# IAMロール出力
output "ecs_task_execution_role_arn" {
  description = "ECS タスク実行ロール ARN"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ECS タスクロール ARN"
  value       = aws_iam_role.ecs_task.arn
}

output "cognito_authenticated_role_arn" {
  description = "Cognito authenticated user role ARN"
  value       = aws_iam_role.cognito_authenticated.arn
}

output "cognito_unauthenticated_role_arn" {
  description = "Cognito 未認証ユーザーロール ARN"
  value       = aws_iam_role.cognito_unauthenticated.arn
}

# IAMポリシー出力
output "s3_access_policy_arn" {
  description = "S3 アクセスポリシー ARN"
  value       = aws_iam_policy.s3_access.arn
}

output "dynamodb_access_policy_arn" {
  description = "DynamoDB アクセスポリシー ARN"
  value       = aws_iam_policy.dynamodb_access.arn
}

output "cognito_access_policy_arn" {
  description = "Cognito アクセスポリシー ARN"
  value       = aws_iam_policy.cognito_access.arn
}