# Onloop Handoff

## Current State
- Static Loop website with two pages: `index.html` for the homepage and `basket.html` for product ordering.
- Shared styling lives in `styles.css`.
- Product ordering, bundles, cart, review modal, onboarding, and WhatsApp checkout live in `app.js`.
- Shared mobile/header menu behavior lives in `site.js`.

## Key Product Page Behavior
- Users can build an order from scratch using search, category pills, and product quantity controls.
- Users can optionally start with Quick Bundles, then remove or adjust individual products.
- Bundles are presets only; they add normal product line items to the cart and do not create separate bundle products.
- Current bundles: Foodstuff Package, Toiletries Package, Skincare Package, and Cleaning Package.
- Desktop uses a right-side sticky Current bill card.
- Mobile uses the bottom cart bar and a full-screen order review flow with a Back button.

## Recent Reversal
- Reversed the last experiment that moved Current bill into a header cart popover.
- Restored the product page `Start order` header CTA.
- Restored the desktop right-side Current bill card.
- Removed header-cart button/popover JavaScript and CSS references.

## Verification Commands
- `node --check app.js`
- `node --check site.js`
- `Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4173/`
- `Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4173/basket.html`

## Notes
- `git diff --check` may report Git line-ending normalization warnings for existing edited files.
- The in-app browser connector was unavailable in the latest session, so visual QA was done through code inspection and local HTTP checks.
