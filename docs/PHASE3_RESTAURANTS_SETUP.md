# FOODROUTE 2.0 — Phase 3 Restaurant & Menu Management

**Development state:** Feature implementation package. The approved floating-food homepage and eight demo dishes are preserved. There is no production checkout, payment integration or food ordering yet.

## What is included

- Public `/restaurants`: Firestore directory of **approved, active** kitchens.
- `/restaurants/:restaurantId`: real restaurant-owned menu from Firestore. Only published dishes are publicly readable; unavailable ones aren't displayed.
- Authenticated `/restaurant/apply`: verified customer account can apply once. Application belongs to `restaurantApplications/{uid}` and remains private.
- Restaurant-only `/restaurant/dashboard`: create, edit, publish/unpublish menu entries, inventory availability toggles; no physical deletion.
- Trusted `/admin/restaurant-applications`: approval/rejection via server callable functions. Needs **Firebase Blaze plan** to deploy Cloud Functions.
- A **development-only local Admin SDK script** to approve an application without Cloud Functions, useful with the Spark plan. Must run with your own trusted Google Application Default Credentials; never run on the client.
- Updated Firestore Security Rules and indexes. No public role selection or restaurant self-approval.

## 1. Install as an overlay (do not delete your existing project)

1. **Back up or commit your current working project.** Extract the zip into a temporary folder.
2. Copy `apps/web/` into your existing FOODROUTE `apps/web/`. Your `.env.local` remains yours: this ZIP contains only `.env.example`, never credentials.
3. Copy `firebase/firestore.rules` and `firebase/firestore.indexes.json` only after comparing them with your deployed rules. **These Phase 3 rules deny access to later-phase orders, carts, payments, delivery and tracking collections.** If those services are already deployed, merge the relevant rules rather than blindly replacing them.
4. Add `services/functions/` as a new backend module; it does **not** overwrite the earlier Express backend.
5. The sample `firebase.phase3.example.json` is a template: merge the **functions** and **emulators** configuration into the root `firebase.json` you already have. Do not blindly overwrite your root config.

## 2. Run the frontend

At `C:\Users\ANIMESH\Desktop\FOODROUTE`, run:

