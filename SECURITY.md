# FOODROUTE security disclosure and scope

This repository is a student/demo project and the Phase 7 package is a **release candidate**. Avoid using real customer locations, real-world dispatch, and payment claims until required security controls and legal/privacy reviews have been completed.

For a suspected vulnerability, contact repository maintainers **privately** via their existing private reporting channel or GitHub private vulnerability reporting if enabled. Do not disclose credentials, private customer data or exploit details in a public issue. Avoid testing another person's account or production data.

Never commit Firebase Admin service-account keys, OAuth client secrets, `.env.local`, signing keys, test customer coordinates, credentials, or production database exports. Rotate anything ever leaked, including in Git history. Git ignore rules cannot undo previously exposed secrets.

The frontend role guard is not an authorization boundary. Actual sensitive access must be enforced by the trusted backend and Firestore Rules. Treat API rate limiting, distributed abuse controls, Firebase App Check, external map/privacy contracts, backup/retention and full penetration review as uncompleted production blockers.
