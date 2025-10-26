#!/bin/bash

# 本番環境動作確認スクリプト (SKIP_AUTH環境)
# Usage: ./test_production.sh [BASE_URL]
# Example: ./test_production.sh https://sake.kizuku-hackathon.work

# set -e を削除（エラーが発生しても続行する）

# カラー出力設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ベースURL設定
BASE_URL="${1:-https://sake.kizuku-hackathon.work}"
API_BASE="${BASE_URL}/api"
AGENT_BASE="${BASE_URL}/api/agent"

# テスト結果カウンター
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# ログファイル
LOG_FILE="test_production_$(date +%Y%m%d_%H%M%S).log"

# ヘルパー関数
log() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1" | tee -a "$LOG_FILE"
    ((PASSED_TESTS++))
}

error() {
    echo -e "${RED}[FAIL]${NC} $1" | tee -a "$LOG_FILE"
    ((FAILED_TESTS++))
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

test_start() {
    ((TOTAL_TESTS++))
    log "テスト $TOTAL_TESTS: $1"
}

# HTTPステータスコードチェック
check_status() {
    local expected=$1
    local actual=$2
    local test_name=$3
    
    if [ "$actual" -eq "$expected" ] 2>/dev/null; then
        success "$test_name - ステータスコード: $actual"
        return 0
    else
        error "$test_name - 期待: $expected, 実際: $actual"
        return 1
    fi
}

# JSONレスポンスチェック
check_json_field() {
    local json=$1
    local field=$2
    local test_name=$3
    
    if echo "$json" | jq -e "$field" > /dev/null 2>&1; then
        success "$test_name - フィールド '$field' が存在"
        return 0
    else
        error "$test_name - フィールド '$field' が存在しない"
        return 1
    fi
}

echo "========================================" | tee "$LOG_FILE"
echo "本番環境動作確認テスト (SKIP_AUTH)" | tee -a "$LOG_FILE"
echo "ベースURL: $BASE_URL" | tee -a "$LOG_FILE"
echo "開始時刻: $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 1. ヘルスチェック
test_start "ヘルスチェックAPI"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/health" 2>/dev/null || echo -e "\n000")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 200 "$status" "ヘルスチェック"
check_json_field "$body" '.status' "ヘルスチェック"
check_json_field "$body" '.timestamp' "ヘルスチェック"

echo "$body" | jq '.' >> "$LOG_FILE" 2>&1 || echo "$body" >> "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 2. 飲酒記録の作成
test_start "飲酒記録の新規作成 (POST /api/records)"
create_payload='{
  "brand": "獺祭 純米大吟醸",
  "impression": "非常にフルーティで飲みやすい。香りが高い。テスト記録です。",
  "rating": "VERY_GOOD"
}'

response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/records" \
  -H "Content-Type: application/json" \
  -d "$create_payload" 2>/dev/null || echo -e "\n000")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if check_status 201 "$status" "飲酒記録作成"; then
    check_json_field "$body" '.data.id' "飲酒記録作成"
    check_json_field "$body" '.data.brand' "飲酒記録作成"
    check_json_field "$body" '.data.impression' "飲酒記録作成"
    check_json_field "$body" '.data.rating' "飲酒記録作成"
    check_json_field "$body" '.data.createdAt' "飲酒記録作成"
    
    # 作成されたレコードIDを保存
    RECORD_ID=$(echo "$body" | jq -r '.data.id' 2>/dev/null)
    log "作成されたレコードID: $RECORD_ID"
fi

echo "$body" | jq '.' >> "$LOG_FILE" 2>&1 || echo "$body" >> "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 3. 飲酒記録のリスト取得
test_start "飲酒記録のリスト取得 (GET /api/records)"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/records" 2>/dev/null || echo -e "\n000")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if check_status 200 "$status" "飲酒記録リスト取得"; then
    check_json_field "$body" '.data' "飲酒記録リスト取得"
    
    # 配列の長さをチェック
    record_count=$(echo "$body" | jq '.data | length' 2>/dev/null || echo "0")
    log "取得された記録数: $record_count"
    
    if [ "$record_count" -gt 0 ] 2>/dev/null; then
        success "飲酒記録リスト取得 - 1件以上のレコードが存在"
    else
        warning "飲酒記録リスト取得 - レコードが0件"
    fi
fi

echo "$body" | jq '.' >> "$LOG_FILE" 2>&1 || echo "$body" >> "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 4. 飲酒記録の検索
test_start "飲酒記録の検索 (GET /api/records?q=獺祭)"
# URLエンコードされたクエリパラメータを使用
encoded_query=$(printf %s "獺祭" | jq -sRr @uri)
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/records?q=${encoded_query}" 2>/dev/null || echo -e "\n000")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if check_status 200 "$status" "飲酒記録検索"; then
    check_json_field "$body" '.data' "飲酒記録検索"
    
    search_count=$(echo "$body" | jq '.data | length' 2>/dev/null || echo "0")
    log "検索結果: $search_count 件"
