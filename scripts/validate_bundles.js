#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const catalogSource = fs.readFileSync(path.join(root, "catalog-products.js"), "utf8");
const catalogMatch = catalogSource.match(
  /window\.RESTOQ_CATALOG_PRODUCTS\s*=\s*(\[.*\])\s*;\s*$/s
);

if (!catalogMatch) throw new Error("Could not read catalog-products.js");

const products = JSON.parse(catalogMatch[1]);
const productById = new Map(products.map((product) => [product.id, product]));
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const start = appSource.indexOf("const bundles = [");
const end = appSource.indexOf("\nconst sanitizeSavedCart", start);

if (start < 0 || end < 0) throw new Error("Could not locate bundle definitions in app.js");

const bundleSource = appSource.slice(start, end);
const result = vm.runInNewContext(
  `${bundleSource}\n({ bundles, issues: validateBundleDefinitions() });`,
  { productById, console }
);

if (result.issues.length) {
  result.issues.forEach((issue) => console.error(`- ${issue}`));
  process.exitCode = 1;
} else {
  console.log(`Validated ${result.bundles.length} bundles with no integrity issues.`);
}
