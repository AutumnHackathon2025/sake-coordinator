# 日本酒推薦サービス - Terraform変数定義
# AWS Provider 6.18.0対応の変数設定

# プロジェクト基本設定
variable "project_name" {
  description = "プロジェクト名"
  type        = string
  default     = "sake-recommendation"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "プロジェクト名は小文字、数字、ハイフンのみ使用可能です。"
  }
}

variable "environment" {
  description = "環境名"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["prod"], var.environment)
    error_message = "環境名はprodのみサポートされています。"
  }
}

variable "owner" {
  description = "プロジェクトオーナー"
  type        = string
  default     = "devops-team"
}

variable "cost_center" {
  description = "コストセンター"
  type        = string
  default     = "engineering"
}

# AWS設定
variable "aws_region" {
  description = "AWSリージョン"
  type        = string
  default     = "ap-northeast-1"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.aws_region))
    error_message = "有効なAWSリージョン名を指定してください。"
  }
}

# Terraform状態管理設定
variable "terraform_state_bucket" {
  description = "Terraform状態ファイル保存用S3バケット名"
  type        = string
  default     = "sake-recommendation-terraform-state"
}

variable "terraform_lock_table" {
  description = "Terraform状態ロック用DynamoDBテーブル名"
  type        = string
  default     = "sake-recommendation-terraform-lock"
}

# ネットワーク設定
variable "vpc_cidr" {
  description = "VPC CIDR ブロック"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "有効なCIDRブロックを指定してください。"
  }
}

variable "availability_zones" {
  description = "Availability zones to use"
  type        = list(string)
  default     = ["ap-northeast-1a", "ap-northeast-1c"]

  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least 2 availability zones must be specified."
  }
}

variable "public_subnets" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]

  validation {
    condition     = length(var.public_subnets) >= 2
    error_message = "At least 2 public subnets must be specified."
  }
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]

  validation {
    condition     = length(var.private_subnets) >= 2
    error_message = "At least 2 private subnets must be specified."
  }
}

# ECS設定
variable "ecs_task_cpu" {
  description = "ECS task CPU configuration"
  type        = number
  default     = 512

  validation {
    condition     = contains([256, 512, 1024, 2048, 4096], var.ecs_task_cpu)
    error_message = "ECSタスクCPUは256, 512, 1024, 2048, 4096のいずれかを指定してください。"
  }
}

variable "ecs_task_memory" {
  description = "ECS task memory configuration (MB)"
  type        = number
  default     = 1024

  validation {
    condition     = var.ecs_task_memory >= 512 && var.ecs_task_memory <= 30720
    error_message = "ECSタスクメモリは512MB以上30720MB以下で指定してください。"
  }
}

variable "ecs_desired_count" {
  description = "ECS service desired task count"
  type        = number
  default     = 2

  validation {
    condition     = var.ecs_desired_count >= 1 && var.ecs_desired_count <= 10
    error_message = "ECSタスク数は1以上10以下で指定してください。"
  }
}

variable "ecs_max_capacity" {
  description = "ECS auto scaling maximum task count"
  type        = number
  default     = 10

  validation {
    condition     = var.ecs_max_capacity >= 1 && var.ecs_max_capacity <= 100
    error_message = "最大タスク数は1以上100以下で指定してください。"
  }
}

variable "ecs_min_capacity" {
  description = "ECS auto scaling minimum task count"
  type        = number
  default     = 2

  validation {
    condition     = var.ecs_min_capacity >= 1 && var.ecs_min_capacity <= 10
    error_message = "最小タスク数は1以上10以下で指定してください。"
  }
}

# Cognito設定
variable "cognito_password_policy" {
  description = "Cognitoパスワードポリシー設定"
  type = object({
    minimum_length    = number
    require_lowercase = bool
    require_numbers   = bool
    require_symbols   = bool
    require_uppercase = bool
  })
  default = {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }
}

# S3設定
variable "s3_lifecycle_ia_days" {
  description = "Days to transition S3 objects to IA class"
  type        = number
  default     = 90

  validation {
    condition     = var.s3_lifecycle_ia_days >= 30
    error_message = "IAクラス移行は30日以上で設定してください。"
  }
}

variable "s3_lifecycle_glacier_days" {
  description = "Days to transition S3 objects to Glacier class"
  type        = number
  default     = 365

  validation {
    condition     = var.s3_lifecycle_glacier_days >= 90
    error_message = "Glacier移行日数は90日以上で設定してください。"
  }
}

# DynamoDB設定
variable "dynamodb_point_in_time_recovery" {
  description = "Enable DynamoDB point-in-time recovery"
  type        = bool
  default     = true
}

# CloudWatch設定
variable "cloudwatch_log_retention_days" {
  description = "CloudWatch log retention period (days)"
  type        = number
  default     = 30

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.cloudwatch_log_retention_days)
    error_message = "CloudWatchログ保持期間は有効な値を指定してください。"
  }
}

# アラート設定
variable "cpu_alarm_threshold" {
  description = "CPU utilization alarm threshold (%)"
  type        = number
  default     = 80

  validation {
    condition     = var.cpu_alarm_threshold >= 50 && var.cpu_alarm_threshold <= 95
    error_message = "CPU使用率閾値は50%以上95%以下で設定してください。"
  }
}

variable "memory_alarm_threshold" {
  description = "Memory utilization alarm threshold (%)"
  type        = number
  default     = 80

  validation {
    condition     = var.memory_alarm_threshold >= 50 && var.memory_alarm_threshold <= 95
    error_message = "メモリ使用率閾値は50%以上95%以下で設定してください。"
  }
}

variable "response_time_threshold" {
  description = "Response time alarm threshold (seconds)"
  type        = number
  default     = 3

  validation {
    condition     = var.response_time_threshold >= 1 && var.response_time_threshold <= 10
    error_message = "レスポンス時間閾値は1秒以上10秒以下で設定してください。"
  }
}

# 通知設定
# SSL証明書設定
variable "ssl_certificate_arn" {
  description = "SSL certificate ARN (ACM)"
  type        = string
  default     = ""

  validation {
    condition     = var.ssl_certificate_arn == "" || can(regex("^arn:aws:acm:", var.ssl_certificate_arn))
    error_message = "有効なACM証明書ARNを指定してください。"
  }
}

# 通知設定
variable "notification_email" {
  description = "アラート通知用メールアドレス"
  type        = string
  default     = ""

  validation {
    condition     = var.notification_email == "" || can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notification_email))
    error_message = "有効なメールアドレス形式を指定してください。"
  }
}