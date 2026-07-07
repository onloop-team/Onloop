# Design Tokens and Design Philosophy

## Purpose

This document defines the visual language for the Loop website. It should guide future changes to color, spacing, typography, layout, components, and interaction states so the site continues to feel consistent.

Loop should feel calm, practical, warm, and trustworthy. It is a home essentials ordering experience, not a loud marketplace or a generic ecommerce template. The UI should help customers quickly understand the service, build a basket, and continue to WhatsApp with confidence.

## Design Principles

### Calm Utility

The interface should be easy to scan and repeat-use friendly. Customers are ordering everyday necessities, so the design should feel organized, direct, and reassuring.

Use clear section hierarchy, compact product information, predictable controls, and restrained visual effects.

### Warmth Without Noise

Loop should feel human and welcoming, especially in the hero and onboarding modal. Warmth comes from cream backgrounds, amber accents, soft cards, product imagery, and friendly copy.

Avoid excessive decoration, heavy gradients, oversized illustrations, or visual clutter that competes with the ordering task.

### WhatsApp-First Trust

The site is a preparation and handoff tool. It should make the order feel structured before WhatsApp confirmation.

Keep totals, recurrence, delivery notes, required fields, and validation messages clear. Do not imply that payment, inventory, or delivery is finalized on the website.

### Mobile-First Ordering

The product and cart experience must remain usable on narrow screens. Mobile customers need fast quantity adjustments, visible cart totals, and full-width primary actions where space is tight.

Layouts should collapse intentionally rather than simply shrinking desktop patterns.

## Source Tokens

Current tokens are defined in `styles.css` under `:root`.

```css
:root {
  --loop-teal: #0d6e6e;
  --loop-amber: #f2994a;
  --loop-ink: #1f2d2d;
  --loop-cream: #fbf7f0;
  --loop-sage: #bfe3e0;
  --white: #ffffff;
  --muted-text: #667575;
  --border-soft: rgba(31, 45, 45, 0.12);
  --shadow-soft: 0 18px 45px rgba(31, 45, 45, 0.1);
  --radius: 18px;
}
```

## Color Tokens

### `--loop-teal`

Value: `#0d6e6e`

Primary brand color. Use for:

- Primary buttons.
- Active category and recurrence states.
- Eyebrow text.
- Brand emphasis.
- Important accents that need to feel stable and trustworthy.

Do not overuse teal as a full-page wash. It should anchor actions and status, not dominate every surface.

### `--loop-amber`

Value: `#f2994a`

Warm accent color. Use for:

- Product badges.
- Mobile cart button background.
- Onboarding accents.
- Secondary emphasis where warmth is useful.

Amber should support the teal system. Avoid making amber the primary action color unless the component is already in a dark or teal context.

### `--loop-ink`

Value: `#1f2d2d`

Primary text and dark surface color. Use for:

- Headings.
- Body text where high emphasis is needed.
- Dark mobile cart bar background.
- Icon text and strong labels.

### `--loop-cream`

Value: `#fbf7f0`

Primary page background. Use for:

- Body background.
- Soft section backgrounds.
- Slightly deeper cream footer backgrounds when a section needs quiet separation.
- Review footer background.
- Product image placeholders or light product surfaces.

Cream keeps the experience warm. Avoid replacing it with pure white across the full page, or the brand will feel colder and more generic.

### `--loop-sage`

Value: `#bfe3e0`

Soft supporting color. Use for:

- Step number backgrounds.
- Light active states.
- Gentle decorative or background accents.

Sage is a supporting color, not a primary action color.

### `--white`

Value: `#ffffff`

Primary card and control surface. Use for:

- Product cards.
- Cart cards.
- Testimonial cards.
- Modal panels.
- Inputs and secondary buttons.

### `--muted-text`

Value: `#667575`

Secondary text. Use for:

- Supporting paragraphs.
- Helper text.
- Product metadata.
- Delivery notes.
- Less prominent labels.

Do not use muted text for required instructions, prices, or validation errors.

### `--border-soft`

Value: `rgba(31, 45, 45, 0.12)`

Default border color for cards, controls, inputs, and dividers.

### Shadow Tokens

`--shadow-soft`: `0 18px 45px rgba(31, 45, 45, 0.1)`

Use this for larger elevated surfaces such as the hero panel and mobile cart bar. Smaller surfaces should use lighter custom shadows, as existing product and card styles do.

## Typography

### Font Stack

