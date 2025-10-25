# 日本酒推薦サービス - Terraform出力値定義
# アプリケーション設定に必要な重要なリソース識別子

# ネットワーキング出力
output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "vpc_cidr_block" {
  description = "VPC CIDR ブロック"
  value       = module.networking.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "パブリックサブネット ID リスト"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "プライベートサブネット ID リスト"
  value       = module.networking.private_subnet_ids
}

output "internet_gateway_id" {
  description = "インターネットゲートウェイ ID"
  value       = module.networking.internet_gateway_id
}

output "nat_gateway_ids" {
  description = "NAT ゲートウェイ ID リスト"
  value       = module.networking.nat_gateway_ids
}

# セキュリティ出力
output "alb_security_group_id" {
  description = "ALB セキュリティグループ ID"
  value       = module.security.alb_security_group_id
}

output "ecs_security_group_id" {
  description = "ECS セキュリティグループ ID"
  value       = module.security.ecs_security_group_id
}

output "ecs_task_execution_role_arn" {
  description = "ECS タスク実行ロール ARN"
  value       = module.security.ecs_task_execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ECS タスクロール ARN"
  value       = module.security.ecs_task_role_arn
}

# コンピューティング出力
output "ecr_repository_url" {
  description = "ECR リポジトリ URL"
  value       = module.compute.ecr_repository_url
}

output "ecr_repository_name" {
  description = "ECR リポジトリ名"
  value       = module.compute.ecr_repository_name
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS 名"
  value       = module.compute.alb_dns_name
}

output "alb_zone_id" {
  description = "Application Load Balancer Zone ID"
  value       = module.compute.alb_zone_id
}

output "alb_arn" {
  description = "Application Load Balancer ARN"
  value       = module.compute.alb_arn
}

output "target_group_arn" {
  description = "ターゲットグループ ARN"
  value       = module.compute.target_group_arn
}

output "ecs_cluster_name" {
  description = "ECS クラスター名"
  value       = module.compute.ecs_cluster_name
}

output "ecs_cluster_arn" {
  description = "ECS クラスター ARN"
  value       = module.compute.ecs_cluster_arn
}

output "ecs_service_name" {
  description = "ECS サービス名"
  value       = module.compute.ecs_service_name
}

output "ecs_service_arn" {
  description = "ECS サービス ARN"
  value       = module.compute.ecs_service_arn
}

# 認証出力
output "cognito_user_pool_id" {
  description = "Cognito ユーザープール ID"
  value       = module.auth.user_pool_id
  sensitive   = false
}

output "cognito_user_pool_arn" {
  description = "Cognito ユーザープール ARN"
  value       = module.auth.user_pool_arn
}

output "cognito_user_pool_client_id" {
  description = "Cognito ユーザープールクライアント ID"
  value       = module.auth.user_pool_client_id
  sensitive   = false
}

output "cognito_user_pool_domain" {
  description = "Cognito ユーザープールドメイン"
  value       = module.auth.user_pool_domain
}

output "cognito_identity_pool_id" {
  description = "Cognito アイデンティティプール ID"
  value       = module.auth.identity_pool_id
  sensitive   = false
}

# ストレージ出力
output "s3_bucket_name" {
  description = "S3 バケット名"
  value       = module.storage.s3_bucket_name
}

output "s3_bucket_arn" {
  description = "S3 バケット ARN"
  value       = module.storage.s3_bucket_arn
}

output "s3_bucket_domain_name" {
  description = "S3 バケットドメイン名"
  value       = module.storage.s3_bucket_domain_name
}

output "dynamodb_table_name" {
  description = "DynamoDB テーブル名"
  value       = module.storage.dynamodb_table_name
}

output "dynamodb_table_arn" {
  description = "DynamoDB テーブル ARN"
  value       = module.storage.dynamodb_table_arn
}

output "dynamodb_gsi_names" {
  description = "DynamoDB Global Secondary Index 名リスト"
  value       = module.storage.dynamodb_gsi_names
}

# 監視出力
output "cloudwatch_log_group_names" {
  description = "CloudWatch ロググループ名リスト"
  value       = module.monitoring.log_group_names
}

output "sns_topic_arn" {
  description = "SNS トピック ARN"
  value       = module.monitoring.sns_topic_arn
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch ダッシュボード URL"
  value       = module.monitoring.dashboard_url
}

# AgentCore出力
output "agentcore_ecr_repository_url" {
  description = "AgentCore用ECRリポジトリURL"
  value       = module.agentcore.ecr_repository_url
}

output "agentcore_runtime_id" {
  description = "AgentCore Runtime ID"
  value       = module.agentcore.agentcore_runtime_id
  sensitive   = false
}

output "agentcore_runtime_arn" {
  description = "AgentCore Runtime ARN"
  value       = module.agentcore.agentcore_runtime_arn
}

output "agentcore_runtime_name" {
  description = "AgentCore Runtime名"
  value       = module.agentcore.agentcore_runtime_name
}

output "agentcore_invoke_policy_arn" {
  description = "AgentCore呼び出し用IAMポリシーARN"
  value       = module.agentcore.agentcore_invoke_policy_arn
}

output "agentcore_log_group_name" {
  description = "AgentCore用CloudWatchロググループ名"
  value       = module.agentcore.cloudwatch_log_group_name
}

# 環境変数設定用出力（Next.jsアプリケーション用）
output "environment_variables" {
  description = "Next.js アプリケーション用環境変数"
  value = {
    # Cognito設定
    NEXT_PUBLIC_COGNITO_USER_POOL_ID = module.auth.user_pool_id
    NEXT_PUBLIC_COGNITO_CLIENT_ID    = module.auth.user_pool_client_id
    NEXT_PUBLIC_COGNITO_REGION       = var.aws_region

    # サーバーサイド環境変数
    COGNITO_USER_POOL_ID     = module.auth.user_pool_id
    COGNITO_IDENTITY_POOL_ID = module.auth.identity_pool_id
    S3_BUCKET_NAME           = module.storage.s3_bucket_name
    DYNAMODB_TABLE_NAME      = module.storage.dynamodb_table_name
    AWS_REGION               = var.aws_region

    # ECS設定
    ECR_REPOSITORY_URL = module.compute.ecr_repository_url
    ALB_DNS_NAME       = module.compute.alb_dns_name

    # AgentCore設定
    AGENTCORE_RUNTIME_ID  = module.agentcore.agentcore_runtime_id
    AGENTCORE_RUNTIME_ARN = module.agentcore.agentcore_runtime_arn
  }
  sensitive = false
}

# デプロイ情報出力
output "deployment_info" {
  description = "デプロイ関連情報"
  value = {
    project_name    = var.project_name
    environment     = var.environment
    aws_region      = var.aws_region
    vpc_cidr        = var.vpc_cidr
    deployment_time = timestamp()
  }
}

# コスト管理用タグ出力
output "resource_tags" {
  description = "リソースタグ情報"
  value = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Service     = "sake-recommendation"
    Owner       = var.owner
    CostCenter  = var.cost_center
  }
}