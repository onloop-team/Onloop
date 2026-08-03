# Restoq Handoff

## Current State

- This is a static Restoq website in `C:\Users\rppwo\Downloads\Onloop\Onloop`.
- Main pages:
  - `index.html`: homepage.
  - `basket.html`: product ordering page.
- Main scripts:
  - `site.js`: shared header and mobile menu behavior.
  - `app.js`: product page behavior, bundles, cart, review modal, onboarding, pagination, WhatsApp checkout.
  - `catalog-products.js`: generated product catalog used by the site.
- Main styles:
  - `styles.css`.
- Product workbook:
  - `loop_300_product_catalog.xlsx`.

## Important Business Direction

- Brand is now `Restoq`, not Loop.
- Restoq serves households and businesses.
- Product page should stay as one ordering surface for all customers.
- Do not reintroduce a separate "order for an estate" flow. Estate/company names can be used as social proof only.
- Bundles are starter baskets, not locked carts. Customers must be able to add more items or remove items.

## Recent Product Page Changes

- Product grid now uses 5 columns on desktop and 2 columns on mobile.
- Product listing has pagination:
  - `PRODUCT_PAGE_SIZE = 20`.
  - Page count summary.
  - Previous/Next controls.
  - Page number chips.
  - Mobile pagination was polished with a compact control bar.
- Search behavior:
  - When a user searches, Quick Bundles are hidden.
  - When search is cleared, Quick Bundles return.
- Quick Bundles:
  - Bundle cards can add a bundle.
  - After adding, the same bundle card shows `Remove`.
  - Removing subtracts one bundle set from the basket.
  - Bundle detail popup also supports add/remove.
- Back-to-top FAB exists on the product page and offsets above the mobile review bar.
- Product page header CTA:
  - Text: `Order on WhatsApp`.
  - Link: `https://wa.me/2348119636331?text=Hello%20Restoq%2C%20I%20would%20like%20to%20place%20an%20order%20for%20essentials.`
- Checkout WhatsApp number:
  - `WHATSAPP_NUMBER = "2348119636331"` in `app.js`.

## Recent Homepage/Content State

- Homepage is positioned around households and businesses.
- Current tagline was restored to:
  - Page title: `Restoq - Never run out.`
  - Hero headline: `Never run out of the essentials that keep life moving.`
- Site header/footer logo uses the supplied `RESTOQ.png` artwork, processed into:
  - `images/restoq-logo.png`
- Homepage has entry paths for household ordering, business restock, and Quick Bundles.
- Patrons section uses placeholder estate and company names as social proof.

## Cleaning & Home Care Update

User requested:

- Replace `Cleaning` with `Cleaning & Home Care`.
- Add about 20 popular/good Lagos-relevant products under it:
  - air fresheners
  - diffusers
  - odor eliminators
  - wipes
  - disinfectants
- Update the product sheet.
- Use real downloaded images where possible.
- Do not create fake images or AI placeholders.

### What Was Done

- `loop_300_product_catalog.xlsx` was updated.
- Existing workbook rows with `Main Category = Cleaning & Laundry` were renamed to `Cleaning & Home Care`.
- 20 Lagos-relevant products were written into workbook rows `302` through `321`.
- Product choices were grounded in current Supermart/Jumia Lagos/Nigeria listings, prioritizing recognizable brands and readily shoppable household products.
- Real product images were downloaded from Supermart/Shopify product data into `images/catalog-products/`.
- Backup created:
  - `loop_300_product_catalog.backup-cleaning-home-care-20260803-001725.xlsx`
  - `loop_300_product_catalog.backup-lagos-cleaning-20260803-004404.xlsx`
- `catalog-products.js` was regenerated and now exports `409` products via:
  - `window.RESTOQ_CATALOG_PRODUCTS`
- `app.js` now maps legacy `Cleaning & Laundry` data to `Cleaning & Home Care`.
- `categoryOrder` now uses `Cleaning & Home Care`.

### Added Workbook Rows

Rows `302` to `321`:

- Febreze Air Freshener Assorted 185 ml
- Febreze Air Freshener Assorted 300 ml
- Air Wick Freshmatic Refill Lavender & Camomile 250 ml
- Air Wick Freshmatic Refill Sparkling Citrus 250 ml
- Air Wick Air Freshener Stick Up Multi-Use Aroma Gel Assorted 30 g
- Air Wick Drummer Air Freshener Assorted Fragrances 45 g x6
- Glade Automatic Spray Refill Lavender & Vanilla 269 ml
- Glade Solid Air Freshener Clean Linen 170 g
- Glade Air Freshener Gel Lavender 70 g
- Wind Air Freshener Assorted 300 ml
- Wind Air Freshener Block 65 g x6
- Godrej Aer Power Pocket Lavender Bloom 10 g
- Top Breeze Diffuser 160 ml
- Sparkle Air Freshener Aqua Mist Magnolia Blossom 500 ml
- Dettol All-In-One Disinfectant Spray Assorted 400 ml
- Dettol Anti-Bacterial Surface Cleanser 500 ml
- Dettol Multi-Action Large Wipes x36
- Dettol Multi Action Citrus Zest Large Wipes x20
- Lysol Disinfectant Spray Lemon Breeze 354 g
- Milton Disinfectant Spray 300 ml

