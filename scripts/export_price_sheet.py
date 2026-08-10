#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = ROOT_DIR / "catalog-products.js"
DEFAULT_OUTPUT = ROOT_DIR / "price-sheet-template.csv"

FIELDNAMES = [
    "id",
    "Product Name",
    "Brand",
    "Main Category",
    "Subcategory",
    "Size / Unit",
    "Price",
    "Benchmark Price",
    "Benchmark Source",
    "Benchmark URL",
    "Last Checked",
    "Pricing Note",
]


def load_catalog(catalog_path: Path) -> list[dict]:
    text = catalog_path.read_text(encoding="utf-8")
    match = re.search(
        r"window\.RESTOQ_CATALOG_PRODUCTS\s*=\s*(\[.*\])\s*;\s*$",
        text,
        re.DOTALL,
    )
    if not match:
        raise ValueError(f"Could not find RESTOQ_CATALOG_PRODUCTS in {catalog_path}")
    return json.loads(match.group(1))


def export_price_sheet(catalog_path: Path, output_path: Path) -> int:
    products = load_catalog(catalog_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDNAMES)
        writer.writeheader()
        for product in products:
            writer.writerow(
                {
                    "id": product.get("id", ""),
                    "Product Name": product.get("name", ""),
                    "Brand": product.get("brand", ""),
                    "Main Category": product.get("category", ""),
                    "Subcategory": product.get("subcategory", ""),
                    "Size / Unit": product.get("unit", ""),
                    "Price": product.get("price", ""),
                    "Benchmark Price": "",
                    "Benchmark Source": "",
                    "Benchmark URL": "",
                    "Last Checked": "",
                    "Pricing Note": "",
                }
            )

    return len(products)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export the Restoq catalog to a Google Sheets-ready price CSV."
    )
    parser.add_argument(
        "--catalog",
        default=DEFAULT_CATALOG,
        type=Path,
        help="Path to catalog-products.js",
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_OUTPUT,
        type=Path,
        help="Output CSV path",
    )
    args = parser.parse_args()

    count = export_price_sheet(args.catalog, args.output)
    print(f"Exported {count} products to {args.output}")


if __name__ == "__main__":
    main()
