# Terraform インフラ管理用 Makefile
# 統合テストと検証の自動化

.PHONY: help init plan apply destroy validate security-check cost-estimate clean

# デフォルト設定
PROJECT_NAME ?= sake-recommendation
ENVIRONMENT ?= prod
AWS_REGION ?= ap-northeast-1

help: ## ヘルプを表示
	@echo "Terraform インフラ管理コマンド"
	@echo ""
	@echo "使用方法:"
	@echo "  make <target> [PROJECT_NAME=<name>] [ENVIRONMENT=<env>] [AWS_REGION=<region>]"
	@echo ""
	@echo "利用可能なターゲット:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

init: ## Terraformを初期化
	@echo "Terraformを初期化中..."
	terraform init
	@echo "初期化完了"

plan: ## Terraform実行計画を表示
	@echo "Terraform実行計画を生成中..."
	terraform plan -out=tfplan
	@echo "実行計画完了"

apply: ## Terraformを適用（要確認）
	@echo "Terraformを適用中..."
	@read -p "本当に適用しますか？ (y/N): " confirm && [ "$$confirm" = "y" ]
	terraform apply tfplan
	@echo "適用完了"

destroy: ## インフラを削除（要確認）
	@echo "インフラを削除中..."
	@read -p "本当に削除しますか？ (y/N): " confirm && [ "$$confirm" = "y" ]
	terraform destroy
	@echo "削除完了"

validate: ## 構文チェックと基本検証
	@echo "Terraform構文チェック中..."
	terraform fmt -check=true -diff=true
	terraform validate
	@echo "構文チェック完了"

security-check: ## セキュリティチェックを実行
	@echo "セキュリティチェック実行中..."
	@if command -v tfsec >/dev/null 2>&1; then \
		tfsec .; \
	else \
		echo "tfsecがインストールされていません。手動セキュリティチェックを実行..."; \
		bash scripts/security-check.sh; \
	fi
	@echo "セキュリティチェック完了"

cost-estimate: ## コスト見積もりを実行
	@echo "コスト見積もり実行中..."
	bash scripts/cost-estimation.sh $(AWS_REGION)
	@echo "コスト見積もり完了"

full-validate: validate security-check ## 完全な検証を実行
	@echo "統合検証実行中..."
	bash scripts/validate-infrastructure.sh $(PROJECT_NAME) $(ENVIRONMENT) $(AWS_REGION)
	@echo "統合検証完了"

setup-backend: ## バックエンド設定をセットアップ
	@echo "バックエンド設定セットアップ中..."
	bash scripts/setup-backend.sh $(PROJECT_NAME) $(ENVIRONMENT) $(AWS_REGION)
	@echo "バックエンド設定完了"

format: ## Terraformコードをフォーマット
	@echo "Terraformコードフォーマット中..."
	terraform fmt -recursive
	@echo "フォーマット完了"

docs: ## ドキュメントを生成
	@echo "ドキュメント生成中..."
	@if command -v terraform-docs >/dev/null 2>&1; then \
		terraform-docs markdown table --output-file README.md .; \
		echo "terraform-docsでドキュメントを生成しました"; \
	else \
		echo "terraform-docsがインストールされていません"; \
		echo "手動でREADME.mdを更新してください"; \
	fi

clean: ## 一時ファイルを削除
	@echo "一時ファイル削除中..."
	rm -f tfplan
	rm -f terraform-validation-report.txt
	rm -f cost-estimation-report.txt
	rm -f *.bak
	@echo "クリーンアップ完了"

# 開発用ターゲット
dev-init: ## 開発環境用初期化
	$(MAKE) init ENVIRONMENT=dev

dev-plan: ## 開発環境用プラン
	$(MAKE) plan ENVIRONMENT=dev

dev-apply: ## 開発環境用適用
	$(MAKE) apply ENVIRONMENT=dev

# 本番用ターゲット
prod-init: ## 本番環境用初期化
	$(MAKE) init ENVIRONMENT=prod

prod-plan: ## 本番環境用プラン
	$(MAKE) plan ENVIRONMENT=prod

prod-apply: ## 本番環境用適用（追加確認あり）
	@echo "⚠️  本番環境への適用です"
	@read -p "本当に本番環境に適用しますか？ (yes/no): " confirm && [ "$$confirm" = "yes" ]
	$(MAKE) apply ENVIRONMENT=prod

# CI/CD用ターゲット
ci-validate: ## CI用検証（非対話式）
	terraform fmt -check=true
	terraform validate
	terraform plan -detailed-exitcode

ci-security: ## CI用セキュリティチェック
	@if command -v tfsec >/dev/null 2>&1; then \
		tfsec --format json --out tfsec-results.json .; \
	fi

# 情報表示
info: ## 現在の設定情報を表示
	@echo "現在の設定:"
	@echo "  プロジェクト名: $(PROJECT_NAME)"
	@echo "  環境: $(ENVIRONMENT)"
	@echo "  リージョン: $(AWS_REGION)"
	@echo ""
	@echo "Terraformバージョン:"
	@terraform version
	@echo ""
	@echo "AWSアカウント情報:"
	@aws sts get-caller-identity 2>/dev/null || echo "AWS認証情報が設定されていません"

# 依存関係チェック
check-deps: ## 必要なツールの確認
	@echo "依存関係チェック中..."
	@command -v terraform >/dev/null 2>&1 || (echo "❌ Terraformがインストールされていません" && exit 1)
	@command -v aws >/dev/null 2>&1 || (echo "❌ AWS CLIがインストールされていません" && exit 1)
	@command -v bc >/dev/null 2>&1 || (echo "❌ bcがインストールされていません" && exit 1)
	@echo "✅ 必要なツールがすべてインストールされています"
	@echo ""
	@echo "オプションツール:"
	@command -v tfsec >/dev/null 2>&1 && echo "✅ tfsec (セキュリティスキャン)" || echo "⚠️  tfsec (推奨)"
	@command -v terraform-docs >/dev/null 2>&1 && echo "✅ terraform-docs (ドキュメント生成)" || echo "⚠️  terraform-docs (推奨)"