# Deploying CoachX to Google Cloud Run

## ⚠️ Read this first — server state does not survive on Cloud Run

Eight modules persist state as JSON files under `.data/`:

| File | Written by | What is lost |
| --- | --- | --- |
| `users.json` | signup / login | **every account created after deploy** |
| `reset-tokens.json` | forgot password | **password-reset links stop validating** |
| `submissions.json` | leads, bookings, assessments | every enquiry and booking request |
| `cms.json` | admin CMS | hero/program edits revert to the seed |
| `roles.json` | admin RBAC | role assignments |
| `audit.json` | admin actions | the audit trail |
| `leads.json` | lead forms | captured leads |
| `niche-emails.json` | email outbox | queued mail |

Cloud Run's filesystem is an **in-memory tmpfs, private to each container
instance**. Two consequences:

1. **It is erased on every restart** — a new revision, a scale-to-zero, or a
   routine instance recycle. A user who signs up in the morning cannot log in
   after the instance turns over.
2. **Instances do not share it.** With two instances, a signup that lands on
   instance A is invisible to instance B, so login fails roughly half the time.

`deploy-cloud-run.sh` therefore pins `--max-instances 1`, which removes problem
2 but **not problem 1**. That is acceptable for a demo or a marketing site where
nothing is written; it is not acceptable for real signups.

### The fix

The stores were written to be swappable — `lib/auth/users.ts`, `lib/cms/store.ts`
and friends all follow one read-all → mutate → write-all shape behind a narrow
API, and the route/guard layers above them never touch the filesystem. Moving
them to **Firestore** (already connected as `coachx-c15c4`) means rewriting those
eight modules' internals only.

Until that happens, treat a Cloud Run deployment as **read-only in practice**.

---

## What you need

- A Google Cloud project with **billing enabled** (Cloud Run has a free tier, but
  the project still needs a billing account attached).
- The `gcloud` CLI: <https://cloud.google.com/sdk/docs/install>
- `reference-site/.env.local`, filled in. It is never committed and never enters
  the image — the deploy script reads it and passes values through.

Docker is **not** required: the image is built by Cloud Build.

## Deploy

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

cd reference-site
bash deploy-cloud-run.sh
```

The script is idempotent — it enables the required APIs, creates the Artifact
Registry repo if missing, builds, deploys, and prints the service URL.

Override defaults with environment variables:

```bash
REGION=asia-south1 SERVICE=coachx bash deploy-cloud-run.sh
```

`asia-south1` (Mumbai) is the default, being closest to an Indian audience.

## Why NEXT_PUBLIC_* are build args, not env vars

Next.js **inlines** `NEXT_PUBLIC_*` into the client bundle during `next build`.
Setting them only as Cloud Run runtime env vars does nothing for the browser: the
bundle already shipped with whatever was present at build time, so Firebase would
initialise with placeholder config and every client call would fail.

They are passed as `--build-arg` (see `Dockerfile` and `cloudbuild.yaml`).
Server-only secrets — `AUTH_SECRET`, `ADMIN_EMAILS` — are runtime env vars and
are never baked into the image.

**Changing a `NEXT_PUBLIC_*` value requires a rebuild, not just a redeploy.**

## Custom domain

```bash
gcloud beta run domain-mappings create \
  --service coachx --domain coachx.tamilbusinesstribe.com --region asia-south1
```

Then add the CNAME it prints to the `tamilbusinesstribe.com` DNS zone. The site
already advertises that origin (`brand.url` in `lib/site.ts`), so no code change
is needed once DNS resolves.

## After deploying

Add the Cloud Run URL (and the custom domain) to **Firebase console → Authentication
→ Settings → Authorized domains**, or Firebase login will be rejected from the
deployed origin.

## Verifying

```bash
gcloud run services describe coachx --region asia-south1 --format 'value(status.url)'
gcloud run services logs read coachx --region asia-south1 --limit 50
```

## Cost

Cloud Run bills per request and per container-second, and scales to zero. With
`--min-instances 0` an idle service costs nothing; the trade-off is a cold start
of roughly 1–3 seconds on the first request. Set `--min-instances 1` to remove
that, at the cost of paying for one always-warm instance.
