# FOODROUTE — Design v2 to React/TypeScript Migration

**Decision:** Preserve the user-approved warm ivory/terracotta/sage design. No redesign or speculative 3D replacement. Real WebGL food modeling remains an optional later enhancement, not required for the signed-off design.

## Source and implementation map

| Approved HTML/JS source | React/TypeScript destination | Result |
|---|---|---|
| `index.html` hero/nav | `src/features/landing/components/Header.tsx`, `Hero.tsx` | React with typed props/state |
| `data.js` global `window.FOODROUTE_MENU` | `src/features/landing/catalog.ts` | 8 typed food entries, filter and price utility |
| `app.js` menu filter/search | `components/MenuSection.tsx` | Controlled React input & category state |
| `app.js` cart/localStorage | `features/cart/cart.ts`, `useDemoCart.ts` | Pure cart functions + hook |
| `#cartDialog`, `#checkoutDialog` | `components/CartDialogs.tsx` | Native modal dialog refs and React rendering |
| `#story`, `#how`, footer | `components/StaticSections.tsx` | Faithfully converted markup |
| `styles.css` | `src/styles/globals.css` | Original design retained; minimal addendum |
| `assets/*` | `public/assets/*` | Static Vite asset paths |
| vanilla JS entry | `src/app/App.tsx`, `src/main.tsx` | React application bootstrap |

## Interaction contracts

1. **Public** browsing does not require authentication.
2. **Featured item** selection updates hero artwork, selected state, ingredient details, and card label.
3. **Animation preferences** honor `prefers-reduced-motion`; manual pause control only affects decorative animation.
4. **Menu** search filters names/descriptions and displays number of matching products, including empty states.
5. **Demo bag** persists only item IDs and quantities to localStorage, validates restored keys and caps count per item at 99; no sensitive data stored.
6. **Preview order** explicitly says it is not a placed order or payment.
7. **Mobile navigation** supports an expandable state, closing on link selection, outside click and Escape.
8. **Accessibility** includes semantic sections, labels, focus-visible styles, status announcements, native modal dialogs, button text and reduced-motion styling.

## Files included in archive

```
apps/web/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  .env.example
  .gitignore
  public/assets/                  # copied demo food images and source list
  src/main.tsx
  src/app/App.tsx
  src/styles/globals.css
  src/hooks/useReducedMotion.ts
  src/features/cart/cart.ts
  src/features/cart/useDemoCart.ts
  src/features/cart/cart.test.ts
  src/features/landing/catalog.ts
  src/features/landing/catalog.test.ts
  src/features/landing/LandingPage.tsx
  src/features/landing/components/Header.tsx
  src/features/landing/components/Hero.tsx
  src/features/landing/components/MenuSection.tsx
  src/features/landing/components/StaticSections.tsx
  src/features/landing/components/CartDialogs.tsx
```

## Migration safety and pending integration

- The legacy Express/MySQL implementation and its credentials must not be copied into this frontend.
- The included `apps/web` works as a standalone Vite app. It is compatible with a multi-workspace repository, but root installs/scripts may need reconciliation with the current project's files.
- `src/app/App.tsx` intentionally mounts the approved landing page alone; other route/page placeholder files in the broader scaffold are not yet functional.
- When Firebase is added, expose only public web-app configuration to the browser. Role assignment, pricing, dispatch, and payments are server-side decisions.
- Do not replace current customer demo menu with a single global restaurant catalog when moving to production. Add restaurant ownership and one-restaurant-per-checkout enforcement.
- Use the existing GitHub repository as a baseline and do the migration on a separate feature branch.
