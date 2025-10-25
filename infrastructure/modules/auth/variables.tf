# 認証モジュール変数定義

variable "project_name" {
  description = "プロジェクト名"
  type        = string
}

variable "environment" {
  description = "環境名"
  type        = string
}

variable "cognito_authenticated_role_arn" {
  description = "Cognito authenticated user role ARN"
  type        = string
}

variable "cognito_unauthenticated_role_arn" {
  description = "Cognito 未認証ユーザーロール ARN"
  type        = string
}

variable "tags" {
  description = "リソースタグ"
  type        = map(string)
  default     = {}
}