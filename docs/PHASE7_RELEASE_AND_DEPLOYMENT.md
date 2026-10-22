# FOODROUTE 2.0 — Phase 7 release, security and deployment runbook

**Release candidate, not a deployed production release.** Phase 7 adds a Cloud Run API entry point, an HTTPS-only browser client mode, a Firebase Hosting SPA template, CI quality gates, read-only health smoke checks, browser test templates, and deployment documentation. **It does not publish anything, enable billing, change Firestore rules, or verify real payments.** The local API continues to work exactly as before.

## 0. Required preconditions / release blockers

1. **Never deploy live while testing actual customer data.** Use separate staging and production Firebase/Google Cloud projects, test accounts, simulated deliveries and non-sensitive sample coordinates. Verify backup/restore, privacy notices, service area, cancellations/reassignment and actual operational procedures.
2. Full frontend build, Cloud Run image build, Firebase Rules Emulator, browser tests and 4-role workflows must all pass. CI status must be green. The *source-only* archive may contain changes from earlier phases that differ from your current local project. Merge, do not replace your project wholesale.
3. **Production API remains a release candidate.** App Check, distributed abuse prevention (API gateway/WAF/quotas), observability, secret rotation, incident response, retention policies, and payment reconciliation must be added/verified before broad real-world use. The local rate limiter is per instance only.
4. The admin restaurant-approval callable functions in `services/functions/src/index.ts` are **separate** from the new Cloud Run API and must be deployed and tested on staging. Rider approvals were previously local scripts; an approved production-grade onboarding/review workflow is still required. Do not expose local bootstrap scripts publicly.
5. The public OSRM demonstration route and external address-search endpoints are deliberately **disabled** in the production API. The DAA demo does not constitute safe real-time navigation. Choose a contracted provider and implement consent, quotas, cache limits and deletion policies before enabling production geocoding/road-time features.
6. Payment remains COD-only, with order value ≠ verified revenue. Email/push notifications are not persistent; the bell reflects in-session Firestore updates. No live GPS tracking or independently verified ETAs.
7. **Cloud Run requires billing-enabled infrastructure**. Do not upgrade billing without the project's authorized owner evaluating cost exposure, setting alerts/quotas and explicitly approving the upgrade. Firebase Hosting can be used under Spark limits, but with no hosted order backend the production frontend will not complete ordering/dispatch.
8. Rotate any credentials/API tokens that were ever exposed publicly or included in earlier repository history. Never commit `.env.local`, Google service-account JSON, OAuth client secrets, or `FOODROUTE_PREVIEW_SIGNING_KEY`.

## 1. Install Phase 7 overlay safely

From `C:\Users\ANIMESH\Desktop\FOODROUTE`:

```powershell
# Make a backup or save a commit first.
git status
git add .
git commit -m "Checkpoint before Phase 7"  # ONLY after confirming gitignore & no secrets are staged
```

Extract the Phase 7 ZIP into a temporary folder first and merge its paths into FOODROUTE. It should not overwrite `.env.local`, `firebase.json`, Firebase rules, restaurant/order data, or your Floating Food homepage. Resolve conflicts in `order.service.ts`, `dispatch.service.ts` and `optimized-core.ts` if your local files have new edits.

## 2. Automated checks on Windows

Run these from the repository root:

```powershell
node scripts/phase7-audit.cjs
node --test tests/phase7-release.test.cjs

cd apps\web
npm ci
npm run typecheck
npm run test:unit
npm run build

cd ..\..\services\functions
npm ci
npm run typecheck
npm run test:release

cd ..\..\packages\routing-engine
npm ci
npm test

cd ..\..
npx firebase-tools emulators:exec --config firebase.phase7.example.json --only firestore --project demo-foodroute-phase3 'npm --prefix apps/web run test:rules'
```

If you use Git, merge `.gitignore.phase7.additions` into the existing root `.gitignore` before staging files. The repository includes a GitHub Actions workflow `.github/workflows/foodroute-ci.yml` to run these checks on pull requests and pushes to `main`, but **not auto-deploy**. The Firestore emulator step requires Java; CI installs Java 21.

If `npm ci` says the lockfile differs from package.json, run `npm install` within that package, inspect its new lockfile, rerun tests, and commit the reviewed lockfile. Do not ignore a failed test or force success.

## 3. Browser E2E and responsive testing

