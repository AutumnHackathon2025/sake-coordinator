# Amazon Bedrock AgentCore インフラストラクチャ
# 日本酒推薦サービス用 AgentCore Runtime とその関連リソース

# データソース
data "aws_caller_identity" "current" {}

# 共通タグの定義
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Owner       = var.owner
    CostCenter  = var.cost_center
    Module      = "agentcore"
    ManagedBy   = "terraform"
  }
}

# ECRリポジトリ（AgentCoreコンテナイメージ用）- セキュリティ強化
resource "aws_ecr_repository" "agentcore" {
  name                 = "${var.project_name}-${var.environment}-agentcore"
  image_tag_mutability = var.ecr_image_tag_mutability

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = var.enable_ecr_encryption ? var.ecr_encryption_type : "AES256"
    kms_key         = var.ecr_encryption_type == "KMS" && var.ecr_kms_key_id != null ? var.ecr_kms_key_id : null
  }

  tags = merge(local.common_tags, {
    SecurityLevel = "High"
    DataClass     = "Confidential"
  })
}

# ECRライフサイクルポリシー
resource "aws_ecr_lifecycle_policy" "agentcore" {
  repository = aws_ecr_repository.agentcore.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images older than 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# AgentCore Runtime実行用IAMロール
resource "aws_iam_role" "agentcore_runtime" {
  name = "${var.project_name}-${var.environment}-agentcore-runtime-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "bedrock-agentcore.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# ECRアクセス用IAMポリシー（最小権限原則適用）
resource "aws_iam_policy" "ecr_access" {
  name        = "${var.project_name}-${var.environment}-agentcore-ecr-access"
  description = "AgentCore Runtime用ECRアクセス権限（最小権限）"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRTokenAccess"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
        Condition = var.enable_iam_condition_restrictions ? {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        } : null
      },
      {
        Sid    = "ECRImageAccess"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = aws_ecr_repository.agentcore.arn
        Condition = var.enable_iam_condition_restrictions ? {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        } : null
      }
    ]
  })

  tags = local.common_tags
}

# Bedrockアクセス用IAMポリシー（最小権限原則適用）
resource "aws_iam_policy" "bedrock_access" {
  name        = "${var.project_name}-${var.environment}-agentcore-bedrock-access"
  description = "AgentCore Runtime用Bedrock基盤モデルアクセス権限（最小権限）"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "BedrockModelAccess"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}::foundation-model/amazon.nova-lite-v1:0"
        ]
        Condition = var.enable_iam_condition_restrictions ? {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
          DateGreaterThan = {
            "aws:CurrentTime" = "2024-01-01T00:00:00Z"
          }
        } : null
      }
    ]
  })

  tags = local.common_tags
}

# CloudWatchログ出力用IAMポリシー（最小権限原則適用）
resource "aws_iam_policy" "cloudwatch_logs" {
  name        = "${var.project_name}-${var.environment}-agentcore-logs"
  description = "AgentCore Runtime用CloudWatchログ出力権限（最小権限）"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogsAccess"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:*:log-group:/aws/bedrock-agentcore/${var.project_name}-${var.environment}",
          "arn:aws:logs:${var.aws_region}:*:log-group:/aws/bedrock-agentcore/${var.project_name}-${var.environment}:*"
        ]
        Condition = var.enable_iam_condition_restrictions ? {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        } : null
      }
    ]
  })

  tags = local.common_tags
}

# IAMポリシーのアタッチ
resource "aws_iam_role_policy_attachment" "ecr_access" {
  role       = aws_iam_role.agentcore_runtime.name
  policy_arn = aws_iam_policy.ecr_access.arn
}

resource "aws_iam_role_policy_attachment" "bedrock_access" {
  role       = aws_iam_role.agentcore_runtime.name
  policy_arn = aws_iam_policy.bedrock_access.arn
}

resource "aws_iam_role_policy_attachment" "cloudwatch_logs" {
  role       = aws_iam_role.agentcore_runtime.name
  policy_arn = aws_iam_policy.cloudwatch_logs.arn
}

