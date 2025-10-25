# セキュリティモジュール - セキュリティグループ、IAMロール設定
# 要件1.4: 最小権限アクセスルールを持つセキュリティグループを作成

# ALB用セキュリティグループ
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-${var.environment}-alb-"
  description = "Security group for ALB - Allow HTTP/HTTPS"
  vpc_id      = var.vpc_id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-alb-sg"
    Type = "ALB"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ECS用セキュリティグループ
resource "aws_security_group" "ecs" {
  name_prefix = "${var.project_name}-${var.environment}-ecs-"
  description = "Security group for ECS - Allow access from ALB"
  vpc_id      = var.vpc_id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-ecs-sg"
    Type = "ECS"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ALBセキュリティグループルール
resource "aws_security_group_rule" "alb_ingress_http" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb.id
  description       = "HTTP from Internet"
}

resource "aws_security_group_rule" "alb_ingress_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb.id
  description       = "HTTPS from Internet"
}

resource "aws_security_group_rule" "alb_egress_ecs" {
  type                     = "egress"
  from_port                = 8080
  to_port                  = 8080
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs.id
  security_group_id        = aws_security_group.alb.id
  description              = "HTTP to ECS"
}

# ECSセキュリティグループルール
resource "aws_security_group_rule" "ecs_ingress_alb" {
  type                     = "ingress"
  from_port                = 8080
  to_port                  = 8080
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.ecs.id
  description              = "HTTP from ALB"
}

resource "aws_security_group_rule" "ecs_egress_https" {
  type              = "egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ecs.id
  description       = "HTTPS to Internet"
}

resource "aws_security_group_rule" "ecs_egress_http" {
  type              = "egress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ecs.id
  description       = "HTTP to Internet"
}

# VPCエンドポイント用セキュリティグループ
resource "aws_security_group" "vpc_endpoint" {
  name_prefix = "${var.project_name}-${var.environment}-vpce-"
  description = "Security group for VPC endpoints"
  vpc_id      = var.vpc_id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-vpce-sg"
    Type = "VPCEndpoint"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# VPCエンドポイントセキュリティグループルール
resource "aws_security_group_rule" "vpc_endpoint_ingress_ecs" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs.id
  security_group_id        = aws_security_group.vpc_endpoint.id
  description              = "HTTPS from ECS"
}

# ECSタスク実行ロール
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-${var.environment}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-ecs-task-execution-role"
    Type = "ECSTaskExecution"
  })
}

# ECSタスク実行ロールにAWSマネージドポリシーをアタッチ
resource "aws_iam_role_policy_attachment" "ecs_task_execution_policy" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECSタスクロール（アプリケーション用）
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-${var.environment}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-ecs-task-role"
    Type = "ECSTask"
  })
}

# S3アクセス用ポリシー
resource "aws_iam_policy" "s3_access" {
  name        = "${var.project_name}-${var.environment}-s3-access-policy"
  description = "Policy for S3 bucket access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-${var.environment}-sake-images/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-${var.environment}-sake-images"
        ]
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-s3-access-policy"
    Type = "S3Access"
  })
}

# 現在のAWSアカウント情報を取得
data "aws_caller_identity" "current" {}

# DynamoDBアクセス用ポリシー
resource "aws_iam_policy" "dynamodb_access" {
  name        = "${var.project_name}-${var.environment}-dynamodb-access-policy"
  description = "Policy for DynamoDB table access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:*:${data.aws_caller_identity.current.account_id}:table/${var.project_name}-${var.environment}-drinking-records",
          "arn:aws:dynamodb:*:${data.aws_caller_identity.current.account_id}:table/${var.project_name}-${var.environment}-drinking-records/index/*"
        ]
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-dynamodb-access-policy"
    Type = "DynamoDBAccess"
  })
}

# Cognitoアクセス用ポリシー
resource "aws_iam_policy" "cognito_access" {
  name        = "${var.project_name}-${var.environment}-cognito-access-policy"
  description = "Policy for Cognito access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:ListUsers"
        ]
        Resource = [
          "arn:aws:cognito-idp:*:${data.aws_caller_identity.current.account_id}:userpool/*"
        ]
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-cognito-access-policy"
    Type = "CognitoAccess"
  })
}

# ECSタスクロールにポリシーをアタッチ
resource "aws_iam_role_policy_attachment" "ecs_task_s3" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.s3_access.arn
}

resource "aws_iam_role_policy_attachment" "ecs_task_dynamodb" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

resource "aws_iam_role_policy_attachment" "ecs_task_cognito" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.cognito_access.arn
}

# Cognito認証済みユーザーロール
resource "aws_iam_role" "cognito_authenticated" {
  name = "${var.project_name}-${var.environment}-cognito-authenticated-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = "${var.project_name}-${var.environment}-identity-pool"
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-cognito-authenticated-role"
    Type = "CognitoAuthenticated"
  })
}

# Cognito未認証ユーザーロール
resource "aws_iam_role" "cognito_unauthenticated" {
  name = "${var.project_name}-${var.environment}-cognito-unauthenticated-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = "${var.project_name}-${var.environment}-identity-pool"
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "unauthenticated"
          }
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-cognito-unauthenticated-role"
    Type = "CognitoUnauthenticated"
  })
}

# Cognito認証済みユーザー用ポリシー
resource "aws_iam_policy" "cognito_authenticated_policy" {
  name        = "${var.project_name}-${var.environment}-cognito-authenticated-policy"
  description = "Policy for Cognito authenticated users"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-${var.environment}-sake-images/users/$${cognito-identity.amazonaws.com:sub}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query"
        ]
        Resource = [
          "arn:aws:dynamodb:*:${data.aws_caller_identity.current.account_id}:table/${var.project_name}-${var.environment}-drinking-records",
          "arn:aws:dynamodb:*:${data.aws_caller_identity.current.account_id}:table/${var.project_name}-${var.environment}-drinking-records/index/*"
        ]
        Condition = {
          "ForAllValues:StringEquals" = {
            "dynamodb:LeadingKeys" = ["$${cognito-identity.amazonaws.com:sub}"]
          }
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-cognito-authenticated-policy"
    Type = "CognitoAuthenticatedPolicy"
  })
}

# Cognito未認証ユーザー用ポリシー（最小限のアクセス）
resource "aws_iam_policy" "cognito_unauthenticated_policy" {
  name        = "${var.project_name}-${var.environment}-cognito-unauthenticated-policy"
  description = "Policy for Cognito unauthenticated users"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-cognito-unauthenticated-policy"
    Type = "CognitoUnauthenticatedPolicy"
  })
}

# Cognitoロールにポリシーをアタッチ
resource "aws_iam_role_policy_attachment" "cognito_authenticated_policy" {
  role       = aws_iam_role.cognito_authenticated.name
  policy_arn = aws_iam_policy.cognito_authenticated_policy.arn
}

resource "aws_iam_role_policy_attachment" "cognito_unauthenticated_policy" {
  role       = aws_iam_role.cognito_unauthenticated.name
  policy_arn = aws_iam_policy.cognito_unauthenticated_policy.arn
}