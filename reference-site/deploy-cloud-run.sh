#!/usr/bin/env bash
#
# Deploy CoachX to Google Cloud Run.
#
#   ./deploy-cloud-run.sh
#
# Reads configuration from .env.local (never committed) and passes the
# NEXT_PUBLIC_* values as BUILD args — they are inlined into the client bundle
# at build time, so setting them only as runtime env vars would ship a bundle
# with the wrong (or empty) Firebase config.
#
# Requires: gcloud CLI, an authenticated account, a project with billing on.

set -euo pipefail

# ---- Configuration ---------------------------------------------------------
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-asia-south1}"          # Mumbai — closest to an Indian audience
SERVICE="${SERVICE:-coachx}"
ENV_FILE="${ENV_FILE:-.env.local}"

if [[ -z "$PROJECT_ID" || "$PROJECT_ID" == "(unset)" ]]; then
  echo "ERROR: no project set. Run: gcloud config set project YOUR_PROJECT_ID" >&2
  exit 1
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. Copy .env.example and fill it in." >&2
  exit 1
fi

# ---- Read env file ---------------------------------------------------------
# Only KEY=VALUE lines; comments and blanks ignored.
#
# `|| true` matters: a missing key makes grep exit 1, and under `set -euo
# pipefail` that aborts the whole script at the assignment — silently, since
# grep prints nothing. Optional keys (NEXT_PUBLIC_SITE_URL) must return empty
# so the `${VAR:-default}` fallbacks below can do their job.
get() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- | sed 's/^["'\'']//;s/["'\'']$//' || true; }

AUTH_SECRET="$(get AUTH_SECRET)"
ADMIN_EMAILS="$(get ADMIN_EMAILS)"
SITE_URL="${NEXT_PUBLIC_SITE_URL:-$(get NEXT_PUBLIC_SITE_URL)}"
SITE_URL="${SITE_URL:-https://coachx.tamilbusinesstribe.com}"

for key in AUTH_SECRET; do
  if [[ -z "${!key}" ]]; then echo "ERROR: $key is empty in $ENV_FILE" >&2; exit 1; fi
done

BUILD_ARGS=""
for key in \
  NEXT_PUBLIC_FIREBASE_API_KEY \
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
  NEXT_PUBLIC_FIREBASE_PROJECT_ID \
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
  NEXT_PUBLIC_FIREBASE_APP_ID \
  NEXT_PUBLIC_FIREBASE_STORAGE_ENABLED
do
  BUILD_ARGS="${BUILD_ARGS}_${key}=$(get "$key"),"
done
BUILD_ARGS="${BUILD_ARGS}_NEXT_PUBLIC_SITE_URL=${SITE_URL}"

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/coachx/${SERVICE}:$(date +%Y%m%d-%H%M%S)"

echo "project : $PROJECT_ID"
echo "region  : $REGION"
echo "service : $SERVICE"
echo "image   : $IMAGE"
echo

# ---- One-time setup (idempotent) -------------------------------------------
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  --project "$PROJECT_ID"

gcloud artifacts repositories describe coachx --location "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1 || \
  gcloud artifacts repositories create coachx \
    --repository-format=docker --location "$REGION" \
    --description="CoachX container images" --project "$PROJECT_ID"

# ---- Build (Cloud Build — no local Docker needed) --------------------------
gcloud builds submit \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --config cloudbuild.yaml \
  --substitutions "_IMAGE=${IMAGE},${BUILD_ARGS}" \
  .

# ---- Deploy ----------------------------------------------------------------
# max-instances=1 is DELIBERATE: server state lives in .data/*.json on the
# container filesystem, so a second instance would have its own separate copy —
# a user who signs up on one could not log in via the other. Remove this cap
# only after the stores move to Firestore. See DEPLOY-CLOUD-RUN.md.
gcloud run deploy "$SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --image "$IMAGE" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 \
  --memory 1Gi \
  --min-instances 0 \
  --max-instances 1 \
  --concurrency 80 \
  --timeout 300 \
  --set-env-vars "AUTH_SECRET=${AUTH_SECRET},ADMIN_EMAILS=${ADMIN_EMAILS},NEXT_PUBLIC_SITE_URL=${SITE_URL},NODE_ENV=production"

echo
gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" \
  --format 'value(status.url)'
