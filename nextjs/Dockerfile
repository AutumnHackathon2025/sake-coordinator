# syntax=docker/dockerfile:1
# Next.js用のマルチステージDockerfile
FROM node:22-alpine AS base

# pnpmをインストール
RUN npm install -g pnpm

# 依存関係インストール段階
FROM base AS deps
WORKDIR /app

# 本番用依存関係のみをインストール
# pnpmキャッシュとnpmキャッシュ、依存関係ファイルをマウント
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    --mount=type=bind,source=package.json,target=/app/package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=/app/pnpm-lock.yaml \
    pnpm install --frozen-lockfile --prod

# ビルド段階
FROM base AS builder
WORKDIR /app

# 依存関係をインストールしてビルド実行
# pnpmキャッシュ、Next.jsキャッシュ、ソースコードをマウント
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    --mount=type=cache,target=/app/.next/cache \
    --mount=type=bind,source=package.json,target=/app/package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=/app/pnpm-lock.yaml \
    --mount=type=bind,source=src,target=/app/src \
    --mount=type=bind,source=public,target=/app/public \
    --mount=type=bind,source=next.config.ts,target=/app/next.config.ts \
    --mount=type=bind,source=tsconfig.json,target=/app/tsconfig.json \
    --mount=type=bind,source=postcss.config.mjs,target=/app/postcss.config.mjs \
    pnpm install --frozen-lockfile && \
    pnpm build

# 実行段階
FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app

COPY ./public ./public
# ビルド成果物をコピー
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# distrolessは非rootユーザー（nobody）をデフォルトで使用
USER nobody

# ポートを公開
EXPOSE 3000

# 環境変数を設定
ENV PORT=3000
ENV NODE_ENV=production

# アプリケーションを起動
CMD ["server.js"]