# セキュリティモジュール変数定義

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

variable "tags" {
  description = "リソースタグ"
  type        = map(string)
  default     = {}
}

# 注意: S3、DynamoDB、CognitoのARNは実際のリソース作成後に
# 他のモジュールから参照されるため、ここでは変数として定義しない