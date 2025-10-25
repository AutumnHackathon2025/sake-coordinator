# マルチステージビルド: 共通ベースイメージ
FROM python:3.11-slim as base

# 作業ディレクトリを設定
WORKDIR /app

# システムの依存関係をインストール
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# uvをインストール
RUN pip install uv

# 非rootユーザーを作成
RUN useradd --create-home --shell /bin/bash app

# プロジェクトファイルをコピー
COPY pyproject.toml ./
COPY uv.lock* ./
COPY README.md ./

# ソースコードをコピー
COPY src/ ./src/
COPY config/ ./config/

# 所有権を変更
RUN chown -R app:app /app

# 本番用ステージ
FROM base as production

USER app

# 本番用依存関係のみインストール
RUN uv sync --frozen --no-dev

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# ポートを公開
EXPOSE 8000

# エントリーポイント
CMD ["uv", "run", "python", "-m", "src.agent"]

# 開発用ステージ
FROM base as development

USER app

# 開発用依存関係も含めてインストール
RUN uv sync --frozen --extra dev

# ポートを公開（デバッグポート含む）
EXPOSE 8000 5678

# 開発用エントリーポイント
CMD ["uv", "run", "python", "-m", "src.agent"]