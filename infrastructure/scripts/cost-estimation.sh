#!/bin/bash

# Terraformインフラコスト見積もりスクリプト
# AWS料金計算機を使用した概算コスト算出

set -e

# 色付きログ出力用の関数
log_info() {
    echo -e "\033[0;32m[INFO]\033[0m $1"
}

log_warn() {
    echo -e "\033[0;33m[WARN]\033[0m $1"
}

# パラメータの設定
AWS_REGION=${1:-"ap-northeast-1"}
MONTHLY_REQUESTS=${2:-100000}  # 月間リクエスト数
STORAGE_GB=${3:-10}            # ストレージ使用量（GB）

echo "=== AWS インフラコスト見積もり ==="
echo "リージョン: $AWS_REGION"
echo "想定月間リクエスト数: $MONTHLY_REQUESTS"
echo "想定ストレージ使用量: ${STORAGE_GB}GB"
echo ""

# 1. ECS Fargate コスト
log_info "1. ECS Fargate コスト計算中..."

# 設定値
CPU_UNITS=0.5      # vCPU
MEMORY_GB=1        # GB
TASKS_COUNT=2      # 最小タスク数
HOURS_PER_MONTH=730

# 東京リージョンの料金（2024年基準）
FARGATE_CPU_PRICE_PER_HOUR=0.04656    # USD per vCPU per hour
FARGATE_MEMORY_PRICE_PER_HOUR=0.00511 # USD per GB per hour

FARGATE_CPU_COST=$(echo "$CPU_UNITS * $TASKS_COUNT * $HOURS_PER_MONTH * $FARGATE_CPU_PRICE_PER_HOUR" | bc -l)
FARGATE_MEMORY_COST=$(echo "$MEMORY_GB * $TASKS_COUNT * $HOURS_PER_MONTH * $FARGATE_MEMORY_PRICE_PER_HOUR" | bc -l)
FARGATE_TOTAL=$(echo "$FARGATE_CPU_COST + $FARGATE_MEMORY_COST" | bc -l)

printf "ECS Fargate (CPU: %.1f vCPU, Memory: %.1f GB, Tasks: %d)\n" $CPU_UNITS $MEMORY_GB $TASKS_COUNT
printf "  - CPU コスト: \$%.2f/月\n" $FARGATE_CPU_COST
printf "  - Memory コスト: \$%.2f/月\n" $FARGATE_MEMORY_COST
printf "  - 合計: \$%.2f/月\n" $FARGATE_TOTAL

echo ""

# 2. Application Load Balancer コスト
log_info "2. Application Load Balancer コスト計算中..."

ALB_FIXED_COST=22.0  # USD per month (固定費)
ALB_LCU_PRICE=0.008  # USD per LCU per hour

# LCU計算（簡易版）
REQUESTS_PER_SECOND=$(echo "$MONTHLY_REQUESTS / (30 * 24 * 3600)" | bc -l)
LCU_FOR_REQUESTS=$(echo "$REQUESTS_PER_SECOND / 25" | bc -l)  # 25 requests/sec per LCU
LCU_NEEDED=$(echo "if ($LCU_FOR_REQUESTS < 1) 1 else $LCU_FOR_REQUESTS" | bc -l)

ALB_LCU_COST=$(echo "$LCU_NEEDED * $HOURS_PER_MONTH * $ALB_LCU_PRICE" | bc -l)
ALB_TOTAL=$(echo "$ALB_FIXED_COST + $ALB_LCU_COST" | bc -l)

printf "Application Load Balancer\n"
printf "  - 固定費: \$%.2f/月\n" $ALB_FIXED_COST
printf "  - LCU コスト (%.2f LCU): \$%.2f/月\n" $LCU_NEEDED $ALB_LCU_COST
printf "  - 合計: \$%.2f/月\n" $ALB_TOTAL

echo ""

# 3. NAT Gateway コスト
log_info "3. NAT Gateway コスト計算中..."

NAT_COUNT=2  # 2つのAZ
NAT_FIXED_PRICE=45.0  # USD per NAT Gateway per month
NAT_DATA_PRICE=0.045  # USD per GB processed

# データ処理量の推定（簡易版）
ESTIMATED_DATA_GB=$(echo "$MONTHLY_REQUESTS * 0.001" | bc -l)  # 1KB per request
NAT_DATA_COST=$(echo "$ESTIMATED_DATA_GB * $NAT_DATA_PRICE" | bc -l)
NAT_TOTAL=$(echo "$NAT_COUNT * $NAT_FIXED_PRICE + $NAT_DATA_COST" | bc -l)

