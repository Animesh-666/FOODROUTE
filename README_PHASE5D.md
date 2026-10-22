# FOODROUTE Phase 5D — Secure, Bounded Optimized Dispatch

This overlay upgrades your already-installed Phase 5C + Phase 6A + navigation patch; it does NOT replace your repository.

After safely merging the paths in this ZIP into the FOODROUTE root, read `docs/PHASE5D_OPTIMIZED_DISPATCH_SETUP.md` for setup and validation.

Entry page: `/admin/optimized-dispatch`; existing manual dispatch and dashboards remain.

IMPORTANT: `/api/optimized/commit` writes real Firestore assignments. Use development test orders and test rider accounts ONLY. This is a local-only capacity-limited dispatch prototype using synthetic estimated route times, NOT production routing, navigation or tracking.

No private credentials, `.env` values, Firebase rules or landing page assets are included.
