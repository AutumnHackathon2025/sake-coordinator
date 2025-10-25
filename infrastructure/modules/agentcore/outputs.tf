# Amazon Bedrock AgentCore モジュール出力値定義

# ECRリポジトリ出力
output "ecr_repository_url" {
  description = "AgentCore用ECRリポジトリURL"
  value       = aws_ecr_repository.agentcore.repository_url
}

output "ecr_repository_arn" {
  description = "AgentCore用ECRリポジトリARN"
  value       = aws_ecr_repository.agentcore.arn
}

output "ecr_repository_name" {
  description = "AgentCore用ECRリポジトリ名"
  value       = aws_ecr_repository.agentcore.name
}

# AgentCore Runtime出力
output "agentcore_runtime_id" {
  description = "AgentCore Runtime ID"
  value       = aws_bedrockagentcore_agent_runtime.sake_recommendation.agent_runtime_name
}

output "agentcore_runtime_arn" {
  description = "AgentCore Runtime ARN"
  value       = "arn:aws:bedrock-agentcore:${var.aws_region}:${data.aws_caller_identity.current.account_id}:runtime/${aws_bedrockagentcore_agent_runtime.sake_recommendation.agent_runtime_name}"
}

output "agentcore_runtime_name" {
  description = "AgentCore Runtime名"
  value       = aws_bedrockagentcore_agent_runtime.sake_recommendation.agent_runtime_name
}

output "agentcore_runtime_endpoint" {
  description = "AgentCore Runtime エンドポイント"
  value       = "https://bedrock-agentcore.${var.aws_region}.amazonaws.com"
  sensitive   = false
}

# IAMロール・ポリシー出力
output "agentcore_runtime_role_arn" {
  description = "AgentCore Runtime実行用IAMロールARN"
  value       = aws_iam_role.agentcore_runtime.arn
}

output "agentcore_invoke_policy_arn" {
  description = "AgentCore呼び出し用IAMポリシーARN"
  value       = aws_iam_policy.agentcore_invoke.arn
}

output "ecr_access_policy_arn" {
  description = "ECRアクセス用IAMポリシーARN"
  value       = aws_iam_policy.ecr_access.arn
}

output "bedrock_access_policy_arn" {
  description = "Bedrockアクセス用IAMポリシーARN"
  value       = aws_iam_policy.bedrock_access.arn
}

# CloudWatch出力
output "cloudwatch_log_group_name" {
  description = "AgentCore用CloudWatchロググループ名"
  value       = aws_cloudwatch_log_group.agentcore.name
}

output "cloudwatch_log_group_arn" {
  description = "AgentCore用CloudWatchロググループARN"
  value       = aws_cloudwatch_log_group.agentcore.arn
}

# アラーム出力
output "error_rate_alarm_arn" {
  description = "エラー率監視アラームARN"
  value       = aws_cloudwatch_metric_alarm.agentcore_error_rate.arn
}

output "response_time_alarm_arn" {
  description = "応答時間監視アラームARN"
  value       = aws_cloudwatch_metric_alarm.agentcore_response_time.arn
}

# セキュリティ情報出力
output "security_configuration" {
  description = "AgentCoreセキュリティ設定情報"
  value = {
    network_mode        = var.agentcore_network_mode
    protocol           = var.force_https ? "HTTP" : var.agentcore_protocol
    encryption_enabled = var.enable_ecr_encryption
    log_encryption     = var.enable_cloudwatch_log_encryption
  }
  sensitive = false
}