printf "NAT Gateway (%d個)\n" $NAT_COUNT
printf "  - 固定費: \$%.2f/月\n" $(echo "$NAT_COUNT * $NAT_FIXED_PRICE" | bc -l)
printf "  - データ処理費 (%.2f GB): \$%.2f/月\n" $ESTIMATED_DATA_GB $NAT_DATA_COST
printf "  - 合計: \$%.2f/月\n" $NAT_TOTAL

echo ""

# 4. S3 コスト
log_info "4. S3 コスト計算中..."

S3_STANDARD_PRICE=0.025  # USD per GB per month (first 50TB)
S3_REQUESTS_PRICE=0.0004 # USD per 1000 PUT requests
S3_GET_PRICE=0.0004      # USD per 10000 GET requests

S3_STORAGE_COST=$(echo "$STORAGE_GB * $S3_STANDARD_PRICE" | bc -l)
S3_PUT_REQUESTS=$(echo "$MONTHLY_REQUESTS * 0.1 / 1000" | bc -l)  # 10% are uploads
S3_GET_REQUESTS=$(echo "$MONTHLY_REQUESTS * 0.5 / 10000" | bc -l) # 50% are downloads
S3_REQUEST_COST=$(echo "$S3_PUT_REQUESTS * $S3_REQUESTS_PRICE + $S3_GET_REQUESTS * $S3_GET_PRICE" | bc -l)
S3_TOTAL=$(echo "$S3_STORAGE_COST + $S3_REQUEST_COST" | bc -l)

printf "S3 Storage (%.1f GB)\n" $STORAGE_GB
printf "  - ストレージ費: \$%.2f/月\n" $S3_STORAGE_COST
printf "  - リクエスト費: \$%.2f/月\n" $S3_REQUEST_COST
printf "  - 合計: \$%.2f/月\n" $S3_TOTAL

echo ""

# 5. DynamoDB コスト（アプリケーション用のみ）
log_info "5. DynamoDB コスト計算中..."

DYNAMODB_READ_PRICE=0.25   # USD per million read request units
DYNAMODB_WRITE_PRICE=1.25  # USD per million write request units
DYNAMODB_STORAGE_PRICE=0.25 # USD per GB per month

# リクエスト数の推定
DYNAMODB_READS=$(echo "$MONTHLY_REQUESTS * 2 / 1000000" | bc -l)   # 2 reads per request
DYNAMODB_WRITES=$(echo "$MONTHLY_REQUESTS * 0.5 / 1000000" | bc -l) # 0.5 writes per request
DYNAMODB_STORAGE_GB=1  # 1GB想定

DYNAMODB_READ_COST=$(echo "$DYNAMODB_READS * $DYNAMODB_READ_PRICE" | bc -l)
DYNAMODB_WRITE_COST=$(echo "$DYNAMODB_WRITES * $DYNAMODB_WRITE_PRICE" | bc -l)
DYNAMODB_STORAGE_COST=$(echo "$DYNAMODB_STORAGE_GB * $DYNAMODB_STORAGE_PRICE" | bc -l)
DYNAMODB_TOTAL=$(echo "$DYNAMODB_READ_COST + $DYNAMODB_WRITE_COST + $DYNAMODB_STORAGE_COST" | bc -l)

printf "DynamoDB (アプリケーション用のみ)\n"
printf "  - 読み取り費 (%.2f M RRU): \$%.2f/月\n" $DYNAMODB_READS $DYNAMODB_READ_COST
printf "  - 書き込み費 (%.2f M WRU): \$%.2f/月\n" $DYNAMODB_WRITES $DYNAMODB_WRITE_COST
printf "  - ストレージ費 (%d GB): \$%.2f/月\n" $DYNAMODB_STORAGE_GB $DYNAMODB_STORAGE_COST
printf "  - 合計: \$%.2f/月\n" $DYNAMODB_TOTAL
printf "  - 注意: Terraform状態ロック用DynamoDBは不要（v1.10+）\n"

echo ""

# 6. Cognito コスト
log_info "6. Cognito コスト計算中..."

COGNITO_MAU_PRICE=0.0055  # USD per MAU (Monthly Active User)
ESTIMATED_MAU=1000        # 想定月間アクティブユーザー数

COGNITO_TOTAL=$(echo "$ESTIMATED_MAU * $COGNITO_MAU_PRICE" | bc -l)

printf "Cognito (%d MAU)\n" $ESTIMATED_MAU
printf "  - 合計: \$%.2f/月\n" $COGNITO_TOTAL

echo ""

# 7. CloudWatch コスト
log_info "7. CloudWatch コスト計算中..."

