# FOODROUTE 2.0 — Approved Floating Food Design → React + TypeScript

**Milestone:** Phase 1 — public landing-page migration. **Design baseline:** approved `FOODROUTE_Floating_Food_Design_Review_v2.zip`.

This ZIP is an **overlay for the existing FOODROUTE 2.0 monorepo**. It includes `apps/web` plus migration docs; **it does not replace `services/`, `packages/`, `firebase/`, your earlier legacy project or its database.**

## Installation in VS Code (Windows PowerShell)

1. Back up your current `FOODROUTE/apps/web` folder, or create a Git branch and commit your work.
2. Extract this ZIP to your existing `FOODROUTE/` root folder. The root contains `apps/web` (not a nested `FOODROUTE_Floating_Food_Frontend/` folder). Accept replacement only for the supplied `apps/web` files.
3. Open VS Code terminal at the `FOODROUTE` root and run:

   ```powershell
   cd .\apps\web
   npm install
   npm run dev
   ```

4. Open the URL printed by Vite, commonly `http://localhost:5173`.
5. Verify:

   ```powershell
   npm run typecheck
   npm run test
   npm run build
   ```

**Important:** If your existing monorepo contains additional frontend files, remove or isolate old conflicting imports/entrypoints before trying to build. This package only imports the new landing-page files; unused placeholder files are not meant to become part of this initial app entrypoint.

## What works in this frontend-only milestone

- Approved ivory, terracotta-orange, sage/olive visual design and original eight-dish demo catalog.
- Responsive header/mobile navigation; featured-food selection; pointer tilt and motion preference handling; ingredient disclosure.
- Category selection/search; responsive cards; sample-item bag with persisted local quantity state, removal, demo subtotal and an explicit order-preview dialog.
- Typed catalog and cart utilities; React state replaces `data.js` and DOM string injections in `app.js`.
- Basic unit tests for cart and catalog utilities; no Firebase SDK/config credentials required.

## What is intentionally **not** implemented

Firebase Auth / Firestore, restaurant data, account roles, routing engine, admin/merchant/rider dashboards, delivery fees, taxes, actual payments, checkout, live tracking. These will be implemented once business contracts and permission rules are finalized. The current bag is **demonstration-only**.

## Design provenance

- `public/assets` contains the source demo food imagery from the approved ZIP, with `sources.json` recording source image URLs.
- `src/styles/globals.css` preserves the approved CSS and adds only React-state + small-screen adjustments.
- Transparent `hero-burger.webp` is the original optimized asset. The unoptimized PNG is deliberately not recopied into the app.
- Existing image licensing/permissions need confirmation before public commercial deployment; assets currently serve as project demo content.

## Next development phase

Define Firebase security rules/roles and restaurant ownership, then implement a real restaurant/catalog retrieval contract and login/checkout. The UI must not imply payment success or live delivery when no backend action occurred.

See [docs/FRONTEND_MIGRATION.md](docs/FRONTEND_MIGRATION.md).
