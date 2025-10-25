# コンピューティングモジュール出力値

output "ecr_repository_url" {
  description = "ECR リポジトリ URL"
  value       = aws_ecr_repository.nextjs_app.repository_url
}

output "ecr_repository_name" {
  description = "ECR リポジトリ名"
  value       = aws_ecr_repository.nextjs_app.name
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS 名"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Application Load Balancer Zone ID"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "Application Load Balancer ARN"
  value       = aws_lb.main.arn
}

output "alb_arn_suffix" {
  description = "Application Load Balancer ARN Suffix"
  value       = aws_lb.main.arn_suffix
}

output "target_group_arn" {
  description = "ターゲットグループ ARN"
  value       = aws_lb_target_group.ecs.arn
}

output "ecs_cluster_name" {
  description = "ECS クラスター名"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS クラスター ARN"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "ECS サービス名"
  value       = aws_ecs_service.nextjs_app.name
}

output "ecs_service_arn" {
  description = "ECS サービス ARN"
  value       = aws_ecs_service.nextjs_app.id
}

output "ecs_autoscaling_target_resource_id" {
  description = "ECS オートスケーリングターゲット リソース ID"
  value       = aws_appautoscaling_target.ecs_target.resource_id
}

output "ecs_task_definition_arn" {
  description = "ECS タスク定義 ARN"
  value       = aws_ecs_task_definition.nextjs_app.arn
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch ログ グループ名"
  value       = aws_cloudwatch_log_group.app.name
}