The site uses Inter for body text and Manrope for semantic headings, both from Google Fonts with system fallbacks:

```css
body {
font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

h1,
h2,
h3 {
  font-family: Manrope, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

### Type Philosophy

Typography should be clear, compact, and confident.

Use large expressive type only in the hero or primary page headings. Inside cards, modals, sidebars, and forms, use tighter headings that preserve scanability.

### Current Type Patterns

- Body line height: `1.5`
- Hero H1: `clamp(2.25rem, 9vw, 5.4rem)`
- Section H2: `clamp(1.65rem, 4vw, 2.45rem)`
- Card H3: `1rem`
- Eyebrow text: `0.78rem`, uppercase, weight `800`
- Muted helper text: commonly `0.82rem` to `0.95rem`

### Typography Rules

- Letter spacing should stay `0`, including headings and labels.
- Avoid viewport-width-only font scaling except where existing `clamp()` patterns are used for major headings.
- Do not use hero-scale type inside cards, product tiles, cart panels, or modals.
- Use font weight for hierarchy before adding extra colors.

## Spacing and Layout

### Page Shell

The page shell uses:

```css
width: min(1180px, calc(100% - 32px));
margin: 0 auto;
padding-bottom: 96px;
```

At wider breakpoints, horizontal breathing room increases. At mobile breakpoints, the shell narrows to preserve usable content width.

The homepage should keep at least 16px of side spacing on every viewport. Product/order pages may use tighter mobile spacing when the task surface needs more horizontal room.

### Section Spacing

Default section spacing:

```css
.section-pad {
  padding: 48px 0;
}
```

Large screens increase this to `68px 0`. Small screens reduce it to `30px 0`.

### Layout Philosophy

Use full-width page sections with constrained inner content. Avoid placing major page sections inside decorative cards. Cards should be reserved for repeated items, tools, modals, and summaries.

The site uses:

- Hero split layout on larger screens.
- Product grid plus sticky cart on desktop.
- Single-column product flow plus sticky mobile cart bar on smaller screens.
- Bottom-sheet style review modal on narrow screens.

## Radius

Base radius token:

```css
--radius: 18px;
```

Current usage:

- Standard cards: `var(--radius)`.
- Product image blocks: `18px`.
- Hero panel: larger decorative radius around `28px`.
- Pills and buttons: `999px`.
- Mobile/narrow surfaces: often reduced to `16px`.

### Radius Rules

- Use `var(--radius)` for standard cards and panels.
- Use `999px` only for pills, badges, and rounded CTA buttons.
- Reduce radius on very small screens to keep surfaces from feeling bulky.
- Do not nest card-like rounded surfaces unless the inner element is a functional control or repeated item.

## Buttons and Actions

### Base Button

Buttons use inline-flex alignment, minimum touch height, rounded pill shape, bold labels, and subtle hover movement.

Primary buttons use a teal gradient:

```css
background: linear-gradient(135deg, var(--loop-teal), #108383);
color: var(--white);
```

Secondary and ghost buttons use white backgrounds, soft borders, and ink text.

### Button Rules

- Use primary buttons for the main next action in a section or modal.
- Use secondary or ghost buttons for alternate paths.
- On mobile, major action groups should become full-width when space is constrained.
- Disabled buttons should remain visibly disabled through opacity and cursor state.
- Avoid adding extra button color variants unless a new semantic need exists.

## Cards and Surfaces

Shared surface style applies to product cards, cart cards, testimonial cards, onboarding cards, and review panels:

```css
border: 1px solid var(--border-soft);
border-radius: var(--radius);
background: var(--white);
box-shadow: 0 10px 28px rgba(31, 45, 45, 0.06);
```

### Card Rules

- Product cards should prioritize image, name, category/unit metadata, price, and quantity controls.
- Cart cards should prioritize subtotal, service charge, delivery note, grand total, and review action.
- Testimonial cards should stay short, credible, and easy to replace with verified quotes.
- FAQ items should use simple dividers rather than heavy card surfaces.
- Modal panels may have stronger elevation than ordinary cards because they sit above a backdrop.

## Product UI

Product cards are functional shopping controls, not marketing cards.

Product card priorities:

1. Recognizable product image.
2. Product name.
3. Category and unit.
4. Price.
5. Quantity control.
6. Badge if useful.

### Product Rules

- Product images should be square and stable to prevent layout shift.
- Badges should be short.
- Quantity controls must stay easy to tap.
- Product card layout should stay as a compact two-column grid on mobile.
- Avoid long descriptive copy inside product cards.

## Cart and Checkout UI

The cart is a decision-support surface. It should always make the cost state obvious.

Required cart information:

- Selected item count.
- Current recurrence.
- Item lines.
- Subtotal.
- Service charge.
- Minimum order warning when applicable.
- Delivery fee note.
- Grand total.
- Review order action.

Checkout remains WhatsApp-first, so wording must avoid implying final payment or guaranteed delivery.

## Onboarding Modal Design

The onboarding modal should feel polished and welcoming without blocking the customer forever.

Visual elements:

- Soft dark backdrop with amber warmth.
- White/cream layered card.
- Clear welcome heading.
- Three step cards.
- Primary `Start shopping` action.

Behavioral principle:

Soft dismissals are treated differently from true onboarding completion. A customer who closes quickly may see onboarding again, up to three total soft dismissals.

## Responsive Breakpoints

Current CSS uses these major breakpoints:

- `min-width: 700px`: wider page shell, desktop-capable hero grid, visible nav links.
- `min-width: 980px`: larger section spacing, product layout with desktop cart.
- `max-width: 979px`: mobile product browsing adjustments.
- `max-width: 620px`: product cards stay two columns with tighter card spacing and controls.
- `max-width: 520px`: mobile review modal, full-width hero buttons, tighter sections.
- `max-width: 430px`: tighter header, hero, product, mobile cart, and onboarding spacing.
- `max-width: 370px`: extra compact product card controls.
- `max-width: 340px`: smallest-screen typography and layout safeguards.

### Responsive Rules

- Start from mobile usability, then enhance layout on larger screens.
- Keep touch targets around 44px or taller where possible.
- Preserve stable dimensions for product cards and quantity controls.
- Prefer stacking actions over squeezing text.
- Test modal fit on narrow screens after any modal content change.

## Motion and Interaction

Motion should be subtle and functional.

Current patterns:

- Buttons move up slightly on hover.
- Product cards lift slightly on hover.
- Product images scale slightly on card hover.

Rules:

- Keep animations short and quiet.
- Avoid continuous decorative motion.
- Do not let hover effects shift layout.
- Ensure interactive states remain usable without hover on touch devices.

## Accessibility Philosophy

Accessibility should be built into the component patterns, not patched later.

Current expectations:

- Visible focus states.
- Semantic buttons and links.
- Clear form labels.
- `aria-label` for icon-only buttons and quantity controls.
- `aria-pressed` for toggle-style category and recurrence controls.
- `aria-live` for checkout errors.
- Dialog roles for modals.

Future improvements should include:

- Modal focus trapping.
- Focus restoration after modal close.
- More robust keyboard testing for product quantity controls.
- Better screen reader validation announcements.

## Content Voice

Loop copy should be:

- Direct.
- Warm.
- Practical.
- Specific about what happens next.

Preferred phrasing:

- "Confirm on WhatsApp"
- "Delivery fee will be confirmed on WhatsApp"
- "Build your basket"
- "Choose your essentials"

Avoid:

- Overpromising delivery or availability.
- Payment language that implies completed online checkout.
- Generic ecommerce filler.
- Long instructional text inside the interface.

## Adding New UI

When adding a new UI element:

1. Reuse existing tokens before adding new values.
2. Match an existing component pattern where possible.
3. Check mobile first.
4. Keep action hierarchy clear.
5. Confirm text fits inside controls.
6. Avoid adding new decorative layers unless they clarify hierarchy.
7. Verify with `node --check app.js` if JavaScript changes are involved.
8. Load the page locally and inspect desktop and mobile layouts.

## When to Add New Tokens

Add a new token only when:

- A value is reused in multiple places.
- The value expresses a meaningful design role.
- Existing tokens cannot describe the role clearly.

Do not add tokens for one-off decorations.

Potential future token candidates:

- `--space-*` spacing scale.
- `--font-size-*` type scale.
- `--radius-sm`, `--radius-md`, `--radius-lg`.
- `--shadow-card`, `--shadow-modal`.
- `--color-error` for validation messaging.

## Current Gaps

The current design system is CSS-variable based but not fully tokenized. Spacing, font sizes, shadows, and some color variants are still defined directly in selectors.

This is acceptable for the current app size. If the interface grows, the next design-system step should be extracting repeated spacing, type, radius, and shadow values into named tokens.

## References

- `styles.css`
- `index.html`
- `basket.html`
- `app.js`
- `docs/loop-first-lauch-decision.md`