```powershell
cd .\apps\web
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

Existing Firebase web settings in `apps/web/.env.local` remain in place. Optionally add:

```dotenv
VITE_FIREBASE_FUNCTIONS_REGION=us-central1
```

The Phase 3 pages exist at:

| URL | What it does |
|---|---|
| `/` | Original approved animated homepage, still uses demo menu/cart |
| `/restaurants` | Public approved-kitchen list |
| `/restaurants/rest_<userUID>` | Live menu for one approved restaurant |
| `/restaurant/apply` | Customer partner application; requires verified email |
| `/restaurant/dashboard` | Restaurant menu editor (after approval) |
| `/admin/restaurant-applications` | Admin review page; requires provisioned admin and Cloud Functions for action buttons |

**Important:** Phase 3 creates real menu listings only. The old hero's sample menu, cart and order preview deliberately remain demonstration content until Phase 4 connects server-priced real checkout.

## 3. Deploy the reviewed Firestore rules

From the FOODROUTE **root** folder:

```powershell
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project foodroute-711d9
```

Double-check the target project ID before pressing Enter. In `firebase.json` ensure `firestore.rules` points to `firebase/firestore.rules`, and `firestore.indexes` points to `firebase/firestore.indexes.json`. The restaurant-list composite index can take time to build; a missing-index console link might appear until it completes.

Never temporarily use `allow read, write: if true` to bypass a permission error.

## 4. Apply with a verified email

1. Use an existing customer account or register an account with a **real email address you can access**.
2. In `/account`, verify your email address using the verification action. Sign out and back in so the Firebase ID token refreshes.
3. Visit `/restaurant/apply`; fill name, city, cuisine and short description.
4. Confirm Firestore shows a `restaurantApplications/{uid}` document with `status: pending`.
5. **Do not edit the application's `status` or your user's `role` from the browser**. This is not an approval mechanism and will be denied.

## 5. Approval option A — Spark (development): trusted CLI, no Cloud Functions

This is the lowest-cost way to validate an end-to-end restaurant approval flow while developing. It is an authorized server-side action using Firebase Admin SDK, not a website endpoint.

- Install the functions dependencies: `cd services/functions; npm install`.
- Install and authenticate Google Cloud CLI on **your own computer**, using `gcloud auth application-default login` (or use other securely managed Application Default Credentials available to your account). **Do not place downloaded service-account JSON in your repository**.
- Set the exact project environment variable in PowerShell: `$env:GOOGLE_CLOUD_PROJECT='foodroute-711d9'`.
- From `services/functions`, run the approval script with the applicant's Firebase Authentication UID:

```powershell
node scripts/approve-local.mjs APPLICANT_UID --confirm-project-id=foodroute-711d9
```

The script checks application state, verified email, eligible customer profile, and an unused restaurant ID. It atomically creates `restaurants/rest_<uid>`, changes the profile role to `restaurant`, and sets the trusted Firebase Auth custom claim. It is safe to retry after a partial custom-claim update.

**Admin provisioning (development):** To test the admin review screen, you can bootstrap one account with `node scripts/bootstrap-admin.mjs ADMIN_UID --confirm-project-id=foodroute-711d9` from a trusted environment. The account must already exist as an active customer profile. This script grants sensitive privileges: restrict who runs it and review the UID carefully.

After role changes, the affected user must **sign out and sign back in**. A stale ID token can produce permission-denied even if the Firestore profile shows `role: restaurant`.

## 6. Approval option B — Blaze: deploy server-side callable functions

Firebase Cloud Functions deployment requires enabling Blaze billing for the Firebase project. Before upgrading, review pricing and project budgets. Run in `services/functions`:

```powershell
npm install
npm run build
```

Merge the functions block from `firebase.phase3.example.json` into the root `firebase.json`, then from the root run:

```powershell
npx firebase-tools deploy --only functions --project foodroute-711d9
```

Available callables: `approveRestaurantApplication`, `rejectRestaurantApplication` (region `us-central1`). Each request must have a Firebase Auth ID token with a **trusted admin claim** and an active admin profile. The client role gate is presentation-only; the function performs the actual access checks.

## 7. Test Firestore authorization with emulator

For rule tests, install frontend dev dependencies in `apps/web` and configure the emulators in the root `firebase.json` (template provided). From root:

```powershell
npx firebase-tools emulators:exec --only firestore --project demo-foodroute-local 'npm --prefix apps/web run test:rules'
```

**Run only against an emulator.** The test suite covers user role escalation rejection, pending applications, email verification, restaurant-owned menu writes, published vs draft reads, and admin-only application lists. The emulator may need Java installed on the system.

## 8. Firestore data model

```text
users/{uid}                           # From Phase 2; Admin SDK assigns privileged roles
restaurantApplications/{uid}          # Private request + pending/approved/rejected status
restaurants/rest_{uid}                # Public approved restaurant profile
  menuItems/{autoId}                  # Published/draft dishes, price in paise
```

Menus store `pricePaise` as integers. Example: ₹249.50 becomes `24950`. This avoids floating point rounding issues for money. Menus use `vegetarian`, `available` and `published` as separate booleans.

## 9. Known limits and next milestone

- No payment handling, server-priced checkout, delivery agent assignment or route optimization integration in Phase 3.
- Menu image entry currently accepts HTTPS image links or bundled `/assets/` images, but **Cloud Storage uploads are not yet provided**. Media rights, sizes and domains should be checked before using external artwork in production.
- Restaurant listing uses general placeholder visual cards until restaurants upload their own authorized images.
- Full build/emulator/browser testing still must be completed on your machine if dependencies are unavailable in this runtime.
- Phase 4 should connect the approved restaurant's live menu to a secure one-restaurant cart, server-validated quote, and idempotent order placement while preserving the approved visual design.

## Quick verification checklist

- [ ] Homepage hero/cart/demo design visually unchanged; a 'Restaurants' link and explanatory sample-menu callout are the only customer-home additions.
- [ ] Customer can sign up, verify email, submit one pending restaurant application.
- [ ] Firestore denies public admin/restaurant role self-assignment.
- [ ] Restaurant approval can be performed only by Admin SDK or admin-authenticated callable function.
- [ ] Restaurant owner sees `/restaurant/dashboard` after signing back in.
- [ ] Only that owner can change their menu items.
- [ ] Anonymous visitors can read only approved active restaurants and published menus.
- [ ] `Published=false` hides an item from anonymous and unaffiliated users.
- [ ] Customer viewing a live menu sees prices and stock status, but no checkout action yet.