From `qa/browser`: `npm install`, `npx playwright install chromium`, `npm test`. Set `FOODROUTE_WEB_URL=http://127.0.0.1:5173` if your development server URL differs. Run role tests only against emulator/staging using **disposable accounts** supplied through `FOODROUTE_TEST_CUSTOMER_EMAIL` / `_PASSWORD` (similarly `ADMIN`, `RESTAURANT`, `RIDER`). Missing accounts are skipped, never called "passed".

Manually inspect at 375, 390, 768, 1024, 1440 px and keyboard-only navigation: floating food homepage, signup/login, 4 dashboard sidebars, table horizontal overflow, checkout, restaurant location pin, menu editor, rider offer, admin optimized dispatch, notifications bell and chart. Check focus order, contrast, dialog keyboard dismissal and reduced-motion setting. Playwright smoke coverage is **not** a full visual regression test.

## 4. Mandatory end-to-end test matrix in isolated staging

| Scenario | Expected |
|---|---|
| Customer signs in | `/customer/dashboard`; cannot read other customers' orders |
| Restaurant signs in | `/restaurant/dashboard`; cannot edit other restaurants |
| Rider signs in | `/rider/dashboard`; cannot accept another rider's route |
| Administrator signs in | `/admin/dashboard`; customer URLs cannot access privileged routes |
| Customer checkout | New COD order created with trusted menu price and confirmed test pin |
| Restaurant changes status | Status transitions obey authorized workflow |
| Admin route preview | Stale pin/order/rider produces rejection, not silent assignment |
| Admin route commit | All orders assigned exactly once atomically |
| Parallel competing commits | Exactly one wins; no double-reservation |
| Rider declines | All reserved test orders released; rider available |
| Rider accepts/pickup/drops | Correct sequence for multi-stop; final status delivered |
| Multiple riders | Respect capacity, no duplicate orders, no cross-account leakage |
| Notifications | Only role-authorized order/route events, no sensitive details leaked |
| Analytics | COD *order value*, not cash received; privacy-minimized export |
| Failure paths | Invalid token 401, wrong role 403, blocked CORS, stale quote/preview, offline API |

Test write paths only with disposable test documents. Confirm Firestore Rules Emulator tests are green. Save screenshots with sensitive data redacted. The read-only `scripts/phase7-smoke.mjs` checks health, anonymous 401 and bad-origin 403 but cannot prove checkout or dispatch.

## 5. Configure production hosting (after release blockers are addressed)

The template `firebase.phase7.example.json` provides a Vite SPA rewrite `** → /index.html`, immutable asset caching, and basic browser security headers. **Do not simply overwrite your current `firebase.json`:** merge the template's `hosting` section and preserve current rules, indexes and emulator sections. You may choose to invoke the template explicitly via `--config firebase.phase7.example.json` to avoid overwriting local settings.

Configure your frontend build environment using the public Firebase web app identifiers from *your deployment target*, and **never** put Admin SDK or private signing secrets in the Vite environment:

```ini
# apps/web/.env.production (untracked)
VITE_FIREBASE_API_KEY=<public web app identifier>
VITE_FIREBASE_AUTH_DOMAIN=<staging-auth-domain>
VITE_FIREBASE_PROJECT_ID=<staging-project-id>
VITE_FIREBASE_APP_ID=<public web app id>
VITE_FIREBASE_STORAGE_BUCKET=<staging-bucket-if-needed>
VITE_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
VITE_ORDER_API_MODE=cloudrun
VITE_ORDER_API_BASE_URL=https://YOUR-APPROVED-HOSTED-API-ORIGIN
VITE_USE_FIREBASE_EMULATORS=false
```

Build via `cd apps/web; npm run build; cd ../..`. After the API and Firebase configurations have been verified in **staging**, a project owner can stage the frontend using `npx firebase-tools hosting:channel:deploy phase7-qa --config firebase.phase7.example.json --project <STAGING_PROJECT_ID>`. The preview channel address must be included exactly in `FOODROUTE_ALLOWED_ORIGINS` (HTTPS origin only). Public URLs and OAuth/Firebase Authorized Domains must be configured by the owner. For a production release, use `npx firebase-tools deploy --only hosting --config firebase.phase7.example.json --project <PRODUCTION_PROJECT_ID>` **only after formal checks**, change review and backups.

Note: Hosted order/dispatch calls will fail if you deploy only the frontend while `VITE_ORDER_API_MODE=cloudrun` but the backend URL is not valid.

## 6. Hosted backend candidate (Cloud Run with project owner's consent)