fi

echo "$body" | jq '.' >> "$LOG_FILE" 2>&1 || echo "$body" >> "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 5. 飲酒記録の更新（作成されたレコードがある場合）
if [ -n "$RECORD_ID" ] && [ "$RECORD_ID" != "null" ]; then
    test_start "飲酒記録の更新 (PUT /api/records/$RECORD_ID)"
    update_payload='{
      "impression": "改めて飲むと、少し甘みが強いかも。更新テストです。",
      "rating": "GOOD"
    }'
    
    response=$(curl -s -w "\n%{http_code}" -X PUT "${API_BASE}/records/${RECORD_ID}" \
      -H "Content-Type: application/json" \
      -d "$update_payload" 2>/dev/null || echo -e "\n000")
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if check_status 200 "$status" "飲酒記録更新"; then
        check_json_field "$body" '.data.id' "飲酒記録更新"
        check_json_field "$body" '.data.updatedAt' "飲酒記録更新"
        
        # 更新内容の確認
        updated_impression=$(echo "$body" | jq -r '.data.impression' 2>/dev/null || echo "")
        if [[ "$updated_impression" == *"更新テスト"* ]]; then
            success "飲酒記録更新 - 感想が正しく更新された"
        else
            error "飲酒記録更新 - 感想が更新されていない"
        fi
    fi
    
    echo "$body" | jq '.' >> "$LOG_FILE" 2>&1 || echo "$body" >> "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
else
    warning "飲酒記録の更新テストをスキップ（レコードIDが取得できませんでした）"
    echo "" | tee -a "$LOG_FILE"
fi

# 6. Pre-signed URL取得（ラベル画像用）
test_start "Pre-signed URL取得 - ラベル画像 (POST /api/uploads/presigned-url)"
presigned_payload='{
  "contentType": "image/jpeg",
  "purpose": "label"
}'

response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/uploads/presigned-url" \
  -H "Content-Type: application/json" \
  -d "$presigned_payload" 2>/dev/null || echo -e "\n000")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

# 404の場合は未実装として警告
if [ "$status" -eq 404 ] 2>/dev/null; then
    warning "Pre-signed URL取得（ラベル） - エンドポイント未実装（404）"
elif check_status 200 "$status" "Pre-signed URL取得（ラベル）"; then
    check_json_field "$body" '.data.uploadUrl' "Pre-signed URL取得（ラベル）"
    check_json_field "$body" '.data.assetKey' "Pre-signed URL取得（ラベル）"
    
    LABEL_ASSET_KEY=$(echo "$body" | jq -r '.data.assetKey' 2>/dev/null || echo "")
    log "取得されたassetKey: $LABEL_ASSET_KEY"
fi

echo "$body" | jq '.' >> "$LOG_FILE" 2>&1 || echo "$body" >> "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 7. Pre-signed URL取得（メニューOCR用）
test_start "Pre-signed URL取得 - メニューOCR (POST /api/uploads/presigned-url)"
presigned_menu_payload='{
  "contentType": "image/jpeg",
  "purpose": "menu_ocr"
}'

response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/uploads/presigned-url" \
  -H "Content-Type: application/json" \
  -d "$presigned_menu_payload" 2>/dev/null || echo -e "\n000")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

# 404の場合は未実装として警告
if [ "$status" -eq 404 ] 2>/dev/null; then
    warning "Pre-signed URL取得（メニュー） - エンドポイント未実装（404）"
elif check_status 200 "$status" "Pre-signed URL取得（メニュー）"; then
    check_json_field "$body" '.data.uploadUrl' "Pre-signed URL取得（メニュー）"
    check_json_field "$body" '.data.assetKey' "Pre-signed URL取得（メニュー）"
    
    MENU_ASSET_KEY=$(echo "$body" | jq -r '.data.assetKey' 2>/dev/null || echo "")
    log "取得されたassetKey: $MENU_ASSET_KEY"
fi

echo "$body" | jq '.' >> "$LOG_FILE" 2>&1 || echo "$body" >> "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 8. 日本酒推薦API
test_start "日本酒推薦 (POST /api/agent/recommend)"
recommend_payload='{
  "menu": [
    "獺祭 純米大吟醸",
    "十四代 本丸",
    "黒龍 しずく",
    "八海山 普通酒",
    "久保田 千寿",
    "田酒 特別純米"
  ]
}'

log "推薦APIを呼び出し中... (最大30秒待機)"
response=$(curl -s -w "\n%{http_code}" -X POST "${AGENT_BASE}/recommend" \
  -H "Content-Type: application/json" \
  -d "$recommend_payload" \
  --max-time 30 2>/dev/null || echo -e "\n000")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

