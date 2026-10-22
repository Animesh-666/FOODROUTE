# FOODROUTE 2.0 — Phase 6A (6A.1 to 6A.6)

**Delivery:** Source overlay designed to merge with your existing Phase 5C FOODROUTE checkout.

## Implemented

- 6A.1: Premium ivory/orange dashboard shell, responsive sidebar/topbar, design tokens, accessible navigation, loading/empty/error states, shared cards and status pills.
- 6A.2: Customer overview connected to customer orders and approved restaurant listings.
- 6A.3: Admin operations overview connected to ready orders, available riders and pending approval queues.
- 6A.4: Restaurant overview connected to own menu and order queue; old menu editor now at `/restaurant/menu`.
- 6A.5: Rider overview connected to own availability and delivery routes; original delivery controls now at `/rider/deliveries`.
- 6A.6: `/dashboard` role-based entry, token claim + Firestore profile role/status checks, guarded views, route metadata and unit tests.

The sample landing hero, approved design, restaurant functionality, and backend are unchanged. These dashboards summarize existing data and do not claim live GPS, paid transactions, or production-verified revenue.

## Install

Extract to a temporary directory, compare, and merge into your FOODROUTE root. **Do not erase `apps/web` or copy `node_modules`.** Preserve `.env.local` and local changes. The only modifications to existing source files are `App.tsx`, `RequireRole.tsx`, `LoginPage.tsx`, `AccountPage.tsx`, and `Header.tsx`, plus compatibility frontend files for the Phase 5C route/location variants.

Detailed setup: [`docs/PHASE6A_DASHBOARDS_SETUP.md`](docs/PHASE6A_DASHBOARDS_SETUP.md).

## Verification summary

- Parsed 67 TypeScript/TSX source files with zero parser errors.
- Relative imports verified in the staged merged source.
- 8 standalone role/routing assertions passed, plus dedicated Vitest unit tests included.
- **Not yet verified:** dependency-based TypeScript compilation, real Firebase four-account browser checks, responsiveness in a browser, full Vitest/Firestore Emulator test suites. Run those locally before marking 6A.6 production-complete.

**Next:** Phase 5D transactional optimized dispatch after the dashboard migration is verified.
