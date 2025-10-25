# ストレージモジュール変数定義

variable "project_name" {
  description = "プロジェクト名"
  type        = string
}

variable "environment" {
  description = "環境名"
  type        = string
}

variable "s3_access_policy_arn" {
  description = "S3 アクセスポリシー ARN"
  type        = string
}

variable "tags" {
  description = "リソースタグ"
  type        = map(string)
  default     = {}
}