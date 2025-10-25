# 監視モジュール変数定義

variable "project_name" {
  description = "プロジェクト名"
  type        = string
}

variable "environment" {
  description = "環境名"
  type        = string
}

variable "ecs_cluster_name" {
  description = "ECS クラスター名"
  type        = string
}

variable "ecs_service_name" {
  description = "ECS サービス名"
  type        = string
}

variable "alb_arn_suffix" {
  description = "Application Load Balancer ARN Suffix"
  type        = string
}

variable "dynamodb_table_name" {
  description = "DynamoDB テーブル名"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 バケット名"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "tags" {
  description = "リソースタグ"
  type        = map(string)
  default     = {}
}