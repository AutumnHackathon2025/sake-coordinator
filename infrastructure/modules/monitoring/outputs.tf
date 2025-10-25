# 監視モジュール出力値

# CloudWatch ロググループ出力
output "ecs_app_log_group_name" {
  description = "ECS アプリケーションログ用ロググループ名"
  value       = aws_cloudwatch_log_group.ecs_app_logs.name
}

output "ecs_app_log_group_arn" {
  description = "ECS アプリケーションログ用ロググループ ARN"
  value       = aws_cloudwatch_log_group.ecs_app_logs.arn
}

output "alb_access_log_group_name" {
  description = "ALB アクセスログ用ロググループ名"
  value       = aws_cloudwatch_log_group.alb_access_logs.name
}

output "alb_access_log_group_arn" {
  description = "ALB アクセスログ用ロググループ ARN"
  value       = aws_cloudwatch_log_group.alb_access_logs.arn
}

output "vpc_flow_log_group_name" {
  description = "VPC フローログ用ロググループ名"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

output "vpc_flow_log_group_arn" {
  description = "VPC フローログ用ロググループ ARN"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.arn
}

output "log_group_names" {
  description = "CloudWatch ロググループ名リスト"
  value = [
    aws_cloudwatch_log_group.ecs_app_logs.name,
    aws_cloudwatch_log_group.alb_access_logs.name,
    aws_cloudwatch_log_group.vpc_flow_logs.name
  ]
}

# CloudWatch アラーム出力
output "ecs_cpu_alarm_arn" {
  description = "ECS CPU 使用率アラーム ARN"
  value       = aws_cloudwatch_metric_alarm.ecs_cpu_utilization.arn
}

output "ecs_memory_alarm_arn" {
  description = "ECS メモリ使用率アラーム ARN"
  value       = aws_cloudwatch_metric_alarm.ecs_memory_utilization.arn
}

output "alb_response_time_alarm_arn" {
  description = "ALB レスポンス時間アラーム ARN"
  value       = aws_cloudwatch_metric_alarm.alb_response_time.arn
}

output "dynamodb_read_errors_alarm_arn" {
  description = "DynamoDB read errors alarm ARN"
  value       = aws_cloudwatch_metric_alarm.dynamodb_read_errors.arn
}

output "dynamodb_write_errors_alarm_arn" {
  description = "DynamoDB write errors alarm ARN"
  value       = aws_cloudwatch_metric_alarm.dynamodb_write_errors.arn
}

output "alarm_arns" {
  description = "CloudWatch アラーム ARN リスト"
  value = [
    aws_cloudwatch_metric_alarm.ecs_cpu_utilization.arn,
    aws_cloudwatch_metric_alarm.ecs_memory_utilization.arn,
    aws_cloudwatch_metric_alarm.alb_response_time.arn,
    aws_cloudwatch_metric_alarm.dynamodb_read_errors.arn,
    aws_cloudwatch_metric_alarm.dynamodb_write_errors.arn
  ]
}

# SNS トピック出力
output "sns_topic_arn" {
  description = "アラート通知用 SNS トピック ARN"
  value       = aws_sns_topic.alerts.arn
}

output "sns_topic_name" {
  description = "アラート通知用 SNS トピック名"
  value       = aws_sns_topic.alerts.name
}

# プレースホルダー出力 - 後続のタスクで実装予定
output "dashboard_url" {
  description = "CloudWatch ダッシュボード URL"
  value       = ""
}