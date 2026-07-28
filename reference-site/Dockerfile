# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────────
# CoachX — container image for Google Cloud Run
#
# Multi-stage so the shipped image contains no source, no dev dependencies and
# no build cache: only Next's traced `standalone` output plus static assets.
#
# IMPORTANT — the NEXT_PUBLIC_* values are BUILD-TIME, not runtime. Next inlines
# them into the client bundle during `next build`, so setting them as Cloud Run
# env vars alone does nothing: the browser bundle would still carry whatever was
# present at build. They are passed as --build-arg (see deploy.sh) instead.
# ─────────────────────────────────────────────────────────────────────────────

# ---- 1. Dependencies --------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `npm ci` is reproducible and fails loudly if the lockfile is out of sync.
RUN npm ci

# ---- 2. Build ---------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_ENABLED
ARG NEXT_PUBLIC_SITE_URL

ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
    NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID \
    NEXT_PUBLIC_FIREBASE_STORAGE_ENABLED=$NEXT_PUBLIC_FIREBASE_STORAGE_ENABLED \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- 3. Runtime -------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0

# Run unprivileged. Cloud Run does not require it, but a container that never
# needs root should never have it.
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# `standalone` already contains the traced node_modules and server.js.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# The file-backed stores write here. On Cloud Run this is an in-memory tmpfs
# that is per-instance and does NOT survive a restart — see DEPLOY-CLOUD-RUN.md.
RUN mkdir -p /app/.data && chown nextjs:nodejs /app/.data

USER nextjs
EXPOSE 8080

# Cloud Run injects $PORT; server.js reads it. Exec form so Node receives
# SIGTERM directly and shuts down cleanly instead of being killed.
CMD ["node", "server.js"]