### Added Diffuser Rows

Rows `322` to `331`:

- Air Wick Air Freshener Stacey Solomon Serene Sunset Essential Oils Reed Diffuser 80 ml
- Air Wick Air Freshener Stacey Solomon Paradise Escape Essential Oils Reed Diffuser 80 ml
- Air Wick Air Freshener Reed Diffuser Linen & Lilac 42 ml
- Air Wick Cosy Cottage Essential Oils Reeds Diffuser 42 ml
- Air Wick Mulled Wine Essential Oils Reeds Diffuser 42 ml
- Air Wick Essential Oils Reed Diffuser Pum Packin Spice 42 ml
- Air Wick Scented Reed Diffuser Wood
- Air Wick Reed Diffuser Mistletoe & Pine Multi-Layered Fragrance 25 ml
- Air Wick Reed Diffuser Life Scents Summer Delights 30 ml
- Air Wick Freshmatic Diffuser & Refill Assorted 250 ml

### Added Drinks Rows

Rows `332` to `349`:

- Chivita Active Citrus Mixed Fruit Juice 100 cl
- Chivita Active Citrus Mixed Fruit Juice 31.5 cl x12
- Chivita Active Zest Pet 350 ml
- Chivita Active Vegetable Fruit Nectar Carrot & Orange 100 cl
- Chivita Orange Juice 100 cl
- Chivita Apple Juice 100 cl
- Chivita Pineapple Juice 100 cl
- Chivita Red Grape Juice 100 cl
- Four Cousins Natural Sweet Red Wine 75 cl
- Carlo Rossi Sweet Red Wine 75 cl
- 4th Street Sweet Red Wine 75 cl
- Baron Romero Spanish Red Wine 75 cl
- Castillo De Espana Tempranillo Garnacha 75 cl
- Four Cousins Natural Sweet Rose Wine 75 cl
- Carlo Rossi Wine Peach Flavour 75 cl
- 4th Street Sweet Rose Wine 75 cl
- Four Cousins Dry White Wine 75 cl
- 4th Street Sweet White Wine 75 cl

### Added More Red & White Wine Rows

Rows `350` to `359`:

- Toma Bodegas Lozano Fruity Red Wine 75 cl
- Castillo Grande Tempranillo Vino Tinto 75 cl
- Dominio Del Rey Sweet Red Wine 75 cl
- Casa Solis Merlot 75 cl
- Ocean Beach Californian Red Wine 75 cl
- Casillero Del Diablo Sauvignon Blanc 75 cl
- Tall Horse Chardonnay 75 cl
- Frontera Sauvignon Blanc 75 cl
- Dominio Del Rey White Wine 75 cl
- Castillo De Espana White Wine 75 cl

### Added Stationery & Office Essentials Rows

Rows `360` to `409`:

- Double A Business A4 Printing Paper 75 gsm
- Double A Business A4 Printing Paper 75 gsm x5
- Suzano Report A4 Printing Paper 75 gsm x5
- IQ A4 Paper 80 gsm
- Chamex A4 Paper 75 gsm
- Paperline A4 Paper 80 gsm
- Rotatrim Mondi A4 Paper 80 gsm
- HP Papers Everyday A4 Printing Paper 80 gsm x5
- PPC A4 Printing Paper 70 gsm x5
- Thermal Printer Paper Rolls 80 x 80 mm x50
- Eezee Biro - Blue x25
- Eezee Biro - Red
- Bic Mechanical Pencil 0.5 mm
- Helix Oxford HB Pencil x12
- Pelikan Twist Roller Pen Blue/Pink + 2 Ink Cartridges + Ink Eradictor
- Snopake Pinpoint Correction Pen
- Bic Whiteboard Marker - Black
- Bic Whiteboard Marker - Red
- M & G Whiteboard Marker Blue
- Maped Whiteboard Marker Medium x4
- Nexus Jotters
- Mead College Ruled Filler Paper 11 x 8 Inches 200 Sheets
- Rexel ColourHide Notebook Feint A5 - Pink
- Rexel ColourHide Notebook Feint A5 - Lime
- Global Notes 75 x 75 mm Sticky Notes 100 Sheets - Yellow
- Global Notes 125 x 75 mm Sticky Notes 100 Sheets - Yellow
- Elephant Sticky Note Standard 3 x 3 Melody - 500 Sheets
- Global Notes 15 x 50 mm Page Marker Brilliant Mix 100 Sheets x 5
- Rexel Active Carry Folder A4
- Envelope - A4 White
- Polypropylene Foolscap Clip Board - Blue
- Polypropylene Foolscap Clip Board - Black
- Petty Cash Voucher
- Maped Scissors Essentials Symmetrical 13 cm
- Helix Oxford Scissors 13 cm
- Rexel R30 Compact Stapler - Grey
- Maped Stapler Essentials Mini N10
- Elephant Stapler x10
- M & G 12 Digits Desktop Calculator Two Way Power MGC-02
- Sharp Electronic Calculator
- Masking Tape
- Sealing Tape 2 Inch Transparent - 130 Yards
- 0.5 Inch Tape x12
- Cellotape - Clear
- Elephant Sticko Super Glue 3 g
- Cotton Twine
- Elephant Round Paper Clip No. 1 33 mm
- Mixed Accessory Set - Clips Pins Binders
- Maped Paper Clip Dispenser + Paper Clips x100 - Black
- Paper Clips - Coloured x100

