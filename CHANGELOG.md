# Changelog

All notable project release milestones will be recorded here.

## [2.0.0] — 2026-10-22

### Added
- Responsive Floating Food React/TypeScript frontend, four role-specific dashboards, and route-aware navigation.
- Firebase Authentication and Firestore role-aware data flows.
- Server-validated COD quotes, development orders, restaurant operations, order history and analytics.
- Rider availability, manual and optimized dispatch, route previews and assigned delivery workflow.
- DAA algorithm laboratory for Greedy, Held–Karp, 2-opt and bounded multi-rider routing.
- Vercel + Render demonstration hosting and release/quality-check documentation.

### Security and reliability
- Backend Firebase ID-token validation, role checks and Firestore transaction safety for supported operations.
- Firestore security-rule regression tests, unit tests, Playwright smoke checks and release audit.
- Containerized API with approved-origin validation; sensitive Firebase Admin credentials remain server-side.

### Known limitations
- This is a portfolio/student **demo**, not a verified commercial food-delivery platform.
- COD order value is not audited collected revenue; no payment processing or real-time rider GPS.
- Production-grade abuse controls, privacy operations, approval workflows, broader E2E coverage and monitoring remain outstanding.

For details see [v2.0.0 release notes](docs/RELEASE_NOTES_v2.0.0.md) and [SECURITY.md](SECURITY.md).
