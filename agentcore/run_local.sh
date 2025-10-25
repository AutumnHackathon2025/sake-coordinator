#!/bin/bash

# ローカルAgentCoreサーバーを起動

echo "🍶 日本酒推薦Agent ローカルサーバー起動"
echo "========================================"
echo ""

# 環境変数の確認
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "⚠️  AWS認証情報が設定されていません"
    echo ""
    echo "以下の環境変数を設定してください:"
    echo "  export AWS_ACCESS_KEY_ID=your-key"
    echo "  export AWS_SECRET_ACCESS_KEY=your-secret"
    echo "  export AWS_REGION=us-east-1"
    echo ""
    echo "または、.envファイルを作成してください"
    echo ""
fi

# ポート8080が使用されているか確認
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "❌ ポート8080は既に使用されています"
    echo ""
    echo "使用中のプロセスを確認:"
    lsof -i :8080
    echo ""
    echo "プロセスを停止してから再実行してください"
    exit 1
fi

echo "✅ ポート8080は使用可能です"
echo ""
echo "サーバーを起動しています..."
echo "URL: http://localhost:8080"
echo ""
echo "停止するには Ctrl+C を押してください"
echo ""

# AgentCoreサーバーを起動
uv run python -m src.agent
