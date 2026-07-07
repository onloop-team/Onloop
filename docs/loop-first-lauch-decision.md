# ADR 0001: Static WhatsApp-First Commerce Website Architecture

## Status

Accepted

## Date

2026-07-07

## Decision Owners

Loop website maintainers

## Context

Loop is a lightweight home essentials ordering website. The current product experience lets customers browse household items, build a basket, choose a delivery rhythm, review order details, and send the completed order to Loop through WhatsApp for manual confirmation.

The website is implemented as a static frontend with four primary files:

- `index.html` defines the informational home page, including hero, how-it-works, FAQ, and links into ordering.
- `basket.html` defines the ordering page, including product browsing, cart, onboarding, review, checkout form, and script entry point.
- `styles.css` defines responsive layout, brand presentation, product cards, carts, modals, forms, and mobile behavior.
- `app.js` owns product data, UI state, rendering, validation, onboarding persistence, basket logic, pricing, and WhatsApp handoff.

There is no build system, package manager, backend API, database, server-side rendering layer, payment provider, or client-side framework in the current implementation. The site can run from a static file server such as `python -m http.server`.

The business flow is intentionally WhatsApp-first. The website collects enough information to prepare a structured order message, but Loop confirms availability, delivery fees, and payment details manually after the customer opens WhatsApp.

## Decision

Use a static HTML, CSS, and vanilla JavaScript architecture for the current Loop website.

Keep product catalog data, cart state, pricing calculations, recurrence selection, onboarding logic, checkout validation, and WhatsApp message construction in `app.js`, loaded only by `basket.html`.

Keep persistent browser state limited to onboarding localStorage values:

- `loop_has_seen_onboarding`: set to `true` only when the customer clicks `Start shopping`.
- `loop_onboarding_close_count`: incremented when the customer dismisses onboarding through X, backdrop, or Escape.

Keep cart state in memory only. Do not persist basket contents across reloads yet.

Use WhatsApp deep links through `https://wa.me/<number>?text=<encoded message>` as the checkout handoff instead of processing orders directly on the website.

Use static image assets under `images/` for the brand mark and product visuals. Use responsive CSS rather than a component library.

## Goals

- Present Loop as a polished, warm, and trustworthy home restock assistant.
- Let customers build an order with minimal friction on desktop and mobile.
- Support recurring ordering language without requiring account creation.
- Avoid backend complexity while the ordering operation is still manually confirmed.
- Keep deployment simple enough for static hosting.
- Make the codebase easy to inspect and edit without a build step.

## Non-Goals

- Online payment processing.
- Inventory management.
- Account creation or authentication.
- Server-side order storage.
- Admin product management.
- Multi-vendor marketplace features.
- Framework-level routing or componentization.
- Persistent cart recovery across sessions.

## Current User Flow

1. Customer lands on the homepage.
2. Customer follows a CTA to `basket.html`.
3. If eligible, customer sees the onboarding modal on the basket page.
4. Customer clicks `Start shopping` or dismisses onboarding.
5. Customer browses products by category or search.
6. Customer adjusts product quantities.
7. Cart summary updates with subtotal, 6 percent service charge, grand total, and minimum order validation.
8. Customer opens the order review modal.
9. Customer chooses recurrence: one-time, weekly, biweekly, or monthly.
10. Customer enters required details: full name, phone number, and delivery area.
11. Customer optionally adds full address, preferred delivery day, and notes.
12. Customer clicks `Checkout on WhatsApp`.
13. The browser opens WhatsApp with a prefilled structured order message.

## Architecture Details

### Document Structure

`index.html` contains the semantic home page:

- Sticky header with logo, navigation links, and primary CTA.
- Hero section explaining the Loop value proposition.
- How-it-works section.
- FAQ section.
- Footer.

`basket.html` contains the ordering experience:

- Sticky header with links back to home sections.
- Product section containing search, category tabs, product grid, and desktop cart.
- Mobile cart bar.
- Onboarding modal.
- Review and checkout modal.

The basket page intentionally keeps modal shells in HTML while allowing JavaScript to render dynamic content inside them.

### Styling

`styles.css` defines the full visual system:

- Brand color variables for teal, amber, ink, cream, sage, white, muted text, borders, shadow, and radius.
- Responsive page shell and section spacing.
- Header, hero, product, cart, FAQ, modal, and review layouts.
- Mobile cart bar.
- Onboarding modal polish and mobile fit.
- Accessible focus states.

