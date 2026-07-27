# Firebase integration — setup & verification

Everything in the codebase is wired and waiting. The only missing piece is
**credentials for the real Firebase project**, which cannot be obtained from
this environment (`firebase login` is an interactive browser flow, and the web
config values live in your console).

## Status

| Piece | State |
| --- | --- |
| SDK initialization (`lib/firebase.ts`) | ✅ built — app/auth/firestore/storage, HMR-safe, `isFirebaseConfigured` guard |
| AuthContext (`components/auth/AuthProvider.tsx`) | ✅ built — register, login, logout, forgot password, `browserLocalPersistence`, server-session bridge |
| Firestore rules (`firestore.rules`) | ✅ written — role/status from `users/{uid}`, no self-escalation |
| Firestore indexes (`firestore.indexes.json`) | ✅ written |
| Storage rules (`storage.rules`) | ✅ written — owner-scoped, type/size limited, admin check identical to Firestore's |
| Storage upload feature | ✅ built — `lib/storage.ts` + `/profile` (avatar + private files) |
| `/profile` route | ✅ built (previously middleware-protected but missing → 404) |
| Firebase E2E suite (`tests/e2e/firebase.spec.ts`) | ✅ written — 16 real tests, **no skips** |
| Verifier (`scripts/firebase-verify.mjs`) | ✅ built — checks all 18 requirements against the live project |
| **Live project connection** | ❌ **blocked — needs your credentials** |

## What I need from you

Either path works.

### Path A — give me CLI access (unlocks everything)

Run this yourself in the session (the `!` prefix runs it here):

```
! npx firebase-tools login
```

Then tell me the project ID, or run `npx firebase-tools projects:list`.

### Path B — paste the web config

Firebase console → ⚙ Project settings → General → Your apps → SDK setup and
configuration → **Config**. Send me the six values, or create the file yourself:

```bash
cd reference-site
cp .env.example .env.local
# then fill in the NEXT_PUBLIC_FIREBASE_* values
```

With Path B you'll also need to do three console toggles I can't reach:

1. **Authentication** → Sign-in method → enable **Email/Password**
2. **Firestore Database** → Create database
3. **Storage** → Get started (creates the default bucket)

## Then — one command each

```bash
cd reference-site

# 1. Deploy rules + indexes (needs `firebase login`)
npm run firebase:deploy-rules

# 2. Verify the live integration — prints PASS/FAIL for all 18 requirements
npm run firebase:verify

# 3. Run everything, including the now-active firebase E2E project
npm run build
npx playwright test
```

`npm run firebase:verify` exercises the real backend: it registers a throwaway
user, writes and reads their Firestore profile, **asserts that role
self-escalation is rejected**, writes an assessment result, uploads to Storage,
asserts cross-user writes are rejected, logs out, logs back in, and sends a
password-reset email — then deletes the temp user. It exits non-zero on any
failure, so it is safe to gate CI on.

## Why the Firebase tests aren't "skipped"

There are now **zero `test.skip`** anywhere in the suite. `tests/e2e/firebase.spec.ts`
is registered as its own Playwright project, and `playwright.config.ts` only
adds that project when real credentials are present. Without them the tests
cannot pass — they register users and upload files against a live backend — and
silently skipping them mid-run would report a green suite that verified nothing.
The config prints a loud warning instead. The moment `.env.local` exists, the
project activates and the tests run for real.
