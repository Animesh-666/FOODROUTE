# FOODROUTE Phase 2 — Approved Design + Firebase Customer Identity

**Frontend remains the approved ivory/orange Floating Food Design v2.** This is a safe source overlay for `apps/web`, not a complete backend replacement.

### Quick start

```powershell
cd .\apps\web
Copy-Item .env.example .env.local
# Fill Firebase Web app config in .env.local, enable Email/Password auth and create Firestore
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

Open the Vite local URL. Landing page works without Firebase configuration; customer signup/login will be disabled until configured.

See `docs/PHASE2_FIREBASE_SETUP.md` for security-rule deployment, emulators, known limits, and acceptance testing. Keep `.env.local` secret and excluded from Git. Never copy Firebase service account JSON into the frontend.
