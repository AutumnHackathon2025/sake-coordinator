terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.18.0"
    }
  }

  backend "s3" {
    bucket       = "sake-recommendation-prod-terraform-state"
    key          = "terraform.tfstate"
    region       = "ap-northeast-1"
    use_lockfile = true
    encrypt      = true
  }
}

# AWS Provider設定
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

# 現在のAWSアカウント情報を取得
data "aws_caller_identity" "current" {}

# 共通タグの定義
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Service     = "sake-recommendation"
    Owner       = var.owner
    CostCenter  = var.cost_center
  }
}

# ネットワーキングモジュール
module "networking" {
  source = "./modules/networking"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr

  availability_zones = var.availability_zones
  public_subnets     = var.public_subnets
  private_subnets    = var.private_subnets

  tags = local.common_tags
}

# セキュリティモジュール
module "security" {
  source = "./modules/security"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.networking.vpc_id

  tags = local.common_tags

  # ネットワーキングモジュールに依存
  depends_on = [module.networking]
}

# コンピューティングモジュール
module "compute" {
  source = "./modules/compute"

  project_name = var.project_name
  environment  = var.environment

  vpc_id             = module.networking.vpc_id
  public_subnet_ids  = module.networking.public_subnet_ids
  private_subnet_ids = module.networking.private_subnet_ids

  alb_security_group_id = module.security.alb_security_group_id
  ecs_security_group_id = module.security.ecs_security_group_id

  ecs_task_execution_role_arn = module.security.ecs_task_execution_role_arn
  ecs_task_role_arn           = module.security.ecs_task_role_arn

  ssl_certificate_arn = var.ssl_certificate_arn

  tags = local.common_tags

  # ネットワーキングとセキュリティモジュールに依存
  depends_on = [module.networking, module.security]
}

# 認証モジュール
module "auth" {
  source = "./modules/auth"

  project_name = var.project_name
  environment  = var.environment

  cognito_authenticated_role_arn   = module.security.cognito_authenticated_role_arn
  cognito_unauthenticated_role_arn = module.security.cognito_unauthenticated_role_arn

  tags = local.common_tags

  # セキュリティモジュールに依存
  depends_on = [module.security]
}

# ストレージモジュール
module "storage" {
  source = "./modules/storage"

  project_name = var.project_name
  environment  = var.environment

  s3_access_policy_arn = module.security.s3_access_policy_arn

  tags = local.common_tags

  # セキュリティモジュールに依存
  depends_on = [module.security]
}

# AgentCoreモジュール
module "agentcore" {
  source = "./modules/agentcore"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  owner        = var.owner
  cost_center  = var.cost_center

  # 既存ECSタスクロールにAgentCore呼び出し権限を追加
  existing_ecs_task_role_name = module.security.ecs_task_role_name

  # 監視設定
  sns_topic_arn                     = var.sns_topic_arn
  agentcore_error_threshold         = var.agentcore_error_threshold
  agentcore_response_time_threshold = var.agentcore_response_time_threshold
  cloudwatch_log_retention_days     = var.cloudwatch_log_retention_days

  # AgentCore Runtime設定
  agentcore_log_level    = var.agentcore_log_level
  agentcore_network_mode = var.agentcore_network_mode
  agentcore_protocol     = var.agentcore_protocol

  # ECR設定
  ecr_image_tag_mutability = var.ecr_image_tag_mutability
  ecr_lifecycle_keep_count = var.ecr_lifecycle_keep_count

  # Bedrock設定
  bedrock_model_arns = var.bedrock_model_arns

  # CloudWatchログ暗号化を無効化（KMSキーの問題を回避）
  enable_cloudwatch_log_encryption = false

  # セキュリティモジュールに依存（ECSタスクロールが必要）
  depends_on = [module.security]
}

# 監視モジュール
module "monitoring" {
  source = "./modules/monitoring"

  project_name = var.project_name
  environment  = var.environment

  vpc_id           = module.networking.vpc_id
  ecs_cluster_name = module.compute.ecs_cluster_name
  ecs_service_name = module.compute.ecs_service_name
  alb_arn_suffix   = module.compute.alb_arn_suffix

  dynamodb_table_name = module.storage.dynamodb_table_name
  s3_bucket_name      = module.storage.s3_bucket_name

  tags = local.common_tags

  # 全てのモジュールに依存（監視は最後に設定）
  depends_on = [
    module.networking,
    module.security,
    module.compute,
    module.auth,
    module.storage,
    module.agentcore
  ]
}