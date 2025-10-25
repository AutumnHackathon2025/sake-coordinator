# 監視モジュール - CloudWatch、SNS設定
# 要件6.1, 6.2, 6.3, 6.4: CloudWatchロググループ、アラーム、SNSトピック作成

# CloudWatch ロググループ
# 要件6.1: アプリケーションログ用のCloudWatch_Monitoringロググループを作成すること
# 要件6.3: ネットワーク監視用のVPCフローログを有効にすること
# 要件6.5: コスト管理のためのログ保持ポリシーを設定すること

# ECS アプリケーションログ用ロググループ
resource "aws_cloudwatch_log_group" "ecs_app_logs" {
  name              = "/aws/ecs/${var.project_name}-${var.environment}/app"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-ecs-app-logs"
    Type = "ECS Application Logs"
  })
}

# ALB アクセスログ用ロググループ
resource "aws_cloudwatch_log_group" "alb_access_logs" {
  name              = "/aws/alb/${var.project_name}-${var.environment}/access"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-alb-access-logs"
    Type = "ALB Access Logs"
  })
}

# VPC フローログ用ロググループ
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/${var.project_name}-${var.environment}/flowlogs"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-vpc-flow-logs"
    Type = "VPC Flow Logs"
  })
}

# VPC フローログ用 IAM ロール
resource "aws_iam_role" "vpc_flow_logs_role" {
  name = "${var.project_name}-${var.environment}-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-vpc-flow-logs-role"
  })
}

# VPC フローログ用 IAM ポリシー
resource "aws_iam_role_policy" "vpc_flow_logs_policy" {
  name = "${var.project_name}-${var.environment}-vpc-flow-logs-policy"
  role = aws_iam_role.vpc_flow_logs_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# VPC フローログ
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = var.vpc_id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-vpc-flow-log"
  })
}

# CloudWatch アラーム
# 要件6.2: 重要なメトリクス用のCloudWatch_Monitoringアラームを設定すること

# ECS タスク CPU 使用率アラーム（閾値80%）
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_utilization" {
  alarm_name          = "${var.project_name}-${var.environment}-ecs-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "ECS task CPU utilization exceeds 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = var.ecs_service_name
    ClusterName = var.ecs_cluster_name
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-ecs-cpu-alarm"
    Type = "ECS CPU Alarm"
  })
}

# ECS タスク メモリ使用率アラーム（閾値80%）
resource "aws_cloudwatch_metric_alarm" "ecs_memory_utilization" {
  alarm_name          = "${var.project_name}-${var.environment}-ecs-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "ECS task memory utilization exceeds 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = var.ecs_service_name
    ClusterName = var.ecs_cluster_name
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-ecs-memory-alarm"
    Type = "ECS Memory Alarm"
  })
}

# ALB レスポンス時間アラーム（閾値3秒）
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "3"
  alarm_description   = "ALB response time exceeds 3 seconds"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-alb-response-time-alarm"
    Type = "ALB Response Time Alarm"
  })
}

# DynamoDB 読み取りエラー率アラーム
resource "aws_cloudwatch_metric_alarm" "dynamodb_read_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-dynamodb-read-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReadThrottledEvents"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "DynamoDB read errors detected"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TableName = var.dynamodb_table_name
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-dynamodb-read-errors-alarm"
    Type = "DynamoDB Read Errors Alarm"
  })
}

# DynamoDB 書き込みエラー率アラーム
resource "aws_cloudwatch_metric_alarm" "dynamodb_write_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-dynamodb-write-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "WriteThrottledEvents"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "DynamoDB write errors detected"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TableName = var.dynamodb_table_name
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-dynamodb-write-errors-alarm"
    Type = "DynamoDB Write Errors Alarm"
  })
}

# SNS トピックとアラート通知
# 要件6.4: アラート通知用のSNSトピックを作成すること

# アラート通知用 SNS トピック
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-alerts-topic"
    Type = "Alert Notifications"
  })
}

# SNS トピックポリシー（CloudWatch からの発行を許可）
resource "aws_sns_topic_policy" "alerts_policy" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# 現在のAWSアカウント情報を取得
data "aws_caller_identity" "current" {}