# Next.jsアプリケーション用AgentCore呼び出しポリシー（最小権限原則適用）
resource "aws_iam_policy" "agentcore_invoke" {
  name        = "${var.project_name}-${var.environment}-agentcore-invoke"
  description = "Next.jsアプリケーション用AgentCore呼び出し権限（最小権限）"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AgentCoreInvokeAccess"
        Effect = "Allow"
        Action = [
          "bedrock-agentcore:InvokeAgent"
        ]
        Resource = "arn:aws:bedrock-agentcore:${var.aws_region}:*:agent-runtime/${replace(var.project_name, "-", "_")}_${var.environment}_agent_runtime"
        Condition = var.enable_iam_condition_restrictions ? {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
          IpAddress = {
            "aws:SourceIp" = var.allowed_cidr_blocks
          }
        } : null
      }
    ]
  })

  tags = local.common_tags
}

# 既存ECSタスクロールへのAgentCore呼び出し権限追加
# 要件4.3: 既存のECSタスクロールにAgentCore呼び出しポリシーをアタッチ
data "aws_iam_role" "existing_ecs_task_role" {
  count = var.existing_ecs_task_role_name != null ? 1 : 0
  name  = var.existing_ecs_task_role_name
}

resource "aws_iam_role_policy_attachment" "ecs_task_agentcore_invoke" {
  count      = var.existing_ecs_task_role_name != null ? 1 : 0
  role       = data.aws_iam_role.existing_ecs_task_role[0].name
  policy_arn = aws_iam_policy.agentcore_invoke.arn
}

# CloudWatchロググループ - セキュリティ強化
resource "aws_cloudwatch_log_group" "agentcore" {
  name              = "/aws/bedrock-agentcore/${var.project_name}-${var.environment}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = var.enable_cloudwatch_log_encryption ? var.cloudwatch_kms_key_id : null

  tags = merge(local.common_tags, {
    SecurityLevel = "High"
    DataClass     = "Confidential"
    LogType       = "AgentCore"
  })
}

# AgentCore Runtime - ネットワークセキュリティ強化
# 注意: コンテナイメージがECRにプッシュされた後に有効化してください
resource "aws_bedrockagentcore_agent_runtime" "sake_recommendation" {
  agent_runtime_name = "${replace(var.project_name, "-", "_")}_${var.environment}_agent_runtime"
  role_arn           = aws_iam_role.agentcore_runtime.arn

  agent_runtime_artifact {
    container_configuration {
      container_uri = "${aws_ecr_repository.agentcore.repository_url}:latest"
    }
  }

  environment_variables = {
    LOG_LEVEL        = var.agentcore_log_level
    ENVIRONMENT      = var.environment
    AWS_REGION       = var.aws_region
    FORCE_HTTPS      = var.force_https ? "true" : "false"
    SECURITY_HEADERS = "true"
    TLS_VERSION      = "1.2"
  }

  network_configuration {
    network_mode = var.agentcore_network_mode
  }

  protocol_configuration {
    server_protocol = var.force_https ? "HTTP" : var.agentcore_protocol
  }

  tags = merge(local.common_tags, {
    NetworkSecurity = "Enhanced"
    Protocol        = var.force_https ? "HTTP" : var.agentcore_protocol
  })

  depends_on = [
    aws_cloudwatch_log_group.agentcore,
    aws_iam_role_policy_attachment.ecr_access,
    aws_iam_role_policy_attachment.bedrock_access,
    aws_iam_role_policy_attachment.cloudwatch_logs
  ]
}

# CloudWatchアラーム（エラー率監視）
resource "aws_cloudwatch_metric_alarm" "agentcore_error_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-agentcore-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorRate"
  namespace           = "AWS/BedrockAgentCore"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "AgentCore実行エラー率が5%を超えました"
  alarm_actions       = var.sns_topic_arn != null ? [var.sns_topic_arn] : []

  dimensions = {
    AgentRuntimeName = aws_bedrockagentcore_agent_runtime.sake_recommendation.agent_runtime_name
  }

  tags = local.common_tags
}

# CloudWatchアラーム（応答時間監視）
resource "aws_cloudwatch_metric_alarm" "agentcore_response_time" {
  alarm_name          = "${var.project_name}-${var.environment}-agentcore-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/BedrockAgentCore"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000"
  alarm_description   = "AgentCore応答時間が10秒を超えました"
  alarm_actions       = var.sns_topic_arn != null ? [var.sns_topic_arn] : []

  dimensions = {
    AgentRuntimeName = aws_bedrockagentcore_agent_runtime.sake_recommendation.agent_runtime_name
  }

  tags = local.common_tags
}