### Added Fancy Folder Rows

Rows `410` to `419`:

- Rexel Anti-Slip Folder A4 Clear x25
- Leitz Organizer Smart Folder
- Rexel Joy Five Part File
- Rexel Zipper Pocket A4 x5
- Rexel Display Book Choices A4 40 Pockets - Green
- Rexel Display Book Choices A4 40 Pockets - Black
- Rexel Ice Expanding File A4 13 Pockets - Assorted
- Rexel Folder Advance Snap In 2 Pocket - Navy Blue
- Rexel Folder Advance StayPut - Purple
- Rexel Folder Advance 4 Pocket Custom - Red

### Added Packaged Foodstuff Rows

Rows `420` to `459`:

- Nini Foods Crispy Ijebu Garri 2 kg
- Vine Dresser Foods Garri Ijebu 2 kg
- Nini Foods Yellow Garri 3 kg
- Golden Penny Garri 5 kg
- Kivo Good Time Garri Mix Vanilla Flavour 3 in 1
- Endy's Fufu Flour 2 kg
- Sofi Instant Fufu (Cassava Flour) 1 kg
- Ayoola Foods Cassava Fufu Flour 2 kg
- Niji Foods Odourless Fufu Flour 1 kg
- Vine Dresser Foods Cassava Flour Fufu 1.5 kg
- Ayoola Foods Poundo Yam Flour 900 g
- Ayoola Foods Poundo Yam Flour 1.8 kg
- Ayoola Foods Poundo Yam Flour 4.5 kg
- Nini Pure Yam Flour (Elubo Isu) 2 kg
- Todaj Soya Plantain Flour 1 kg
- Ayoola Foods Plantain Flour 1.8 kg
- Honeywell Whole Wheat Meal 900 g
- Honeywell Whole Wheat Meal 2 kg
- Honeywell Whole Wheat Meal 5 kg
- Golden Penny Goldenvita Whole Wheat Meal 10 kg
- Golden Penny Multi-Purpose Wheat Baking Flour 1 kg
- Golden Penny White Granulated Sugar 1 kg
- Dangote Refined Granulated Sugar 1 kg
- St. Louis Sugar Cubes 474 g x50
- Miller's Brown Sugar 500 g
- Checkers Custard Powder Vanilla 1 kg
- Laziz Custard Powder Vanilla Jar 2 kg
- Family Custard Milk 3 in 1 Sachet 500 g
- Devon King's Cooking Margarine Sachet 250 g
- Moi Margarine 500 g
- Simas Cooking Margarine 250 g
- Bama Mayonnaise 810 ml
- Bama Mayonnaise 236 ml
- Bama Mayonnaise 385 ml
- Three Crowns Evaporated Milk 160 g
- Hollandia Full Cream Evaporated Milk 190 g
- Titus Sardines 125 g
- Geisha Mackerel In Tomato Sauce 155 g
- Heinz Baked Beans 415 g
- Green Giant Niblets Sweetcorn 340 g

### Notes

- No fake or AI placeholder product images were used.
- SerpAPI is no longer needed for these added rows because the images were downloaded directly from resolved Supermart product data.
- The generator still intentionally skips workbook rows without local image paths.

## Current Dirty Worktree Notes

There are many modified files from the active design/product work. Do not reset or revert broadly.

Known changed areas include:

- `app.js`
- `basket.html`
- `index.html`
- `styles.css`
- `site.js`
- `catalog-products.js`
- `scripts/download_product_images.py`
- `scripts/generate_catalog_products.py`
- docs in `docs/`
- favicon/logo image files
- workbook files

Untracked items seen recently:

- `images/restoq-favicon.png`
- `images/restoq-logo.png`
- `tmp_restoq_brand_doc/`

## Verification Already Run Recently

- `node --check app.js` passed after the latest JS changes.
- `basket.html` returned `200` locally after recent product page edits.
- `index.html` returned `200` locally after recent homepage edits.

## Cautions

- Do not generate fake product images.
- Do not use AI placeholder product cards.
- Only add new products to the site catalog when there is a local image path in the workbook.
- The generator intentionally skips workbook rows without local image paths.
- The in-app browser / Node REPL browser path has been unreliable in this environment, so most verification has used syntax checks and local HTTP checks.