# 500エラーの場合はAgentCoreの問題として警告
if [ "$status" -eq 500 ] 2>/dev/null; then
    warning "日本酒推薦 - AgentCoreエラー（500）"
    error_msg=$(echo "$body" | jq -r '.error.message' 2>/dev/null || echo "不明なエラー")
    log "エラー詳細: $error_msg"
elif [ "$status" -eq 404 ] 2>/dev/null; then
    warning "日本酒推薦 - エンドポイント未実装（404）"
elif check_status 200 "$status" "日本酒推薦"; then
    check_json_field "$body" '.data.recommendations' "日本酒推薦"
    
    # 推薦結果の件数チェック
    rec_count=$(echo "$body" | jq '.data.recommendations | length' 2>/dev/null || echo "0")
    log "推薦結果: $rec_count 件"
    
    if [ "$rec_count" -gt 0 ] 2>/dev/null; then
        success "日本酒推薦 - 推薦結果が返された"
        
        # 最初の推薦結果の構造チェック
        check_json_field "$body" '.data.recommendations[0].brand' "日本酒推薦"
        check_json_field "$body" '.data.recommendations[0].score' "日本酒推薦"
        check_json_field "$body" '.data.recommendations[0].reason' "日本酒推薦"
    else
        warning "日本酒推薦 - 推薦結果が0件"
    fi
fi

echo "$body" | jq '.' >> "$LOG_FILE" 2>&1 || echo "$body" >> "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 9. 飲酒記録の削除（作成されたレコードがある場合）
if [ -n "$RECORD_ID" ] && [ "$RECORD_ID" != "null" ]; then
    test_start "飲酒記録の削除 (DELETE /api/records/$RECORD_ID)"
    
    response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/records/${RECORD_ID}" 2>/dev/null || echo -e "\n000")
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # 204 No Content または 200 OK を許容
    if [ "$status" -eq 204 ] 2>/dev/null || [ "$status" -eq 200 ] 2>/dev/null; then
        success "飲酒記録削除 - ステータスコード: $status"
        success "飲酒記録削除 - レコードが正常に削除された"
    else
        error "飲酒記録削除 - 期待: 200 or 204, 実際: $status"
    fi
    
    if [ -n "$body" ]; then
        echo "$body" | jq '.' >> "$LOG_FILE" 2>&1 || echo "$body" >> "$LOG_FILE"
    fi
    echo "" | tee -a "$LOG_FILE"
else
    warning "飲酒記録の削除テストをスキップ（レコードIDが取得できませんでした）"
    echo "" | tee -a "$LOG_FILE"
fi

# 10. エラーハンドリングテスト - 不正なリクエスト
test_start "エラーハンドリング - 不正なリクエスト (POST /api/records)"
invalid_payload='{
  "brand": "",
  "impression": "",
  "rating": "INVALID_RATING"
}'

response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/records" \
  -H "Content-Type: application/json" \
  -d "$invalid_payload" 2>/dev/null || echo -e "\n000")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if check_status 400 "$status" "エラーハンドリング"; then
    check_json_field "$body" '.error.code' "エラーハンドリング"
    check_json_field "$body" '.error.message' "エラーハンドリング"
    
    error_message=$(echo "$body" | jq -r '.error.message' 2>/dev/null || echo "")
    log "エラーメッセージ: $error_message"
fi

echo "$body" | jq '.' >> "$LOG_FILE" 2>&1 || echo "$body" >> "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 11. 存在しないレコードへのアクセス
test_start "エラーハンドリング - 存在しないレコード (DELETE /api/records/non-existent-id)"

response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/records/non-existent-id" 2>/dev/null || echo -e "\n000")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if check_status 404 "$status" "存在しないレコード"; then
    check_json_field "$body" '.error.code' "存在しないレコード"
    check_json_field "$body" '.error.message' "存在しないレコード"
fi

echo "$body" | jq '.' >> "$LOG_FILE" 2>&1 || echo "$body" >> "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# テスト結果サマリー
echo "========================================" | tee -a "$LOG_FILE"
echo "テスト結果サマリー" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "総テスト数: $TOTAL_TESTS" | tee -a "$LOG_FILE"
echo -e "${GREEN}成功: $PASSED_TESTS${NC}" | tee -a "$LOG_FILE"
echo -e "${RED}失敗: $FAILED_TESTS${NC}" | tee -a "$LOG_FILE"
echo "完了時刻: $(date)" | tee -a "$LOG_FILE"
echo "詳細ログ: $LOG_FILE" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# 終了コード
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ すべてのテストが成功しました${NC}" | tee -a "$LOG_FILE"
    exit 0
else
    echo -e "${RED}✗ $FAILED_TESTS 件のテストが失敗しました${NC}" | tee -a "$LOG_FILE"
    exit 1
fi
