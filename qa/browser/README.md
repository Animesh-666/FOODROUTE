# Browser release checks (Playwright)

Do **not** run tests against actual customer or production order records. Use Firebase Emulator Suite or isolated staging with disposable users and sample locations only.

From `qa/browser`: `npm install`, `npx playwright install chromium`, then `npm test`.
Run the Vite web server separately with correct staging/emulator variables. Set `FOODROUTE_WEB_URL` if not running on `http://127.0.0.1:5173`. For role-specific login tests, set each disposable account's `FOODROUTE_TEST_CUSTOMER_EMAIL` and `FOODROUTE_TEST_CUSTOMER_PASSWORD` (likewise ADMIN, RESTAURANT, RIDER). Keep these out of Git, console output, and screenshots. Tests skip that role when variables are unset.

This suite checks public rendering, login accessibility, protected page hiding, role landing redirects and desktop/mobile viewports. **It does not exercise a real multi-order commit**, which must be tested against isolated staging/Emulators with verified state transitions and cancellation/reassignment scenarios. See `docs/PHASE7_RELEASE_AND_DEPLOYMENT.md`.
