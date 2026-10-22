# FOODROUTE 2.0 — Phase 4: Real Restaurant Orders (development)

## What is real, and what is not

- **Real Firestore data:** approved restaurant menus, customer orders, restaurant statuses, and owner/customer-scoped live order lists.
- **Trusted backend:** all prices are fetched again from Firestore by a server using Firebase Admin SDK. Client writes to `/orders` are denied.
- **Development COD only:** no payment transaction, online payment provider, calculated shipping, tax, rider allocation, navigation, or pickup confirmation yet. The delivery fee is explicitly ₹0 for this prototype.
- The approved floating-food homepage and its eight-item **demo cart** are unchanged. Phase 4's **live ordering** starts under `/restaurants`; demo showcase dishes aren't connected to checkout.
- **Spark plan:** callable Cloud Functions cannot be deployed on Spark; use the localhost order API below with your existing, authorized Google Cloud ADC credentials. The localhost backend accesses your actual Firebase project, so **test orders are real database records** even though no payment or delivery takes place.

## Installation

1. Back up / commit your current FOODROUTE files.
2. Extract ZIP to a temporary directory; copy `apps/web`, `services/functions`, and the reviewed `firebase/firestore.rules` and index files into the corresponding project folders. DO NOT overwrite `.env.local` or root `firebase.json`.
3. In `apps/web/.env.local`, add:

   ```dotenv
   VITE_ORDER_API_MODE=local
   ```

   Keep your Phase 2 Firebase configuration in the same file. Restart Vite after editing it. This setting enables localhost API calls **only in development**; it is deliberately rejected in production builds.
4. From the FOODROUTE project root, deploy the **reviewed Phase 4 Firestore rules** (the new `/orders` block grants only appropriate reads and denies all browser writes):

   ```powershell
   npx firebase-tools deploy --only firestore:rules,firestore:indexes --project foodroute-711d9
   ```

5. **Start the local trusted API** in its own terminal. You previously authenticated with `gcloud auth application-default login`; ensure those authorized credentials still work:

   ```powershell
   cd C:\Users\ANIMESH\Desktop\FOODROUTE\services\functions
   $env:GOOGLE_CLOUD_PROJECT = 'foodroute-711d9'
   npm install
   npm run dev:api
   ```

   This compiles and starts `http://127.0.0.1:8787` only on loopback. It checks Firebase ID tokens and rechecks Firestore roles; it does not expose the Admin SDK to React. Never bind the dev API to `0.0.0.0` or publish it to the internet. Don't put OAuth JSON or private keys in the repo.

6. **Start frontend** in another terminal:

   ```powershell
   cd C:\Users\ANIMESH\Desktop\FOODROUTE\apps\web
   npm install
   npm run typecheck
   npm test
   npm run build
   npm run dev
   ```

   `VITE_ORDER_API_MODE=local` is safe for Vite development only; deploying the frontend before replacing this with the callable implementation will display an API-unavailable error for checkout.

## Test the user journey

1. Use your **restaurant account** (90'S PALACE) and check that the published dish is available. The restaurant already exists in Firebase.
2. Use a **different, verified customer account** for actual ordering. Restaurant-role accounts cannot place orders in this phase. Sign out and sign in with a customer account.
3. Open `http://localhost:5173/restaurants`, choose `90'S PALACE`, and add a published, available dish to the new live bag.
4. Open `/checkout`, enter a development delivery address, and click **Confirm current prices**. The amount is returned by the local trusted API; the site does not trust browser prices. A change to the total between quote and order submission is rejected until you confirm a fresh quote.
5. Click **Place COD order**. `/orders` lists the order, starting at `placed`.
6. Sign in as the restaurant owner and open `/restaurant/orders`. Use **Accept → Start preparing → Mark ready for pickup**. Observe updates in `/orders` from the customer account.
7. Confirm that browser attempts to write directly to `/orders` are rejected and that other users cannot read your orders.

### Essential caveats

- No courier receives the order yet. **Do not use this build for actual customer purchases.**
- No real total including taxes, service or delivery charges is calculated; the quote is explicitly a prototype. You'll add official pricing rules before taking orders.
- `idempotencyKey` is held across retries of the same checkout screen and prevents duplicate orders from repeated clicks. If you change your cart/address it receives a new key.
- The API requires a verified email for customer ordering. Use an account you can access.
- Status `ready_for_pickup` ends this phase; rider assignment belongs to Phase 5.
- When enabling deployed Cloud Functions later, switch `VITE_ORDER_API_MODE` to `functions` or remove the local setting, then deploy the 3 callables exported from `services/functions/src/index.ts` on an eligible Firebase plan.

## Automated tests

Run these from FOODROUTE root (requires Java 21 + Firestore emulator, as you have configured):

```powershell
npx firebase-tools emulators:exec --only firestore --project demo-foodroute-local "npm --prefix apps/web run test:rules"
```

Existing Phase 3 rules tests (6) and Phase 4 rule tests (4) now check owner/stranger reads and denials of direct order writes. Other unit tests run under `npm test`. Tests cannot simulate a full remote Admin SDK deployment; a local end-to-end order test is still required.

## Data model

```
orders/{ord_<sha256>}
  customerUid, restaurantId, address, items[] [server-snapshotted],
  subtotalPaise, deliveryFeePaise, totalPaise, currency,
  pricingMode: 'demo-no-delivery-fee', status,
  payment: {method:'cod',status:'unpaid'},
  requestFingerprint, createdAt, updatedAt
  events/{created|randomUUID}
    kind, from, to, actorUid, at
```

Never overwrite `orders` documents from the browser. Price and status fields are **server-controlled**.
