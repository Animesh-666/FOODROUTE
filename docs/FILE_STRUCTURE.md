# FOODROUTE 2.0 — Complete file inventory

207 files. All application modules are placeholders. Open `../OPEN_FOLDER_MAP.html` for the visual explorer.

| File | Purpose | Phase |
|---|---|---|
| `.editorconfig` | Shared editor formatting | core |
| `.github/workflows/README.md` | Future CI: typecheck, domain/rule tests, browser tests, then deployment; no workflow enabled | core |
| `.gitignore` | Exclude dependencies, generated files and private credentials | core |
| `OPEN_FOLDER_MAP.html` | Offline expandable explorer containing all files and responsibilities | core |
| `README.md` | Project overview and accurate setup instructions | core |
| `apps/web/.env.example` | Public frontend configuration template | core |
| `apps/web/index.html` | Explicit static scaffold notice; React mounting will be connected during implementation | core |
| `apps/web/package.json` | Workspace manifest; dependency setup pending | core |
| `apps/web/public/README.md` | Directly served static assets | core |
| `apps/web/src/app/App.tsx` | Application composition | core |
| `apps/web/src/app/providers.tsx` | Authentication and query providers | core |
| `apps/web/src/app/router.tsx` | Public and role-specific routes | core |
| `apps/web/src/assets/README.md` | Bundled images and icons | core |
| `apps/web/src/components/charts/AlgorithmComparisonChart.tsx` | Solver comparison chart | core |
| `apps/web/src/components/maps/LocationMarker.tsx` | Shared location marker | core |
| `apps/web/src/components/maps/RouteMap.tsx` | Shared route-map component | core |
| `apps/web/src/components/ui/README.md` | Shared UI primitives | core |
| `apps/web/src/features/admin/AccountApprovalsPage.tsx` | Restaurant and rider approvals | core |
| `apps/web/src/features/admin/AdminDashboardPage.tsx` | Administrative overview | core |
| `apps/web/src/features/admin/DispatchPage.tsx` | Optimization preview and explicit dispatch commit | core |
| `apps/web/src/features/admin/OrdersPage.tsx` | Platform order supervision | core |
| `apps/web/src/features/admin/SettingsPage.tsx` | Platform configuration | core |
| `apps/web/src/features/admin/UsersPage.tsx` | Account management | core |
| `apps/web/src/features/admin/admin.api.ts` | Administrative API calls | core |
| `apps/web/src/features/algorithm-lab/AlgorithmLabPage.tsx` | DAA experiment workspace | core |
| `apps/web/src/features/algorithm-lab/ComparisonTable.tsx` | Measured solver comparisons | core |
| `apps/web/src/features/algorithm-lab/RunHistoryPage.tsx` | Saved experiment history | core |
| `apps/web/src/features/algorithm-lab/ScenarioEditor.tsx` | Graph and route scenario editing | core |
| `apps/web/src/features/algorithm-lab/algorithmLab.api.ts` | Isolated optimization experiment requests | core |
| `apps/web/src/features/analytics/AnalyticsPage.tsx` | Operational analytics | core |
| `apps/web/src/features/analytics/MetricCard.tsx` | Metric presentation | core |
| `apps/web/src/features/auth/ForgotPasswordPage.tsx` | Password reset | core |
| `apps/web/src/features/auth/LoginPage.tsx` | Shared sign-in page | core |
| `apps/web/src/features/auth/RegisterPage.tsx` | Customer registration and operational account applications | core |
| `apps/web/src/features/auth/RequireRole.tsx` | Frontend role gate; backend authorization remains mandatory | core |
| `apps/web/src/features/auth/VerifyEmailPage.tsx` | Email verification | core |
| `apps/web/src/features/auth/auth.api.ts` | Account profile and application API calls | core |
| `apps/web/src/features/auth/useAuth.ts` | Firebase authentication subscription | core |
| `apps/web/src/features/cart/CartItem.tsx` | Cart line item | core |
| `apps/web/src/features/cart/CartPage.tsx` | Customer basket | core |
| `apps/web/src/features/cart/cart.api.ts` | Owner-specific cart operations | core |
| `apps/web/src/features/cart/cartStore.ts` | Cart interface state | core |
| `apps/web/src/features/checkout/AddressPicker.tsx` | Address and confirmed delivery pin | core |
| `apps/web/src/features/checkout/CheckoutPage.tsx` | Checkout flow | core |
| `apps/web/src/features/checkout/OrderSummary.tsx` | Server-priced quote display | core |
| `apps/web/src/features/checkout/checkout.api.ts` | Quote and idempotent order requests | core |
| `apps/web/src/features/landing/LandingPage.tsx` | Public project landing page | core |
| `apps/web/src/features/merchant/KitchenOrdersPage.tsx` | Acceptance and preparation queue | core |
| `apps/web/src/features/merchant/MenuManagementPage.tsx` | Restaurant-owned menu management | core |
| `apps/web/src/features/merchant/RestaurantDashboardPage.tsx` | Merchant dashboard | core |
| `apps/web/src/features/merchant/RestaurantSettingsPage.tsx` | Restaurant opening hours and settings | core |
| `apps/web/src/features/merchant/merchant.api.ts` | Restaurant operations API calls | core |
| `apps/web/src/features/notifications/NotificationList.tsx` | User notification display | core |
| `apps/web/src/features/orders/OrderDetailPage.tsx` | Customer order details | core |
| `apps/web/src/features/orders/OrderHistoryPage.tsx` | Customer order history | core |
| `apps/web/src/features/orders/OrderTimeline.tsx` | Order event timeline | core |
| `apps/web/src/features/orders/orders.api.ts` | Order read and cancellation operations | core |
| `apps/web/src/features/profile/ProfilePage.tsx` | Profile editing | core |
| `apps/web/src/features/profile/SavedAddressesPage.tsx` | Saved delivery addresses | core |
| `apps/web/src/features/restaurants/MenuItemCard.tsx` | Menu item presentation | core |
| `apps/web/src/features/restaurants/RestaurantDetailPage.tsx` | Restaurant menu browsing | core |
| `apps/web/src/features/restaurants/RestaurantListPage.tsx` | Restaurant discovery | core |
| `apps/web/src/features/restaurants/restaurants.api.ts` | Restaurant browsing API calls | core |
| `apps/web/src/features/rider/ActiveRoutePage.tsx` | Saved ordered stops and delivery actions | core |
| `apps/web/src/features/rider/AssignmentOffer.tsx` | Time-limited accept or reject offer | core |
| `apps/web/src/features/rider/DeliveryHistoryPage.tsx` | Actual completed delivery history | core |
| `apps/web/src/features/rider/RiderDashboardPage.tsx` | Rider availability and workload | core |
| `apps/web/src/features/rider/rider.api.ts` | Assignment pickup and completion requests | core |
| `apps/web/src/features/rider/useRiderLocation.ts` | Single GPS watcher with cleanup and throttling | core |
| `apps/web/src/features/tracking/TrackOrderPage.tsx` | Authorized active-delivery tracking | core |
| `apps/web/src/features/tracking/useOrderTracking.ts` | Live tracking subscription and cleanup | core |
| `apps/web/src/hooks/README.md` | Cross-feature hooks | core |
| `apps/web/src/layouts/AdminLayout.tsx` | Admin navigation and layout | core |
| `apps/web/src/layouts/CustomerLayout.tsx` | Customer navigation and layout | core |
| `apps/web/src/layouts/PublicLayout.tsx` | Public navigation and layout | core |
| `apps/web/src/layouts/RestaurantLayout.tsx` | Restaurant navigation and layout | core |
| `apps/web/src/layouts/RiderLayout.tsx` | Rider navigation and layout | core |
| `apps/web/src/lib/apiClient.ts` | Authenticated backend API client | core |
| `apps/web/src/lib/firebase.ts` | Firebase client initialization | core |
| `apps/web/src/lib/maps.ts` | Map display adapter | core |
| `apps/web/src/main.tsx` | React application bootstrap | core |
| `apps/web/src/styles/globals.css` | Global styles; frontend design to be decided | core |
| `apps/web/src/styles/tokens.css` | Design tokens; colors and typography to be decided | core |
| `apps/web/src/tests/README.md` | Frontend component and contract tests | core |
| `apps/web/vite.config.ts` | Vite build configuration; dependency setup pending | core |
| `docs/FILE_STRUCTURE.md` | Full directory and file responsibility inventory | core |
| `docs/FILE_STRUCTURE_FLOWCHART.md` | Rendered-in-compatible-viewers folder diagram and structure explanation | core |
| `docs/algorithm-analysis.md` | Planning document: algorithm-analysis | core |
| `docs/api-contracts.md` | Planning document: api-contracts | core |
| `docs/architecture.md` | Planning document: architecture | core |
| `docs/database-schema.md` | Planning document: database-schema | core |
| `docs/deployment.md` | Planning document: deployment | core |
| `docs/development-roadmap.md` | Planning document: development-roadmap | core |
| `docs/file-structure.mmd` | Editable Mermaid folder-flowchart source | core |
| `docs/implementation-status.md` | What exists versus what remains to implement | core |
| `docs/migration-map.md` | Planning document: migration-map | core |
| `docs/order-lifecycle.md` | Planning document: order-lifecycle | core |
| `docs/requirements.md` | Planning document: requirements | core |
| `firebase.json` | Rules paths only; no project binding, function runtime or hosting deployment configured | core |
| `firebase/firestore.indexes.json` | Index definitions pending actual queries | core |
| `firebase/firestore.rules` | Deny-all baseline; scoped rules and tests required before implementation | core |
| `firebase/storage.rules` | Deny-all file access baseline | core |
| `package.json` | Root npm workspace and structure validation command | core |
| `packages/contracts/package.json` | Workspace manifest; dependency setup pending | core |
| `packages/contracts/src/cart.ts` | Cart contracts | core |
| `packages/contracts/src/dispatch.ts` | Assignment and dispatch contracts | core |
| `packages/contracts/src/index.ts` | Public contract exports | core |
| `packages/contracts/src/optimization.ts` | Solver requests and results | core |
| `packages/contracts/src/orders.ts` | Order API schemas and types | core |
| `packages/contracts/src/payments.ts` | Payment states and contracts | core |
| `packages/contracts/src/restaurants.ts` | Restaurant and menu contracts | core |
| `packages/contracts/src/routes.ts` | Route plans and stops | core |
| `packages/contracts/src/statuses.ts` | Shared state names | core |
| `packages/contracts/src/tracking.ts` | Location update and tracking contracts | core |
| `packages/contracts/src/users.ts` | User profiles and roles | core |
| `packages/routing-engine/package.json` | Workspace manifest; dependency setup pending | core |
| `packages/routing-engine/src/algorithms/astar.ts` | Heuristic graph shortest paths | core |
| `packages/routing-engine/src/algorithms/dijkstra.ts` | Graph shortest paths | core |
| `packages/routing-engine/src/algorithms/greedy.ts` | Nearest-neighbor TSP | core |
| `packages/routing-engine/src/algorithms/heldKarp.ts` | Bounded exact Held-Karp TSP | core |
| `packages/routing-engine/src/algorithms/mstApproximation.ts` | Symmetric metric MST approximation | core |
| `packages/routing-engine/src/algorithms/twoOpt.ts` | Tour improvement | core |
| `packages/routing-engine/src/compare.ts` | Compatible solver comparison | core |
| `packages/routing-engine/src/distance/haversine.ts` | Geographical fallback distances | core |
| `packages/routing-engine/src/graph/graph.ts` | Explicit graph representation | core |
| `packages/routing-engine/src/index.ts` | Routing package public exports | core |
| `packages/routing-engine/src/metrics/measure.ts` | Controlled benchmark measurements | core |
| `packages/routing-engine/src/validation/matrix.ts` | Finite nonnegative matrix validation | core |
| `packages/routing-engine/src/validation/route.ts` | Stop coverage and route feasibility | core |
| `packages/routing-engine/tests/README.md` | Algorithm correctness and invalid-input tests | core |
| `scaffold-manifest.json` | Machine-readable scaffold inventory | core |
| `scripts/check-structure.mjs` | Dependency-free file and manifest consistency check | core |
| `scripts/migrate-legacy-data.ts` | Reviewed and dry-run-first legacy data migration | core |
| `scripts/provision-admin.ts` | Trusted admin provisioning; never a public signup endpoint | core |
| `scripts/seed-demo-data.ts` | Development-only demonstration data | core |
| `services/functions/.env.example` | Backend configuration template; no credentials included | core |
| `services/functions/package.json` | Workspace manifest; dependency setup pending | core |
| `services/functions/src/admin/handlers.ts` | Administrative API handlers | core |
| `services/functions/src/admin/service.ts` | Platform settings and account supervision | core |
| `services/functions/src/analytics/handlers.ts` | Analytics API handlers | core |
| `services/functions/src/analytics/service.ts` | Consistent operational metrics | core |
| `services/functions/src/auth/handlers.ts` | Account API handlers | core |
| `services/functions/src/auth/service.ts` | Trusted approvals and role assignment | core |
| `services/functions/src/cart/handlers.ts` | Cart API handlers | core |
| `services/functions/src/cart/service.ts` | Owner-specific cart operations | core |
| `services/functions/src/config/env.ts` | Backend configuration validation | core |
| `services/functions/src/config/firebaseAdmin.ts` | Trusted Firebase Admin initialization | core |
| `services/functions/src/dispatch/eligibility.ts` | Rider workload, capacity and availability | core |
| `services/functions/src/dispatch/handlers.ts` | Dispatch and assignment API handlers | core |
| `services/functions/src/dispatch/offerExpiry.ts` | Offer expiry and reservation release | core |
| `services/functions/src/dispatch/service.ts` | Preview, reserve and commit assignment plans | core |
| `services/functions/src/index.ts` | Firebase function exports; no deployed functions yet | core |
| `services/functions/src/menu/handlers.ts` | Menu API handlers | core |
| `services/functions/src/menu/service.ts` | Menu prices and availability | core |
| `services/functions/src/notifications/service.ts` | User notifications | core |
| `services/functions/src/orders/handlers.ts` | Order API handlers | core |
| `services/functions/src/orders/service.ts` | Quotes, order creation, cancellation and completion | core |
| `services/functions/src/orders/stateMachine.ts` | Authorized order transitions | core |
| `services/functions/src/payments/handlers.ts` | Payment API handlers | core |
| `services/functions/src/payments/service.ts` | Separate payment state and method | core |
| `services/functions/src/payments/webhook.ts` | Verified provider callbacks and duplicate-event protection | core |
| `services/functions/src/repositories/assignmentRepository.ts` | Firestore access for assignment records | core |
| `services/functions/src/repositories/cartRepository.ts` | Firestore access for cart records | core |
| `services/functions/src/repositories/menuRepository.ts` | Firestore access for menu records | core |
| `services/functions/src/repositories/notificationRepository.ts` | Firestore access for notification records | core |
| `services/functions/src/repositories/optimizationRunRepository.ts` | Firestore access for optimizationRun records | core |
| `services/functions/src/repositories/orderRepository.ts` | Firestore access for order records | core |
| `services/functions/src/repositories/paymentRepository.ts` | Firestore access for payment records | core |
| `services/functions/src/repositories/restaurantRepository.ts` | Firestore access for restaurant records | core |
| `services/functions/src/repositories/riderRepository.ts` | Firestore access for rider records | core |
| `services/functions/src/repositories/routeRepository.ts` | Firestore access for route records | core |
| `services/functions/src/repositories/userRepository.ts` | Firestore access for user records | core |
| `services/functions/src/restaurants/handlers.ts` | Restaurant API handlers | core |
| `services/functions/src/restaurants/service.ts` | Restaurant ownership and operating state | core |
| `services/functions/src/rider/handlers.ts` | Rider API handlers | core |
| `services/functions/src/rider/service.ts` | Offer responses and verified pickup/completion | core |
| `services/functions/src/routing/handlers.ts` | Optimization experiment API handlers | core |
| `services/functions/src/routing/mapsProvider.ts` | Travel distance and duration provider interface | core |
| `services/functions/src/routing/providers/demoProvider.ts` | Explicit simulated travel costs | core |
| `services/functions/src/routing/providers/googleRoutesProvider.ts` | Optional Google Routes integration; provider and budget pending | core |
| `services/functions/src/routing/service.ts` | Matrix, solver and route-validation orchestration | core |
| `services/functions/src/shared/authorization.ts` | Current account status, role and ownership checks | core |
| `services/functions/src/shared/errors.ts` | Consistent API errors | core |
| `services/functions/src/shared/idempotency.ts` | Duplicate-operation prevention | core |
| `services/functions/src/shared/logger.ts` | Structured logs without secrets | core |
| `services/functions/src/tracking/handlers.ts` | Tracking API handlers | core |
| `services/functions/src/tracking/service.ts` | Location validation and active-order access | core |
| `services/functions/tests/README.md` | Domain service and authorization tests | core |
| `services/ml-service/README.md` | ml-service: deferred service; not required by core workspaces | later |
| `services/ml-service/app/main.py` | ml-service main module | later |
| `services/ml-service/app/predict.py` | ml-service predict module | later |
| `services/ml-service/app/schemas.py` | ml-service schemas module | later |
| `services/ml-service/data/README.md` | ML data; no datasets or trained models included | later |
| `services/ml-service/models/README.md` | ML models; no datasets or trained models included | later |
| `services/ml-service/notebooks/README.md` | ML notebooks; no datasets or trained models included | later |
| `services/ml-service/tests/README.md` | ml-service test plan | later |
| `services/ml-service/training/README.md` | ML training; no datasets or trained models included | later |
| `services/optimizer-python/README.md` | optimizer-python: deferred service; not required by core workspaces | later |
| `services/optimizer-python/app/constraints.py` | optimizer-python constraints module | later |
| `services/optimizer-python/app/main.py` | optimizer-python main module | later |
| `services/optimizer-python/app/models.py` | optimizer-python models module | later |
| `services/optimizer-python/app/solver.py` | optimizer-python solver module | later |
| `services/optimizer-python/tests/README.md` | optimizer-python test plan | later |
| `tests/e2e/README.md` | Browser journeys for all four roles | core |
| `tests/fixtures/README.md` | Deterministic synthetic scenarios | core |
| `tests/integration/README.md` | Checkout dispatch and payment integration tests | core |
| `tests/rules/README.md` | Firestore and Storage allow-deny tests | core |