The design avoids requiring a CSS framework. This keeps page weight low and avoids introducing build tooling for a small static multi-page experience.

### JavaScript State

`app.js` uses a single in-memory `state` object:

```js
const state = {
  selectedCategory: "All",
  searchQuery: "",
  cart: [],
  recurrence: "Monthly",
};
```

The state is rendered into the DOM through explicit render functions:

- `renderCategories`
- `renderProducts`
- `renderCartSummary`
- `renderReview`
- `renderRecurrence`
- `renderOnboarding`
- `render`

This approach is simple and predictable for the current app size. Because there is no framework, the code manually updates DOM strings and event listeners.

### Product Catalog

Products are defined directly in `app.js` as JavaScript objects containing:

- `id`
- `name`
- `category`
- `unit`
- `price`
- optional `badge`

Each product receives an image path derived from its `id`:

```js
image: `images/products/${product.id}.png`
```

This convention keeps the catalog concise but requires image filenames to match product IDs.

### Cart and Pricing

The cart stores selected product snapshots with quantity, unit, category, and price. The cart does not persist across reloads.

Pricing rules are currently client-side constants:

- Minimum order: NGN 20,000.
- Service charge: 6 percent of subtotal.
- Delivery fee: not calculated on-site and confirmed through WhatsApp.

The grand total is calculated as:

```text
grand total = subtotal + rounded service charge
```

This is adequate for estimate and handoff, but server-side validation would be required before automated payment or order fulfillment.

### Search and Category Filtering

Category tabs are derived from product data. Search filters by product name, category, and unit.

Filtering is done in-memory on the client, which is acceptable for the current small product catalog. A larger catalog may require pagination, server-backed search, or a generated static index.

### Review and Checkout

Checkout is handled inside a review modal. The form uses native inputs and custom validation messages.

Required fields:

- Full name.
- Phone number.
- Delivery area/location.

Optional fields:

- Full delivery address.
- Preferred delivery day.
- Additional note.

Before checkout, validation confirms:

- Basket is not empty.
- Basket subtotal meets the minimum order amount.
- Required customer details are present.
- A recurrence option exists.

After validation, `buildWhatsAppMessage` creates a structured plain text message containing customer details, recurrence, item lines, subtotal, service charge, grand total, and notes. `submitCheckout` opens WhatsApp in a new tab.

### Onboarding

The onboarding modal is designed to introduce first-time customers to Loop without permanently hiding the modal after a quick dismissal.

The accepted persistence rules are:

- Show onboarding when `loop_has_seen_onboarding` is not `true` and `loop_onboarding_close_count` is less than `3`.
- Set `loop_has_seen_onboarding=true` only when the customer clicks `Start shopping`.
- Increment `loop_onboarding_close_count` for X, backdrop click, and Escape.
- Stop showing onboarding after 3 soft dismissals.

This gives customers multiple chances to understand the service while respecting repeated dismissal intent.

## Accessibility Decisions

The site uses several accessibility-oriented patterns:

- Semantic landmarks such as `header`, `main`, `section`, `nav`, `aside`, and `footer`.
- Modal containers with `role="dialog"` and `aria-modal="true"`.
- `aria-labelledby` for modal titles.
- Product quantity controls with descriptive `aria-label` values.
- Category and recurrence buttons with `aria-pressed`.
- Form error text with specific field associations through `data-error-for`.
- Checkout error area with `aria-live="polite"`.
- Visible focus styling through `:focus-visible`.

Known accessibility gaps:

- Modal focus trapping is not implemented.
- Focus restoration after closing modals is not implemented.
- The Escape key can close multiple open modal states in sequence because both review and onboarding checks run in the same handler.
- Dynamically rendered HTML should continue to avoid unescaped user-provided strings if user-generated catalog data is introduced later.

## Security and Privacy Considerations

Current security posture is acceptable for a static prototype but limited:

- No payment data is collected.
- No account credentials are collected.
- Customer order data is not stored by the site.
- Customer details are transmitted to WhatsApp through a generated URL.

Risks and constraints:

- Customer details appear in the WhatsApp deep link query string before handoff.
- All pricing rules are client-side and can be modified by a user.
- Product data is public and client-side.
- There is no server-side validation or audit trail.

If Loop adds payments, automated order acceptance, inventory reservation, or customer accounts, this architecture must be revisited.

