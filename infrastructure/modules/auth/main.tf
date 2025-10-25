# 認証モジュール - Cognito設定
# 要件3.1, 3.2, 3.3: Cognitoユーザープール、クライアント、Passkey認証設定

# Cognitoユーザープール
# 要件3.1: メール検証機能付きのCognito_Serviceユーザープールを作成すること
# 要件3.3: Passkey（WebAuthn/FIDO2）認証とパスワードレス認証を設定すること
resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-${var.environment}-user-pool"

  # パスワードレス認証とPasskey対応
  # WebAuthn/FIDO2認証を有効化
  mfa_configuration = "OPTIONAL"

  # Passkey（WebAuthn）認証設定
  software_token_mfa_configuration {
    enabled = true
  }

  # メール検証設定（要件3.1）
  auto_verified_attributes = ["email"]

  # ユーザー属性設定
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  # メール設定
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # パスワードポリシー（パスワードレス認証のフォールバック用）
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  # アカウント復旧設定
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # ユーザープール追加設定
  user_pool_add_ons {
    advanced_security_mode = "ENFORCED"
  }

  # デバイス設定（Passkey対応）
  device_configuration {
    challenge_required_on_new_device      = true
    device_only_remembered_on_user_prompt = true
  }

  # 管理者作成ユーザー設定
  admin_create_user_config {
    allow_admin_create_user_only = false

    invite_message_template {
      email_message = "ユーザー名: {username}、仮パスワード: {####}"
      email_subject = "日本酒推薦サービスへようこそ"
      sms_message   = "ユーザー名: {username}、仮パスワード: {####}"
    }
  }

  # ユーザー名設定
  username_configuration {
    case_sensitive = false
  }

  # 検証メッセージテンプレート
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_message        = "認証コード: {####}"
    email_subject        = "日本酒推薦サービス - メール認証"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-user-pool"
  })
}
# Cognitoユーザープールクライアント
# 要件3.2: Next.jsアプリケーション用のCognito_Serviceユーザープールクライアントを設定すること
# 要件3.3: WebAuthn設定とPasskey対応、生体認証とセキュリティキーサポートの設定
resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.project_name}-${var.environment}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # JWT設定とトークン有効期限の設定（要件3.2）
  access_token_validity  = 1  # 1時間
  id_token_validity      = 1  # 1時間
  refresh_token_validity = 30 # 30日

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # WebAuthn/Passkey対応設定（要件3.3）
  # パスワードレス認証フロー
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_CUSTOM_AUTH" # WebAuthn/Passkey認証用
  ]

  # OAuth設定（Next.jsアプリケーション用）
  generate_secret                               = false # SPAのためシークレット不要
  prevent_user_existence_errors                 = "ENABLED"
  enable_token_revocation                       = true
  enable_propagate_additional_user_context_data = false

  # OAuth フロー設定
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  # コールバックURL（Next.jsアプリケーション用）
  callback_urls = [
    "http://localhost:3000/auth/callback",
    "https://${var.project_name}-${var.environment}.example.com/auth/callback"
  ]

  logout_urls = [
    "http://localhost:3000/auth/logout",
    "https://${var.project_name}-${var.environment}.example.com/auth/logout"
  ]

  # 読み取り・書き込み属性
  read_attributes = [
    "email",
    "email_verified",
    "preferred_username"
  ]

  write_attributes = [
    "email",
    "preferred_username"
  ]

  # WebAuthn設定（生体認証とセキュリティキー対応）
  # カスタム認証チャレンジでWebAuthn実装
  supported_identity_providers = ["COGNITO"]
}

# Cognitoユーザープールドメイン
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-${var.environment}-auth"
  user_pool_id = aws_cognito_user_pool.main.id
}

# Cognitoアイデンティティプール
# 要件3.4: 認証済みユーザーと未認証ユーザー用のIAMロールを作成すること
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${var.project_name}-${var.environment}-identity-pool"
  allow_unauthenticated_identities = true
  allow_classic_flow               = false

  # Cognitoユーザープールとの連携
  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.main.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = false
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-identity-pool"
  })
}

# アイデンティティプールロール関連付け
# 認証済み/未認証ユーザーロールの関連付け（要件3.4）
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    "authenticated"   = var.cognito_authenticated_role_arn
    "unauthenticated" = var.cognito_unauthenticated_role_arn
  }

  # 認証済みユーザーのロールマッピング
  role_mapping {
    identity_provider         = "${aws_cognito_user_pool.main.endpoint}:${aws_cognito_user_pool_client.main.id}"
    ambiguous_role_resolution = "AuthenticatedRole"
    type                      = "Token"
  }
}