A separate `services/functions/src/orders/prod-server.ts` listens on `0.0.0.0:$PORT`, accepts HTTPS origins listed in `FOODROUTE_ALLOWED_ORIGINS`, verifies Firebase ID tokens including revocation, denies bad origins, checks JSON body size, suppresses stack traces, and uses role validations from the existing backend. `services/functions/Dockerfile` builds a nonroot Node.js 22 container.

Configure with your staging project's identity, least-privilege server service account for Firestore/Auth, and an externally managed `FOODROUTE_PREVIEW_SIGNING_KEY`. This must be a **stable 32-byte cryptographically random key represented in base64**, provisioned in Secret Manager—not a value in Git or Vite. Do not rotate in the middle of route previews; rotate through a planned rollout. A secret must be shared across Cloud Run instances for signed preview verification.

**Example only (authorized project owner; do not run on production without approval):**

```powershell
# Project owner first provisions billing, Secret Manager, service account IAM,
# staging project, rate controls, and alerts. Replace ALL placeholders.
gcloud run deploy foodroute-api-staging `
  --source services/functions `
  --region asia-south1 `
  --project STAGING_PROJECT_ID `
  --service-account foodroute-staging-api@STAGING_PROJECT_ID.iam.gserviceaccount.com `
  --set-env-vars NODE_ENV=production,GOOGLE_CLOUD_PROJECT=STAGING_PROJECT_ID,FOODROUTE_ALLOWED_ORIGINS=https://EXACT-STAGING-FRONTEND-ORIGIN `
  --set-secrets FOODROUTE_PREVIEW_SIGNING_KEY=foodroute-preview-signing-key:latest `
  --max-instances 2 `
  --concurrency 10 `
  --allow-unauthenticated
```

Cloud Run is reachable by browsers without Google IAM login because the **application** checks Firebase ID tokens on all non-health operations. Thus, exposed endpoints still require API gateway/WAF/App Check, abuse controls and authorization testing before general public release. CORS is not authentication. The current in-memory per-user rate check limits accidental bursts only *per Cloud Run instance*. Do not assume it stops distributed abuse.

External OSRM road-demo and Nominatim address search endpoints intentionally return 404 from this production entry point. Do not use the public demo provider to route actual customer coordinates. The backend's `/api/health` endpoint confirms listener readiness, not Firebase access; verify authenticated Firestore calls in staging separately.

## 7. Release smoke, logs and rollback

After an approved staging deployment:

```powershell
$env:FOODROUTE_SMOKE_API_URL = "https://YOUR-STAGING-BACKEND-ORIGIN"
node scripts/phase7-smoke.mjs
```

Smoke is read-only: `/api/health`, an unauthenticated preview (401), and a request with disallowed origin (403). Afterward, execute the isolated staging end-to-end matrix with real Firebase test accounts.

Enable Cloud Logging error-rate alerts, uptime checks, p95 response-time monitoring, Firestore quota monitoring, authentication error trends, Secret Manager rotation review, Cloud Run max instances, and billing budget alerts. Budget alerts do **not** cap spend. Capture a known-good deployed Hosting version and Cloud Run revision; rehearse rollback through the Firebase Hosting release history and Cloud Run revisions before launch.

## 8. GitHub release and README

1. Back up local project, check `git status --short`, inspect staged files for secrets (`git diff --cached --name-only`, `node scripts/phase7-audit.cjs`), and ensure `.env.local`, service account keys and token files are not tracked. Merge `.gitignore.phase7.additions` into your existing `.gitignore` rather than replacing any project-specific ignore rules.
2. Commit Phase 7 to a feature branch; open a PR. Require CI green and manual review of Firebase rules, backend auth, and deployment configuration. Do **not** auto-deploy from PRs.
3. Add tagged release after staging tests, e.g. `v2.0.0-rc.1`. Summarize known limitations; link architecture, user guide, screenshots with redacted data, license and security contact. Never attach secrets or real customer data.
4. Obtain deployment approval from the project owner before production promotion; publish and monitor, and be able to roll back both frontend and backend.

## 9. Current known gaps

This patch is a **release-readiness candidate**. It does not provide proof of full live E2E success, production billing approval, server-side App Check, production payment reconciliation, rider onboarding approval UI, real road routing, traffic-aware ETA, persisted push notifications, full accessibility audit, GDPR/legal certification, or fully deployed backend. Do not describe the app as production-ready until these are addressed and checked.