CLOUDWATCH_LOGS_PRICE=0.50  # USD per GB ingested
CLOUDWATCH_METRICS_PRICE=0.30 # USD per metric per month
ESTIMATED_LOG_GB=5          # 5GB/月想定
ESTIMATED_METRICS=50        # 50メトリクス想定

CLOUDWATCH_LOGS_COST=$(echo "$ESTIMATED_LOG_GB * $CLOUDWATCH_LOGS_PRICE" | bc -l)
CLOUDWATCH_METRICS_COST=$(echo "$ESTIMATED_METRICS * $CLOUDWATCH_METRICS_PRICE" | bc -l)
CLOUDWATCH_TOTAL=$(echo "$CLOUDWATCH_LOGS_COST + $CLOUDWATCH_METRICS_COST" | bc -l)

printf "CloudWatch\n"
printf "  - ログ費 (%d GB): \$%.2f/月\n" $ESTIMATED_LOG_GB $CLOUDWATCH_LOGS_COST
printf "  - メトリクス費 (%d個): \$%.2f/月\n" $ESTIMATED_METRICS $CLOUDWATCH_METRICS_COST
printf "  - 合計: \$%.2f/月\n" $CLOUDWATCH_TOTAL

echo ""

# 8. 総コスト計算
log_info "=== 月間コスト見積もりサマリー ==="

TOTAL_COST=$(echo "$FARGATE_TOTAL + $ALB_TOTAL + $NAT_TOTAL + $S3_TOTAL + $DYNAMODB_TOTAL + $COGNITO_TOTAL + $CLOUDWATCH_TOTAL" | bc -l)

printf "ECS Fargate:        \$%8.2f\n" $FARGATE_TOTAL
printf "ALB:                \$%8.2f\n" $ALB_TOTAL
printf "NAT Gateway:        \$%8.2f\n" $NAT_TOTAL
printf "S3:                 \$%8.2f\n" $S3_TOTAL
printf "DynamoDB:           \$%8.2f\n" $DYNAMODB_TOTAL
printf "Cognito:            \$%8.2f\n" $COGNITO_TOTAL
printf "CloudWatch:         \$%8.2f\n" $CLOUDWATCH_TOTAL
printf "%s\n" "----------------------------------------"
printf "月間合計:           \$%8.2f\n" $TOTAL_COST
printf "年間合計:           \$%8.2f\n" $(echo "$TOTAL_COST * 12" | bc -l)

echo ""

# 9. コスト最適化の提案
log_info "=== コスト最適化の提案 ==="

echo "1. 開発環境では以下の最適化を検討:"
echo "   - NAT Gatewayを1つに削減: 月額約\$45削減"
echo "   - ECS Fargateタスク数を1に削減: 月額約\$$(printf "%.0f" $(echo "$FARGATE_TOTAL / 2" | bc -l))削減"
echo ""

echo "2. 本番環境でのコスト最適化:"
echo "   - S3 Intelligent Tieringの使用"
echo "   - DynamoDB Reserved Capacityの検討（予測可能な負荷の場合）"
echo "   - CloudWatch Logsの保持期間最適化"
echo ""

echo "3. 監視とアラート:"
echo "   - AWS Budgetsでコストアラートを設定"
echo "   - Cost Explorerで定期的なコスト分析"
echo "   - 未使用リソースの定期的な確認"

echo ""

# 10. レポート出力
{
    echo "AWS インフラコスト見積もりレポート"
    echo "生成日時: $(date)"
    echo "リージョン: $AWS_REGION"
    echo "想定負荷: $MONTHLY_REQUESTS リクエスト/月"
    echo ""
    echo "月間コスト内訳:"
    printf "ECS Fargate:        \$%8.2f\n" $FARGATE_TOTAL
    printf "ALB:                \$%8.2f\n" $ALB_TOTAL
    printf "NAT Gateway:        \$%8.2f\n" $NAT_TOTAL
    printf "S3:                 \$%8.2f\n" $S3_TOTAL
    printf "DynamoDB:           \$%8.2f\n" $DYNAMODB_TOTAL
    printf "Cognito:            \$%8.2f\n" $COGNITO_TOTAL
    printf "CloudWatch:         \$%8.2f\n" $CLOUDWATCH_TOTAL
    echo "----------------------------------------"
    printf "月間合計:           \$%8.2f\n" $TOTAL_COST
    printf "年間合計:           \$%8.2f\n" $(echo "$TOTAL_COST * 12" | bc -l)
} > cost-estimation-report.txt

log_info "コスト見積もり完了。詳細レポートは cost-estimation-report.txt に保存されました。"

echo ""
log_warn "注意: この見積もりは概算であり、実際の使用量や料金変更により異なる場合があります。"
log_warn "正確な見積もりには AWS Pricing Calculator の使用を推奨します。"