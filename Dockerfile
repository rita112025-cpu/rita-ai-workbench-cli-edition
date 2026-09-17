# node:22-slim 為基底（runtime 與 build script 都需要 node），
# 再從 oven/bun 映像借 bun 進來執行 bun install（遵守 bun.lock）
FROM node:22-slim AS base
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun
COPY --from=oven/bun:1 /usr/local/bin/bunx /usr/local/bin/bunx
WORKDIR /app

# ---- 安裝依賴 ----
FROM base AS deps
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

# ---- 建置 ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Prisma 需要 DATABASE_URL 才能 generate（應用程式本身目前沒用到 DB）
RUN bun run db:generate \
  && node node_modules/next/dist/bin/next build \
  && cp -r .next/static .next/standalone/.next/ \
  && cp -r public .next/standalone/

# ---- 執行 ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0
COPY --from=builder /app/.next/standalone ./
EXPOSE 3000
CMD ["node", "server.js"]
