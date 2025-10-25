# AgentCoreモジュール用変数定義

# 基本設定
variable "project_name" {
  description = "プロジェクト名"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "プロジェクト名は小文字、数字、ハイフンのみ使用可能です。"
  }
}

variable "environment" {
  description = "環境名（prod, dev, staging等）"
  type        = string
  validation {
    condition     = contains(["prod", "dev", "staging"], var.environment)
    error_message = "環境名はprod, dev, stagingのいずれかである必要があります。"
  }
}

variable "owner" {
  description = "リソースの所有者"
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

# CloudWatch設定
variable "cloudwatch_log_retention_days" {
  description = "CloudWatchログの保持期間（日数）"
  type        = number
  default     = 30
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.cloudwatch_log_retention_days)
    error_message = "CloudWatchログ保持期間は有効な値である必要があります。"
  }
}

# 監視・アラート設定
variable "sns_topic_arn" {
  description = "アラート通知用SNSトピックARN（オプション）"
  type        = string
  default     = null
}

variable "agentcore_error_threshold" {
  description = "AgentCoreエラー率の閾値（%）"
  type        = number
  default     = 5
  validation {
    condition     = var.agentcore_error_threshold >= 0 && var.agentcore_error_threshold <= 100
    error_message = "エラー率閾値は0-100の範囲で指定してください。"
  }
}

variable "agentcore_response_time_threshold" {
  description = "AgentCore応答時間の閾値（ミリ秒）"
  type        = number
  default     = 10000
  validation {
    condition     = var.agentcore_response_time_threshold > 0
    error_message = "応答時間閾値は正の数である必要があります。"
  }
}

# ECR設定
variable "ecr_image_tag_mutability" {
  description = "ECRイメージタグの変更可能性"
  type        = string
  default     = "MUTABLE"
  validation {
    condition     = contains(["MUTABLE", "IMMUTABLE"], var.ecr_image_tag_mutability)
    error_message = "ECRイメージタグ変更可能性はMUTABLEまたはIMMUTABLEである必要があります。"
  }
}

variable "ecr_lifecycle_keep_count" {
  description = "ECRで保持するイメージ数"
  type        = number
  default     = 10
  validation {
    condition     = var.ecr_lifecycle_keep_count > 0
    error_message = "保持するイメージ数は正の数である必要があります。"
  }
}

# AgentCore Runtime設定
variable "agentcore_log_level" {
  description = "AgentCoreのログレベル"
  type        = string
  default     = "INFO"
  validation {
    condition     = contains(["DEBUG", "INFO", "WARN", "ERROR"], var.agentcore_log_level)
    error_message = "ログレベルはDEBUG, INFO, WARN, ERRORのいずれかである必要があります。"
  }
}

variable "agentcore_network_mode" {
  description = "AgentCoreのネットワークモード"
  type        = string
  default     = "PUBLIC"
  validation {
    condition     = contains(["PUBLIC", "PRIVATE"], var.agentcore_network_mode)
    error_message = "ネットワークモードはPUBLICまたはPRIVATEである必要があります。"
  }
}

variable "agentcore_protocol" {
  description = "AgentCoreのプロトコル設定"
  type        = string
  default     = "HTTPS"  # セキュリティ強化のためHTTPSをデフォルトに変更
  validation {
    condition     = contains(["HTTP", "HTTPS"], var.agentcore_protocol)
    error_message = "プロトコルはHTTPまたはHTTPSである必要があります。"
  }
}

variable "force_https" {
  description = "HTTPS通信を強制するか"
  type        = bool
  default     = true
}

variable "enable_network_security_groups" {
  description = "ネットワークセキュリティグループを有効にするか"
  type        = bool
  default     = true
}

variable "allowed_ports" {
  description = "許可するポート番号のリスト"
  type        = list(number)
  default     = [443]  # HTTPSのみ許可
  validation {
    condition     = length(var.allowed_ports) > 0
    error_message = "少なくとも1つのポートを指定してください。"
  }
}

# Bedrock設定
variable "bedrock_model_arns" {
  description = "使用するBedrock基盤モデルのARNリスト"
  type        = list(string)
  default = [
    "arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0"
  ]
}

# 既存リソース参照用（オプション）
variable "existing_ecs_task_role_name" {
  description = "既存のECSタスクロール名（AgentCore呼び出し権限を付与する場合）"
  type        = string
  default     = null
}

variable "existing_sns_topic_arn" {
  description = "既存のSNSトピックARN（アラート通知用）"
  type        = string
  default     = null
}

# セキュリティ設定
variable "allowed_cidr_blocks" {
  description = "AgentCore呼び出しを許可するCIDRブロックリスト"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # 本番環境では適切なCIDRブロックに制限すること
  validation {
    condition     = length(var.allowed_cidr_blocks) > 0
    error_message = "少なくとも1つのCIDRブロックを指定してください。"
  }
}

variable "enable_ecr_encryption" {
  description = "ECRリポジトリの暗号化を有効にするか"
  type        = bool
  default     = true
}

variable "ecr_encryption_type" {
  description = "ECRリポジトリの暗号化タイプ"
  type        = string
  default     = "AES256"
  validation {
    condition     = contains(["AES256", "KMS"], var.ecr_encryption_type)
    error_message = "暗号化タイプはAES256またはKMSである必要があります。"
  }
}

variable "ecr_kms_key_id" {
  description = "ECR暗号化用のKMSキーID（暗号化タイプがKMSの場合）"
  type        = string
  default     = null
}

variable "enable_cloudwatch_log_encryption" {
  description = "CloudWatchログの暗号化を有効にするか"
  type        = bool
  default     = true
}

variable "cloudwatch_kms_key_id" {
  description = "CloudWatchログ暗号化用のKMSキーID"
  type        = string
  default     = "alias/aws/logs"
}

variable "enable_iam_condition_restrictions" {
  description = "IAMポリシーに条件制限を追加するか"
  type        = bool
  default     = true
}

# タグ設定
variable "additional_tags" {
  description = "追加のタグ"
  type        = map(string)
  default     = {}
}