## Performance Considerations

The static architecture should be fast for the current scope:

- No JavaScript framework runtime.
- No build output.
- Small in-memory catalog.
- Local product images.
- Lazy-loaded product images.

Potential performance risks:

- Product images can dominate load time if not optimized.
- Rendering with `innerHTML` is fine for the current catalog size but may become inefficient with a large catalog.
- Google Fonts introduces external network dependency and possible render delay.

Recommended performance guardrails:

- Compress product images.
- Keep filenames stable and image dimensions consistent.
- Consider responsive image sizes if the catalog grows.
- Avoid adding large third-party libraries without a clear need.

## Deployment

The website can be deployed to any static hosting provider.

Minimum deployment artifact:

- `index.html`
- `basket.html`
- `styles.css`
- `app.js`
- `images/`
- `docs/` may be included or excluded depending on hosting preference.

Local development can use:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173/
http://127.0.0.1:4173/basket.html
```

## Alternatives Considered

### Add a Frontend Framework

Rejected for now.

React, Vue, Svelte, or similar frameworks would improve component structure as the UI grows, but they would also introduce a build step, dependencies, and deployment complexity. The current app is small enough for direct DOM rendering.

### Use a Backend API

Rejected for now.

A backend would support persisted carts, validated pricing, order storage, inventory, and admin workflows. The current operational model confirms orders manually on WhatsApp, so a backend would be premature unless Loop needs reporting, payment, automation, or scale.

### Use a Hosted Commerce Platform

Rejected for now.

Shopify, WooCommerce, or similar tools could provide catalog, checkout, payment, inventory, and order management. They may be heavier than needed for a pilot focused on recurring household restock and manual WhatsApp confirmation.

### Persist Cart in localStorage

Deferred.

Persisting the cart would improve reload recovery but introduces questions around stale prices, old product availability, and customer confusion if abandoned baskets reappear. Current cart state remains in memory until pricing and availability rules become more mature.

### Process Payment on Website

Rejected for now.

Payment providers would require stronger order validation, terms, error handling, reconciliation, and customer support processes. Manual WhatsApp confirmation is better aligned with the current pilot.

## Consequences

Positive consequences:

- Very simple hosting and development model.
- Low dependency risk.
- Fast initial load and low runtime overhead.
- Easy for maintainers to inspect and change copy, products, and styles.
- Business operations remain flexible because final confirmation happens manually.

Negative consequences:

- No server-side validation.
- No order persistence.
- No admin interface.
- No cart recovery after reload.
- No automated payment.
- Larger future changes may be harder without component boundaries.

## Future Change Triggers

Revisit this ADR if any of the following become true:

- Product catalog grows enough to need admin management.
- Loop needs real-time inventory or delivery fee calculation.
- Orders must be stored before WhatsApp handoff.
- Customers need accounts or recurring subscription management.
- Payments move onto the website.
- Multiple locations, pricing zones, or delivery calendars are introduced.
- The UI grows enough that manual DOM rendering becomes difficult to maintain.

## Recommended Next Decisions

Future ADRs should cover:

- Product catalog source of truth.
- Order and customer data storage.
- Payment provider selection.
- Delivery fee calculation.
- Cart persistence policy.
- Accessibility requirements for modal focus management.
- Analytics and privacy policy.
- Static hosting provider and deployment workflow.

## Verification

Current verification should include:

- `node --check app.js`
- Home page loads over local HTTP with status `200`.
- Basket page loads over local HTTP with status `200`.
- Home page CTAs navigate to `basket.html`.
- Onboarding appears for first eligible visit on `basket.html`.
- `Start shopping` sets `loop_has_seen_onboarding=true`, closes the modal, and scrolls to products.
- X, backdrop, and Escape increment `loop_onboarding_close_count`.
- Onboarding reappears after 1 or 2 soft dismissals.
- Onboarding stops appearing after 3 soft dismissals.
- Products render with images and prices.
- Category filtering works.
- Search works.
- Quantity increment, decrement, and remove actions update desktop and mobile cart summaries.
- Minimum order validation blocks checkout below NGN 20,000.
- Required checkout fields show validation messages.
- WhatsApp checkout opens a URL containing the encoded order message.
- Layout remains usable at common mobile widths.

## References

- `index.html`
- `basket.html`
- `styles.css`
- `app.js`
- `images/`
