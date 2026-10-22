# FOODROUTE Phase 5B — Road Routing Sandbox

**Read `docs/PHASE5B_ROAD_ROUTING_SETUP.md` first.**

Phase 5B adds `/admin/route-planner`, manually supplied demo coordinates, OSRM demo driving distance/duration matrices (optional; with explicit consent), Leaflet/OpenStreetMap map, Greedy / directed 2-opt / exact Held–Karp route comparisons, and a stop-count-limited multi-rider tour heuristic. The separate Phase 5A manual dispatch and approved floating-food design remain unchanged.

This source milestone is **not a verified live-traffic routing system**, does not write to Firestore orders, and must not be used as real navigation or route assignment. Local runtime validation is still required.
