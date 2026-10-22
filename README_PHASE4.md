# FOODROUTE 2.0 — Phase 4 Development Overlay

**First read:** [`docs/PHASE4_ORDERING_SETUP.md`](docs/PHASE4_ORDERING_SETUP.md)

Adds secure server-validated cash-on-delivery **prototype** ordering, a separate live restaurant cart, live order views for customers/restaurants, and the restaurant preparation lifecycle. Uses Firestore + Firebase Admin SDK + a loopback local API for Spark development, with callable Cloud Functions ready for later deployment.

**Preserved:** the approved ivory/orange floating-food homepage, hero assets, the demo cart, Firebase Auth, Phase 3 restaurant approval/menus, and all existing role security.

**Not included:** live payments, rider tracking, actual dispatch, tax/shipping configuration, production service hosting. Do not accept real purchases with this development build.

This overlay does not contain credentials, keys, or installed dependencies; merge with your existing project rather than deleting it.
