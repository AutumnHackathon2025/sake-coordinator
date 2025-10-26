# コンピューティングモジュール変数定義

variable "project_name" {
  description = "プロジェクト名"
  type        = string
}

variable "environment" {
  description = "環境名"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "パブリックサブネット ID リスト"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "プライベートサブネット ID リスト"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "ALB セキュリティグループ ID"
  type        = string
}

variable "ecs_security_group_id" {
  description = "ECS セキュリティグループ ID"
  type        = string
}

variable "ecs_task_execution_role_arn" {
  description = "ECS タスク実行ロール ARN"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "ECS タスクロール ARN"
  type        = string
}

variable "ssl_certificate_arn" {
  description = "SSL certificate ARN (ACM)"
  type        = string
}

variable "tags" {
  description = "リソースタグ"
  type        = map(string)
  default     = {}
}

variable "agentcore_runtime_arn" {
  description = "Bedrock Agent Core Runtime ARN"
  type        = string
  default     = ""
}

variable "dynamodb_endpoint" {
  description = "DynamoDB エンドポイント URL"
  type        = string
  default     = ""
}

variable "dynamodb_table_name" {
  description = "DynamoDB テーブル名"
  type        = string
  default     = ""
}