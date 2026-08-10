# Live Price Sync

Restoq can keep product prices in Google Sheets and load them into the website at runtime.
The site still falls back to `catalog-products.js` when no sheet URL is configured or the sheet cannot be reached.

## Setup

1. Export the current catalog to a sheet-ready CSV:

   ```powershell
   python scripts/export_price_sheet.py
   ```

2. Upload or import `price-sheet-template.csv` into Google Sheets.

3. Keep the `id` column unchanged. The website matches live prices by this stable product ID.

4. Edit the `Price` column whenever a product price changes.

5. In Google Sheets, use `File > Share > Publish to web`, choose CSV output, and copy the published CSV URL.

6. Paste the CSV URL into `price-config.js`:

   ```js
   window.RESTOQ_PRICE_CONFIG = {
     sheetUrl: "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv",
     cacheBustMinutes: 5,
   };
   ```

The page requests the sheet with a fresh cache-busting version on every sync. It also checks again every `cacheBustMinutes`, so a refresh or an already-open page can pick up recent edits without rebuilding the site.

## Required Columns

The live price sheet must include:

- `id`
- `Price`

These optional columns are kept for price review and sourcing:

- `Benchmark Price`
- `Benchmark Source`
- `Benchmark URL`
- `Last Checked`
- `Pricing Note`

## Price Review Workflow

Use Supermart as the first benchmark for Lagos supermarket-style pricing. If the exact brand and size is missing, use a close Lagos-facing retail source such as Shoprite, PricePally, or Jumia, and write the reason in `Pricing Note`.

For every price update:

- Match the exact product brand and size before changing `Price`.
- Put the source shelf price in `Benchmark Price`.
- Add the retailer name in `Benchmark Source`.
- Add the product or category URL in `Benchmark URL`.
- Add the review date in `Last Checked`.
- Use `Pricing Note` for substitutions, pack-size conversion, or unavailable exact matches.

Do not update the live `Price` from a benchmark if the product size, pack count, or brand does not match without documenting the conversion.
