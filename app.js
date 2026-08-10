const WHATSAPP_NUMBER = "2348119636331";
const BRAND_NAME = "Restoq";
const ONBOARDING_KEY = "restoq_has_seen_onboarding";
const ONBOARDING_CLOSE_COUNT_KEY = "restoq_onboarding_close_count";
const LEGACY_ONBOARDING_KEY = "loop_has_seen_onboarding";
const LEGACY_ONBOARDING_CLOSE_COUNT_KEY = "loop_onboarding_close_count";
const CART_STORAGE_KEY = "restoq_cart_state";
const ONBOARDING_CLOSE_LIMIT = 3;
const MINIMUM_ORDER_AMOUNT = 20000;
const SERVICE_CHARGE_RATE = 0.06;
const PRODUCT_PAGE_SIZE = 20;
const pageParams = new URLSearchParams(window.location.search);
const requestedAudience = String(pageParams.get("for") || "").toLowerCase();
const initialOrderType = requestedAudience === "business" ? "business" : "household";

if (
  localStorage.getItem(LEGACY_ONBOARDING_KEY) === "true" &&
  localStorage.getItem(ONBOARDING_KEY) !== "true"
) {
  localStorage.setItem(ONBOARDING_KEY, "true");
}

if (
  !localStorage.getItem(ONBOARDING_CLOSE_COUNT_KEY) &&
  localStorage.getItem(LEGACY_ONBOARDING_CLOSE_COUNT_KEY)
) {
  localStorage.setItem(
    ONBOARDING_CLOSE_COUNT_KEY,
    localStorage.getItem(LEGACY_ONBOARDING_CLOSE_COUNT_KEY)
  );
}

const catalogProducts = Array.isArray(window.RESTOQ_CATALOG_PRODUCTS)
  ? window.RESTOQ_CATALOG_PRODUCTS
  : Array.isArray(window.LOOP_CATALOG_PRODUCTS)
  ? window.LOOP_CATALOG_PRODUCTS
  : [];

const categoryLabels = {
  Foodstuffs: "Foodstuff & Pantry",
  "Cleaning & Laundry": "Cleaning & Home Care",
  Beverages: "Drinks",
  Skincare: "Skincare & Personal Care",
  Fragrance: "Skincare & Personal Care",
  "Dog Food": "Pets",
};

const getDisplayCategory = (category) => categoryLabels[category] || category;

let products = catalogProducts.map((product) => ({
  ...product,
  brand: product.brand || "",
  originalCategory: product.category,
  category: getDisplayCategory(product.category),
  subcategory: product.subcategory || "",
}));
let productById = new Map(products.map((product) => [product.id, product]));

const priceConfig = window.RESTOQ_PRICE_CONFIG || {};
const LIVE_PRICE_SHEET_URL = String(priceConfig.sheetUrl || "").trim();
const LIVE_PRICE_CACHE_BUST_MINUTES = Number.isFinite(
  Number(priceConfig.cacheBustMinutes)
)
  ? Number(priceConfig.cacheBustMinutes)
  : 5;

const normalizeCsvHeader = (value) =>
  String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

const normalizeLivePrice = (value) => {
  const cleanedValue = String(value || "")
    .replace(/ngn/gi, "")
    .replace(/[\u20a6,\s]/g, "")
    .trim();
  const price = Number(cleanedValue);
  return Number.isFinite(price) && price > 0 ? Math.round(price) : null;
};

const parseCsvRows = (csvText) => {
  const rawRows = [];
  let currentRow = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentCell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      currentRow.push(currentCell);
      if (currentRow.some((cell) => cell.trim())) rawRows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  if (currentRow.some((cell) => cell.trim())) rawRows.push(currentRow);

  const [headers = [], ...rows] = rawRows;
  return rows.map((row) =>
    Object.fromEntries(
      headers.map((header, index) => [
        String(header || "").trim(),
        String(row[index] || "").trim(),
      ])
    )
  );
};

const getCsvField = (row, fieldNames) => {
  const targetFields = fieldNames.map(normalizeCsvHeader);
  const match = Object.entries(row).find(([key]) =>
    targetFields.includes(normalizeCsvHeader(key))
  );
  return match ? match[1] : "";
};

const parseLivePriceCsv = (csvText) => {
  const livePrices = new Map();

  parseCsvRows(csvText).forEach((row) => {
    const id = getCsvField(row, ["id", "product id", "productid"]).trim();
    const price = normalizeLivePrice(
      getCsvField(row, ["price", "current price", "live price", "site price"])
    );

    if (!id || price === null) return;

    livePrices.set(id, {
      price,
      benchmarkSource: getCsvField(row, ["benchmark source", "source"]),
      benchmarkUrl: getCsvField(row, ["benchmark url", "source url", "url"]),
      lastChecked: getCsvField(row, ["last checked", "checked at"]),
      note: getCsvField(row, ["pricing note", "note"]),
    });
  });

  return livePrices;
};

const getLivePriceSheetUrl = () => {
  if (!LIVE_PRICE_SHEET_URL) return "";
  const separator = LIVE_PRICE_SHEET_URL.includes("?") ? "&" : "?";
  return `${LIVE_PRICE_SHEET_URL}${separator}restoqPriceVersion=${Date.now()}`;
};

const fetchLivePriceMap = async () => {
  const livePriceUrl = getLivePriceSheetUrl();
  if (!livePriceUrl || typeof fetch !== "function") return new Map();

  try {
    const response = await fetch(livePriceUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`Price sheet returned ${response.status}`);
    return parseLivePriceCsv(await response.text());
  } catch (error) {
    console.warn("Restoq live price sync skipped:", error);
    return new Map();
  }
};

const bundles = [
  {
    id: "pantry-starter",
    name: "Pantry Starter",
    accent: "Foodstuff",
    tier: "NGN 30k",
    summary: "A compact foodstuff base for a regular home restock.",
    icon: "basket",
    items: [
      { productId: "caprice-parboiled-rice-5kg", quantity: 1 },
      { productId: "golden-penny-spaghetti-500g", quantity: 4 },
      { productId: "power-oil-vegetable-oil-3l", quantity: 1 },
      { productId: "golden-penny-semovita-1kg", quantity: 2 },
      { productId: "de-rica-tomato-paste-210g", quantity: 2 },
      { productId: "dangote-salt-1kg", quantity: 1 },
    ],
  },
  {
    id: "family-foodstuff",
    name: "Family Foodstuff",
    accent: "Foodstuff",
    tier: "NGN 150k",
    summary: "A fuller pantry order for larger homes, team kitchens, and monthly restocks.",
    icon: "store",
    items: [
      { productId: "caprice-parboiled-rice-5kg", quantity: 6 },
      { productId: "indomie-instant-noodles-chicken-70g-x-40", quantity: 2 },
      { productId: "power-oil-vegetable-oil-3l", quantity: 4 },
      { productId: "golden-penny-spaghetti-500g", quantity: 8 },
      { productId: "golden-penny-semovita-1kg", quantity: 6 },
      { productId: "gino-tomato-paste-sachet-70g-x-50", quantity: 2 },
      { productId: "maggi-chicken-cubes-100-cubes", quantity: 1 },
      { productId: "dangote-salt-1kg", quantity: 2 },
    ],
  },
  {
    id: "foodstuff-hamper",
    name: "Foodstuff Hamper",
    accent: "Hamper",
    tier: "NGN 200k",
    summary: "A premium foodstuff hamper for homes, staff welfare, and stocked kitchens.",
    icon: "gift",
    items: [
      { productId: "basmati-rice-5kg", quantity: 1 },
      { productId: "aeroplane-basmati-rice-5kg", quantity: 1 },
      { productId: "gino-viet-fragrant-kdm-rice-5kg", quantity: 1 },
      { productId: "caprice-parboiled-rice-5kg", quantity: 3 },
      { productId: "indomie-super-pack-chicken-120g-x-40", quantity: 2 },
      { productId: "kings-vegetable-oil-5l", quantity: 2 },
      { productId: "gino-tomato-paste-sachet-70g-x-50", quantity: 1 },
      { productId: "milo-food-drink-500g", quantity: 1 },
    ],
  },
  {
    id: "toiletries-core",
    name: "Toiletries Core",
    accent: "Bathroom",
    tier: "NGN 30k",
    summary: "Bathroom basics for homes and shared apartments.",
    icon: "droplet",
    items: [
      { productId: "softwave-toilet-tissue-48-rolls", quantity: 1 },
      { productId: "dettol-original-antibacterial-soap-110g-x-6", quantity: 2 },
      { productId: "closeup-toothpaste-deep-action-140g", quantity: 3 },
      { productId: "listerine-mouthwash-cool-mint-500ml", quantity: 1 },
      { productId: "always-ultra-sanitary-pads-8-pads", quantity: 1 },
    ],
  },
  {
    id: "cleaning-restock",
    name: "Cleaning Restock",
    accent: "Facility",
    tier: "NGN 30k",
    summary: "Cleaning supplies for kitchens, bathrooms, and shared spaces.",
    icon: "spray",
    items: [
      { productId: "good-mama-detergent-assorted-1-7kg", quantity: 2 },
      { productId: "morning-fresh-dishwashing-liquid-450ml", quantity: 2 },
      { productId: "hypo-bleach-regular-3-5l", quantity: 2 },
      { productId: "dettol-antiseptic-liquid-500ml", quantity: 1 },
      { productId: "glade-air-freshener-spray-300ml", quantity: 1 },
    ],
  },
  {
    id: "meeting-drinks",
    name: "Meeting Drinks",
    accent: "Office pantry",
    tier: "NGN 50k",
    summary: "Water, drinks, and pantry beverages for guests and meetings.",
    icon: "cup",
    items: [
      { productId: "eva-table-water-75cl-x-12", quantity: 4 },
      { productId: "maltina-can-33cl-x-24", quantity: 1 },
      { productId: "coca-cola-pet-50cl-x-12", quantity: 1 },
      { productId: "five-alive-pulpy-orange-1l-x-12", quantity: 1 },
      { productId: "milo-food-drink-500g", quantity: 1 },
    ],
  },
  {
    id: "baby-care",
    name: "Baby Care",
    accent: "Baby",
    tier: "NGN 50k",
    summary: "Baby care basics for a quick family restock.",
    icon: "heart",
    items: [
      { productId: "pampers-baby-dry-diapers-medium-64-pieces", quantity: 1 },
      { productId: "molfix-baby-wipes-80-wipes", quantity: 2 },
      { productId: "johnson-s-baby-bath-500ml", quantity: 1 },
      { productId: "johnson-s-baby-lotion-300ml", quantity: 1 },
      { productId: "johnson-s-baby-oil-200ml", quantity: 1 },
      { productId: "huggies-baby-wipes-56-wipes", quantity: 1 },
      { productId: "cerelac-wheat-milk-400g", quantity: 1 },
    ],
  },
  {
    id: "staff-welfare",
    name: "Staff Welfare",
    accent: "Welfare",
    tier: "NGN 50k",
    summary: "A practical hamper base for appreciation and team welfare.",
    icon: "heart",
    items: [
      { productId: "maltina-can-33cl-x-24", quantity: 1 },
      { productId: "five-alive-pulpy-orange-1l-x-12", quantity: 1 },
      { productId: "milo-food-drink-500g", quantity: 1 },
      { productId: "bournvita-food-drink-500g", quantity: 1 },
      { productId: "nivea-rich-nourishing-body-lotion-400ml", quantity: 1 },
      { productId: "dettol-original-antibacterial-soap-110g-x-6", quantity: 1 },
    ],
  },
  {
    id: "office-stationery-starter",
    name: "Office Stationery Starter",
    accent: "Stationery",
    tier: "NGN 50k",
    summary: "Core desk supplies for a small team or front office.",
    icon: "briefcase",
    items: [
      { productId: "double-a-business-a4-printing-paper-75-gsm-x5-75gsm-x-5", quantity: 1 },
      { productId: "eezee-biro-blue-x25-25-pieces", quantity: 1 },
      { productId: "maped-whiteboard-marker-medium-x4-4-pieces", quantity: 1 },
      { productId: "global-notes-75-x-75-mm-sticky-notes-100-sheets-yellow-100-sheets", quantity: 2 },
      { productId: "rexel-active-carry-folder-a4-a4", quantity: 4 },
      { productId: "rexel-r30-compact-stapler-grey-1-piece", quantity: 1 },
      { productId: "elephant-round-paper-clip-no-1-33-mm-33mm", quantity: 2 },
    ],
  },
  {
    id: "admin-desk-refill",
    name: "Admin Desk Refill",
    accent: "Office",
    tier: "NGN 30k",
    summary: "A lean refill for admin desks, reception, and daily paperwork.",
    icon: "clipboard",
    items: [
      { productId: "hp-papers-everyday-a4-printing-paper-80-gsm-x5-80gsm-x-5", quantity: 1 },
      { productId: "eezee-biro-blue-x25-25-pieces", quantity: 1 },
      { productId: "bic-whiteboard-marker-black-1-piece", quantity: 2 },
      { productId: "m-g-12-digits-desktop-calculator-two-way-power-mgc-02-12-digits", quantity: 1 },
      { productId: "mixed-accessory-set-clips-pins-binders-1-set", quantity: 1 },
      { productId: "global-notes-125-x-75-mm-sticky-notes-100-sheets-yellow-100-sheets", quantity: 1 },
    ],
  },
  {
    id: "fancy-folder-pack",
    name: "Fancy Folder Pack",
    accent: "Folders",
    tier: "NGN 50k",
    summary: "Presentation-ready folders for proposals, records, and meetings.",
    icon: "folder",
    items: [
      { productId: "rexel-anti-slip-folder-a4-clear-x25-a4-x-25", quantity: 1 },
      { productId: "rexel-joy-five-part-file-1-piece", quantity: 1 },
      { productId: "rexel-zipper-pocket-a4-x5-a4-x-5", quantity: 1 },
      { productId: "rexel-display-book-choices-a4-40-pockets-green-a4-40-pockets", quantity: 1 },
      { productId: "rexel-display-book-choices-a4-40-pockets-black-a4-40-pockets", quantity: 1 },
      { productId: "rexel-ice-expanding-file-a4-13-pockets-assorted-a4-13-pockets", quantity: 1 },
      { productId: "rexel-folder-advance-snap-in-2-pocket-navy-blue-2-pockets", quantity: 2 },
      { productId: "rexel-folder-advance-stayput-purple-1-piece", quantity: 2 },
      { productId: "rexel-folder-advance-4-pocket-custom-red-4-pockets", quantity: 2 },
    ],
  },
  {
    id: "office-pantry-core",
    name: "Office Pantry Core",
    accent: "Office pantry",
    tier: "NGN 75k",
    summary: "A balanced office pantry restock for drinks, tea, and quick breaks.",
    icon: "coffee",
    items: [
      { productId: "eva-table-water-75cl-x-12", quantity: 4 },
      { productId: "nescafe-classic-coffee-tin-50g", quantity: 2 },
      { productId: "milo-food-drink-500g", quantity: 2 },
      { productId: "bournvita-food-drink-500g", quantity: 2 },
      { productId: "chivita-active-juice-1l-x-12", quantity: 1 },
      { productId: "golden-penny-white-granulated-sugar-1-kg-1kg", quantity: 2 },
      { productId: "peak-filled-milk-powder-400g", quantity: 1 },
    ],
  },
  {
    id: "chi-juice-mix",
    name: "Chi Juice Mix",
    accent: "Drinks",
    tier: "NGN 50k",
    summary: "A Chivita-heavy drink mix for guests, family, and meetings.",
    icon: "cup",
    items: [
      { productId: "chivita-active-juice-1l-x-12", quantity: 1 },
      { productId: "chivita-active-citrus-mixed-fruit-juice-100-cl-100cl", quantity: 3 },
      { productId: "chivita-active-vegetable-fruit-nectar-carrot-orange-100-cl-100cl", quantity: 3 },
      { productId: "chivita-orange-juice-100-cl-100cl", quantity: 3 },
      { productId: "chivita-apple-juice-100-cl-100cl", quantity: 3 },
      { productId: "chivita-pineapple-juice-100-cl-100cl", quantity: 3 },
      { productId: "chivita-red-grape-juice-100-cl-100cl", quantity: 3 },
    ],
  },
  {
    id: "wine-host-pack",
    name: "Wine Host Pack",
    accent: "Wine",
    tier: "NGN 50k",
    summary: "Popular red and white wines for hosting and casual gifting.",
    icon: "wine",
    items: [
      { productId: "four-cousins-natural-sweet-red-wine-75-cl-75cl", quantity: 1 },
      { productId: "carlo-rossi-sweet-red-wine-75-cl-75cl", quantity: 1 },
      { productId: "4th-street-sweet-red-wine-75-cl-75cl", quantity: 2 },
      { productId: "four-cousins-dry-white-wine-75-cl-75cl", quantity: 1 },
      { productId: "4th-street-sweet-white-wine-75-cl-75cl", quantity: 2 },
      { productId: "dominio-del-rey-white-wine-75-cl-75cl", quantity: 1 },
    ],
  },
  {
    id: "red-white-wine-mix",
    name: "Red & White Wine Mix",
    accent: "Wine",
    tier: "NGN 75k",
    summary: "A broader red and white wine selection for events and stocked bars.",
    icon: "wine",
    items: [
      { productId: "four-cousins-natural-sweet-red-wine-75-cl-75cl", quantity: 2 },
      { productId: "carlo-rossi-sweet-red-wine-75-cl-75cl", quantity: 2 },
      { productId: "baron-romero-spanish-red-wine-75-cl-75cl", quantity: 2 },
      { productId: "toma-bodegas-lozano-fruity-red-wine-75-cl-75cl", quantity: 2 },
      { productId: "four-cousins-dry-white-wine-75-cl-75cl", quantity: 2 },
      { productId: "4th-street-sweet-white-wine-75-cl-75cl", quantity: 2 },
      { productId: "castillo-de-espana-white-wine-75-cl-75cl", quantity: 1 },
    ],
  },
  {
    id: "swallow-soup-base",
    name: "Swallow & Soup Base",
    accent: "Foodstuff",
    tier: "NGN 150k",
    summary: "A larger garri, fufu, poundo, and soup base restock for Nigerian kitchens.",
    icon: "basket",
    items: [
      { productId: "golden-penny-garri-5-kg-5kg", quantity: 5 },
      { productId: "endy-s-fufu-flour-2-kg-2kg", quantity: 4 },
      { productId: "ayoola-foods-cassava-fufu-flour-2-kg-2kg", quantity: 8 },
      { productId: "ayoola-foods-poundo-yam-flour-1-8-kg-1-8kg", quantity: 5 },
      { productId: "golden-penny-semovita-1kg", quantity: 8 },
      { productId: "maggi-chicken-cubes-100-cubes", quantity: 3 },
      { productId: "de-rica-tomato-paste-210g", quantity: 10 },
    ],
  },
  {
    id: "breakfast-spread",
    name: "Breakfast & Spread",
    accent: "Breakfast",
    tier: "NGN 30k",
    summary: "Breakfast basics with cereals, beverages, margarine, and mayonnaise.",
    icon: "coffee",
    items: [
      { productId: "golden-morn-cereal-900g", quantity: 1 },
      { productId: "quaker-oats-tin-500g", quantity: 1 },
      { productId: "milo-food-drink-500g", quantity: 1 },
      { productId: "bournvita-food-drink-500g", quantity: 1 },
      { productId: "blue-band-margarine-250g", quantity: 2 },
      { productId: "bama-mayonnaise-385-ml-385ml", quantity: 1 },
      { productId: "three-crowns-evaporated-milk-160-g-160g", quantity: 3 },
    ],
  },
  {
    id: "family-garri-fufu-pack",
    name: "Family Garri & Fufu Pack",
    accent: "Foodstuff",
    tier: "NGN 50k",
    summary: "Packaged garri, fufu, and poundo options for a fuller family restock.",
    icon: "basket",
    items: [
      { productId: "nini-foods-crispy-ijebu-garri-2-kg-2kg", quantity: 1 },
      { productId: "vine-dresser-foods-garri-ijebu-2-kg-2kg", quantity: 1 },
      { productId: "nini-foods-yellow-garri-3-kg-3kg", quantity: 1 },
      { productId: "golden-penny-garri-5-kg-5kg", quantity: 1 },
      { productId: "sofi-instant-fufu-cassava-flour-1-kg-1kg", quantity: 3 },
      { productId: "niji-foods-odourless-fufu-flour-1-kg-1kg", quantity: 3 },
      { productId: "ayoola-foods-poundo-yam-flour-1-8-kg-1-8kg", quantity: 1 },
    ],
  },
  {
    id: "fresh-space-diffuser-pack",
    name: "Fresh Space Diffuser Pack",
    accent: "Facility",
    tier: "NGN 50k",
    summary: "Diffusers and fresheners for offices, lounges, and reception areas.",
    icon: "spray",
    items: [
      { productId: "top-breeze-diffuser-160-ml-160ml", quantity: 2 },
      { productId: "air-wick-scented-reed-diffuser-wood-1-piece", quantity: 1 },
      { productId: "air-wick-reed-diffuser-mistletoe-pine-multi-layered-fragrance-25-ml-25ml", quantity: 2 },
      { productId: "air-wick-reed-diffuser-life-scents-summer-delights-30-ml-30ml", quantity: 2 },
      { productId: "air-wick-freshmatic-diffuser-refill-assorted-250-ml-250ml", quantity: 1 },
      { productId: "glade-air-freshener-spray-300ml", quantity: 2 },
    ],
  },
  {
    id: "drinks-hamper",
    name: "Drinks Hamper",
    accent: "Hamper",
    tier: "NGN 150k",
    summary: "A balanced drinks hamper for meetings, visitors, and home hosting.",
    icon: "gift",
    items: [
      { productId: "chivita-active-juice-1l-x-12", quantity: 2 },
      { productId: "five-alive-pulpy-orange-1l-x-12", quantity: 2 },
      { productId: "maltina-can-33cl-x-24", quantity: 2 },
      { productId: "red-bull-energy-drink-250ml-x-24", quantity: 1 },
      { productId: "coca-cola-pet-50cl-x-12", quantity: 2 },
      { productId: "nescafe-gold-blend-coffee-golden-roast-100g", quantity: 1 },
      { productId: "tetley-tea-bags-100-bags", quantity: 1 },
    ],
  },
  {
    id: "cleaning-hamper",
    name: "Cleaning Hamper",
    accent: "Hamper",
    tier: "NGN 165k",
    summary: "A facility-focused hamper for laundry, disinfecting, and general cleaning.",
    icon: "gift",
    items: [
      { productId: "persil-powder-colour-protect-7-5kg", quantity: 1 },
      { productId: "comfort-fabric-conditioner-pure-2l", quantity: 2 },
      { productId: "vanish-gold-oxi-advance-stain-remover-470g", quantity: 1 },
      { productId: "dettol-antiseptic-liquid-1l", quantity: 2 },
      { productId: "hypo-bleach-regular-3-5l", quantity: 3 },
      { productId: "mr-muscle-kitchen-cleaner-500ml", quantity: 3 },
      { productId: "scotch-brite-scrub-sponge-3-pieces", quantity: 2 },
      { productId: "air-wick-air-freshener-spray-300ml", quantity: 3 },
    ],
  },
  {
    id: "toiletries-hamper",
    name: "Toiletries Hamper",
    accent: "Hamper",
    tier: "NGN 155k",
    summary: "A bathroom essentials hamper for homes, guest rooms, and shared spaces.",
    icon: "gift",
    items: [
      { productId: "softwave-toilet-tissue-48-rolls", quantity: 2 },
      { productId: "andrex-toilet-tissue-classic-clean-6-rolls", quantity: 2 },
      { productId: "dove-beauty-bar-100g-x-4", quantity: 4 },
      { productId: "listerine-mouthwash-cool-mint-500ml", quantity: 3 },
      { productId: "colgate-maximum-cavity-protection-140g", quantity: 6 },
      { productId: "always-cotton-soft-sanitary-pads-16-pads", quantity: 4 },
      { productId: "irish-spring-body-wash-591ml", quantity: 2 },
      { productId: "dove-deeply-nourishing-body-wash-500ml", quantity: 2 },
      { productId: "cotton-wool-roll-500g", quantity: 2 },
    ],
  },
  {
    id: "baby-hamper",
    name: "Baby Hamper",
    accent: "Hamper",
    tier: "NGN 215k",
    summary: "A fuller baby-care hamper with feeding, diapers, wipes, and bath items.",
    icon: "gift",
    items: [
      { productId: "cow-gate-comfort-baby-milk-formula-800g", quantity: 1 },
      { productId: "sma-gold-3-toddler-milk-900g", quantity: 1 },
      { productId: "pampers-baby-dry-diapers-medium-64-pieces", quantity: 2 },
      { productId: "molfix-diapers-medium-64-pieces", quantity: 2 },
      { productId: "johnson-s-baby-bath-500ml", quantity: 2 },
      { productId: "johnson-s-baby-lotion-300ml", quantity: 2 },
      { productId: "johnson-s-baby-oil-200ml", quantity: 2 },
      { productId: "molfix-baby-wipes-80-wipes", quantity: 4 },
      { productId: "cerelac-wheat-milk-400g", quantity: 2 },
    ],
  },
  {
    id: "skincare-hamper",
    name: "Skincare Hamper",
    accent: "Hamper",
    tier: "NGN 165k",
    summary: "A skincare hamper with facial care, body care, oils, and sun protection.",
    icon: "gift",
    items: [
      { productId: "la-roche-posay-anthelios-sunscreen-spf50-50ml", quantity: 1 },
      { productId: "neutrogena-hydro-boost-water-gel-50ml", quantity: 1 },
      { productId: "cerave-daily-moisturizing-lotion-355ml", quantity: 1 },
      { productId: "the-ordinary-niacinamide-10-zinc-1-30ml", quantity: 1 },
      { productId: "the-ordinary-hyaluronic-acid-2-b5-30ml", quantity: 1 },
      { productId: "bio-oil-skincare-oil-125ml", quantity: 1 },
      { productId: "palmer-s-skin-therapy-oil-150ml", quantity: 1 },
      { productId: "jergens-ultra-healing-lotion-621ml", quantity: 1 },
      { productId: "nivea-sun-uv-face-shine-control-spf50-50ml", quantity: 1 },
      { productId: "garnier-micellar-cleansing-water-400ml", quantity: 2 },
    ],
  },
  {
    id: "fragrance-hamper",
    name: "Fragrance Hamper",
    accent: "Hamper",
    tier: "NGN 205k",
    summary: "A fragrance hamper with perfumes, body mists, and everyday scents.",
    icon: "gift",
    items: [
      { productId: "armaf-club-de-nuit-intense-man-105ml", quantity: 1 },
      { productId: "lattafa-yara-eau-de-parfum-100ml", quantity: 1 },
      { productId: "lattafa-asad-eau-de-parfum-100ml", quantity: 1 },
      { productId: "oud-24-hours-eau-de-parfum-100ml", quantity: 1 },
      { productId: "victoria-s-secret-body-mist-pure-seduction-250ml", quantity: 1 },
      { productId: "bath-body-works-body-mist-japanese-cherry-blossom-236ml", quantity: 1 },
      { productId: "smart-collection-no-352-eau-de-parfum-100ml", quantity: 1 },
      { productId: "jovan-musk-cologne-spray-88ml", quantity: 1 },
    ],
  },
  {
    id: "stationery-hamper",
    name: "Stationery Hamper",
    accent: "Hamper",
    tier: "NGN 205k",
    summary: "A corporate stationery hamper for procurement, admin desks, and records.",
    icon: "gift",
    items: [
      { productId: "double-a-business-a4-printing-paper-75-gsm-x5-75gsm-x-5", quantity: 2 },
      { productId: "suzano-report-a4-printing-paper-75-gsm-x5-75gsm-x-5", quantity: 1 },
      { productId: "thermal-printer-paper-rolls-80-x-80-mm-x50-80-x-80mm-x-50", quantity: 1 },
      { productId: "eezee-biro-blue-x25-25-pieces", quantity: 3 },
      { productId: "maped-whiteboard-marker-medium-x4-4-pieces", quantity: 2 },
      { productId: "global-notes-75-x-75-mm-sticky-notes-100-sheets-yellow-100-sheets", quantity: 5 },
      { productId: "rexel-active-carry-folder-a4-a4", quantity: 10 },
      { productId: "rexel-r30-compact-stapler-grey-1-piece", quantity: 3 },
      { productId: "m-g-12-digits-desktop-calculator-two-way-power-mgc-02-12-digits", quantity: 3 },
    ],
  },
  {
    id: "pet-hamper",
    name: "Pet Hamper",
    accent: "Hamper",
    tier: "NGN 72k",
    summary: "A simple pet restock hamper for homes with dogs.",
    icon: "gift",
    items: [
      { productId: "bingo-dog-food-beef-3kg", quantity: 6 },
    ],
  },
];

const sanitizeSavedCart = (cart) => {
  if (!Array.isArray(cart)) return [];

  return cart
    .map((item) => {
      const product = productById.get(item.productId);
      const quantity = Number(item.quantity);

      if (!product || !Number.isFinite(quantity) || quantity <= 0) return null;

      return {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        category: product.category,
        price: product.price,
        quantity: Math.floor(quantity),
      };
    })
    .filter(Boolean);
};

const sanitizeSavedBundleCounts = (bundleCounts) => {
  if (!bundleCounts || typeof bundleCounts !== "object") return {};

  const bundleIds = new Set(bundles.map((bundle) => bundle.id));

  return Object.fromEntries(
    Object.entries(bundleCounts)
      .map(([bundleId, count]) => [bundleId, Math.floor(Number(count))])
      .filter(
        ([bundleId, count]) =>
          bundleIds.has(bundleId) && Number.isFinite(count) && count > 0
      )
  );
};

const getSavedBasketState = () => {
  try {
    const storedState = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "{}");

    return {
      cart: sanitizeSavedCart(storedState.cart),
      bundleCounts: sanitizeSavedBundleCounts(storedState.bundleCounts),
      recurrence:
        recurrenceOptions?.some((option) => option.value === storedState.recurrence)
          ? storedState.recurrence
          : "Monthly",
      orderType: ["household", "business"].includes(storedState.orderType)
        ? storedState.orderType
        : initialOrderType,
    };
  } catch {
    return {
      cart: [],
      bundleCounts: {},
      recurrence: "Monthly",
      orderType: initialOrderType,
    };
  }
};

const recurrenceOptions = [
  { value: "One-time order", title: "One-time order", text: "Just this order for now." },
  { value: "Weekly", title: "Weekly", text: "Best for fast-moving team or home essentials." },
  { value: "Biweekly", title: "Biweekly", text: "Good for shared spaces and small offices." },
  { value: "Monthly", title: "Monthly", text: "Best for planned home and business restock." },
];

const orderTypeOptions = [
  {
    value: "household",
    title: "Household",
    text: "For home essentials and personal restock.",
  },
  {
    value: "business",
    title: "Business",
    text: "For office pantry, facility supplies, and staff welfare.",
  },
];

const onboardingSteps = [
  {
    title: "Start fast.",
    description: "Pick a bundle or add individual products.",
  },
  {
    title: "Adjust freely.",
    description: "Change quantities before checkout.",
  },
  {
    title: "Confirm on WhatsApp.",
    description: "We confirm availability, delivery, and payment.",
  },
];

const savedBasketState = getSavedBasketState();

const state = {
  selectedCategory: "All",
  searchQuery: "",
  bundleQuery: "",
  selectedBundleAccent: "All",
  productPage: 1,
  cart: savedBasketState.cart,
  bundleCounts: savedBasketState.bundleCounts,
  recurrence: savedBasketState.recurrence,
  orderType: savedBasketState.orderType,
  selectedBundleId: null,
};

const persistBasketState = () => {
  try {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        cart: state.cart,
        bundleCounts: state.bundleCounts,
        recurrence: state.recurrence,
        orderType: state.orderType,
      })
    );
  } catch {
    // Cart persistence is a convenience; ordering still works without it.
  }
};

const formatNaira = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

const getProductById = (productId) => productById.get(productId);

const refreshCartPrices = () => {
  let didUpdate = false;

  state.cart = state.cart.map((item) => {
    const product = getProductById(item.productId);
    if (!product) return item;

    if (
      item.name === product.name &&
      item.unit === product.unit &&
      item.category === product.category &&
      item.price === product.price
    ) {
      return item;
    }

    didUpdate = true;
    return {
      ...item,
      name: product.name,
      unit: product.unit,
      category: product.category,
      price: product.price,
    };
  });

  if (didUpdate) persistBasketState();
  return didUpdate;
};

const applyLivePriceMap = (livePrices) => {
  if (!(livePrices instanceof Map) || !livePrices.size) return 0;

  let updatedProductCount = 0;

  products = products.map((product) => {
    const livePrice = livePrices.get(product.id);
    if (!livePrice || livePrice.price === product.price) return product;

    updatedProductCount += 1;
    return {
      ...product,
      staticPrice: product.staticPrice || product.price,
      price: livePrice.price,
      priceSource: livePrice.benchmarkSource || product.priceSource || "Live price sheet",
      priceSourceUrl: livePrice.benchmarkUrl || product.priceSourceUrl || "",
      priceLastChecked: livePrice.lastChecked || product.priceLastChecked || "",
      pricingNote: livePrice.note || product.pricingNote || "",
    };
  });

  if (!updatedProductCount) return 0;

  productById = new Map(products.map((product) => [product.id, product]));
  refreshCartPrices();
  return updatedProductCount;
};

const getCartItem = (productId) =>
  state.cart.find((item) => item.productId === productId);

const getCartCount = () =>
  state.cart.reduce((total, item) => total + item.quantity, 0);

const getSubtotal = () =>
  state.cart.reduce((total, item) => total + item.price * item.quantity, 0);

const getServiceCharge = () => Math.round(getSubtotal() * SERVICE_CHARGE_RATE);

const getGrandTotal = () => getSubtotal() + getServiceCharge();

const isBelowMinimumOrder = () =>
  state.cart.length > 0 && getSubtotal() < MINIMUM_ORDER_AMOUNT;

const getMinimumOrderMessage = () =>
  `Minimum order is ${formatNaira(MINIMUM_ORDER_AMOUNT)}. Please add more items to continue.`;

const getBundleTotal = (bundle) =>
  bundle.items.reduce((total, bundleItem) => {
    const product = getProductById(bundleItem.productId);
    return product ? total + product.price * bundleItem.quantity : total;
  }, 0);

const getBundleItemCount = (bundle) =>
  bundle.items.reduce((total, bundleItem) => total + bundleItem.quantity, 0);

const canRemoveBundle = (bundle) =>
  bundle.items.every(
    (bundleItem) =>
      (getCartItem(bundleItem.productId)?.quantity || 0) >= bundleItem.quantity
  );

const isBundleAdded = (bundle) =>
  Boolean(state.bundleCounts[bundle.id]) && canRemoveBundle(bundle);

const getBundleIcon = (icon) => {
  const icons = {
    basket: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.5 10.5h13l-1.1 8.1a2 2 0 0 1-2 1.7H8.6a2 2 0 0 1-2-1.7l-1.1-8.1Z"></path>
        <path d="M8.5 10.5 11 4.8"></path>
        <path d="m15.5 10.5-2.5-5.7"></path>
        <path d="M4 10.5h16"></path>
      </svg>
    `,
    store: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10h16l-1.2-5H5.2L4 10Z"></path>
        <path d="M5.5 10v9.5h13V10"></path>
        <path d="M9 19.5v-5h6v5"></path>
        <path d="M8 10v2.2a2 2 0 0 0 4 0V10"></path>
        <path d="M12 10v2.2a2 2 0 0 0 4 0V10"></path>
      </svg>
    `,
    droplet: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.8S6.8 10 6.8 14.2a5.2 5.2 0 0 0 10.4 0C17.2 10 12 3.8 12 3.8Z"></path>
        <path d="M9.7 15.2a2.6 2.6 0 0 0 3.9 1.9"></path>
      </svg>
    `,
    sparkle: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.8 13.8 9l5.4 1.8-5.4 1.8L12 17.8l-1.8-5.2-5.4-1.8L10.2 9 12 3.8Z"></path>
        <path d="M18 15.5 18.8 18l2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8.8-2.5Z"></path>
      </svg>
    `,
    spray: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 9h7v2.2l-1.3 1.4v6.1a1.8 1.8 0 0 1-1.8 1.8H9.8A1.8 1.8 0 0 1 8 18.7v-6.1l1-1.2V9Z"></path>
        <path d="M10 5.2h5.2V9H10z"></path>
        <path d="M15.2 6h2.4"></path>
        <path d="M18.8 8.2h1.7"></path>
        <path d="M18.8 11h1.7"></path>
      </svg>
    `,
    cup: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 8.5h9.8l-.8 8.4a3 3 0 0 1-3 2.7h-2.2a3 3 0 0 1-3-2.7l-.8-8.4Z"></path>
        <path d="M16.2 10.5h1.2a2.3 2.3 0 0 1 0 4.6h-1.7"></path>
        <path d="M8 5.5h7"></path>
      </svg>
    `,
    heart: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20s-7.2-4.5-8.7-9.1C2.2 7.5 4.5 5 7.4 5c1.8 0 3.2 1 4.1 2.3C12.4 6 13.8 5 15.6 5c2.9 0 5.2 2.5 4.1 5.9C19.2 15.5 12 20 12 20Z"></path>
      </svg>
    `,
    gift: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 12v8H4v-8"></path>
        <path d="M3 7.5h18V12H3z"></path>
        <path d="M12 7.5V20"></path>
        <path d="M12 7.5C9.2 7.5 7.6 6.7 7.6 5.2c0-1 .8-1.8 1.8-1.8 1.5 0 2.6 1.5 2.6 4.1Z"></path>
        <path d="M12 7.5c2.8 0 4.4-.8 4.4-2.3 0-1-.8-1.8-1.8-1.8-1.5 0-2.6 1.5-2.6 4.1Z"></path>
      </svg>
    `,
    briefcase: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7"></path>
        <path d="M4.5 8.2h15v10.3a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V8.2Z"></path>
        <path d="M4.5 12.4h15"></path>
        <path d="M10.4 12.4v1.4h3.2v-1.4"></path>
      </svg>
    `,
    clipboard: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9.5 4.8h5l.8 2.2H8.7l.8-2.2Z"></path>
        <path d="M7.2 6.8H6a1.8 1.8 0 0 0-1.8 1.8v10A1.8 1.8 0 0 0 6 20.4h12a1.8 1.8 0 0 0 1.8-1.8v-10A1.8 1.8 0 0 0 18 6.8h-1.2"></path>
        <path d="M8 12h8"></path>
        <path d="M8 16h5.5"></path>
      </svg>
    `,
    folder: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.8 7.2h6l1.8 2.2h8.6v8.4a2 2 0 0 1-2 2H5.8a2 2 0 0 1-2-2V7.2Z"></path>
        <path d="M3.8 9.4h16.4"></path>
      </svg>
    `,
    wine: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4.2h8l-.7 6.9a3.3 3.3 0 0 1-6.6 0L8 4.2Z"></path>
        <path d="M8.4 8.3h7.2"></path>
        <path d="M12 14.5v5"></path>
        <path d="M9 19.5h6"></path>
      </svg>
    `,
    coffee: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.8 8.5h9.8v5.8a4 4 0 0 1-4 4H9.8a4 4 0 0 1-4-4V8.5Z"></path>
        <path d="M15.6 10h1.2a2.4 2.4 0 0 1 0 4.8h-1.2"></path>
        <path d="M8.2 5.2v-2"></path>
        <path d="M12 5.2v-2"></path>
      </svg>
    `,
  };

  return icons[icon] || icons.basket;
};

const updateProductCardState = (productId) => {
  if (!productGrid) return;

  const card = productGrid.querySelector(`[data-product-card="${productId}"]`);
  if (!card) return;

  const quantity = getCartItem(productId)?.quantity || 0;
  const quantityValue = card.querySelector("[data-quantity-value]");
  const addHint = card.querySelector("[data-add-hint]");

  if (quantityValue) quantityValue.textContent = String(quantity);
  if (addHint) addHint.textContent = quantity ? "In basket" : "Add item";
};

const setQuantity = (productId, quantity) => {
  const product = getProductById(productId);
  if (!product) return;

  const nextQuantity = Math.max(0, quantity);
  const existing = getCartItem(productId);

  if (nextQuantity === 0) {
    state.cart = state.cart.filter((item) => item.productId !== productId);
  } else if (existing) {
    existing.quantity = nextQuantity;
  } else {
    state.cart.push({
      productId: product.id,
      name: product.name,
      unit: product.unit,
      category: product.category,
      price: product.price,
      quantity: nextQuantity,
    });
  }

  updateProductCardState(productId);
  renderCartSummary();
  renderReview();
  persistBasketState();
};

const addBundleToCart = (bundleId) => {
  const bundle = bundles.find((item) => item.id === bundleId);
  if (!bundle) return;

  bundle.items.forEach((bundleItem) => {
    const currentQuantity = getCartItem(bundleItem.productId)?.quantity || 0;
    setQuantity(bundleItem.productId, currentQuantity + bundleItem.quantity);
  });

  state.bundleCounts[bundle.id] = (state.bundleCounts[bundle.id] || 0) + 1;
  persistBasketState();
  renderBundles();
};

const removeBundleFromCart = (bundleId) => {
  const bundle = bundles.find((item) => item.id === bundleId);
  if (!bundle || !isBundleAdded(bundle)) return;

  bundle.items.forEach((bundleItem) => {
    const currentQuantity = getCartItem(bundleItem.productId)?.quantity || 0;
    setQuantity(bundleItem.productId, currentQuantity - bundleItem.quantity);
  });

  state.bundleCounts[bundle.id] = Math.max((state.bundleCounts[bundle.id] || 1) - 1, 0);
  if (state.bundleCounts[bundle.id] === 0) delete state.bundleCounts[bundle.id];
  persistBasketState();
  renderBundles();
};

const getBundleProducts = (bundle) =>
  bundle.items
    .map((bundleItem) => {
      const product = getProductById(bundleItem.productId);
      return product ? { ...product, quantity: bundleItem.quantity } : null;
    })
    .filter(Boolean);

const getBundlePreview = (bundle) =>
  getBundleProducts(bundle)
    .map((product) => `${product.name} x${product.quantity}`)
    .join(", ");

const bundleFilterOptions = [
  "All",
  ...new Set(bundles.map((bundle) => bundle.accent)),
];

const getFilteredBundles = () => {
  const query = state.bundleQuery.trim().toLowerCase();

  return bundles.filter((bundle) => {
    const matchesAccent =
      state.selectedBundleAccent === "All" ||
      bundle.accent === state.selectedBundleAccent;
    const searchableText = `${bundle.name} ${bundle.accent} ${bundle.tier} ${
      bundle.summary
    } ${getBundleProducts(bundle)
      .map((product) => `${product.name} ${product.brand} ${product.category}`)
      .join(" ")}`.toLowerCase();
    const matchesQuery = !query || searchableText.includes(query);

    return matchesAccent && matchesQuery;
  });
};

const renderBundleDetails = (bundle) => {
  if (
    !bundleDetailMeta ||
    !bundleDetailTitle ||
    !bundleDetailBody ||
    !addSelectedBundleButton
  ) {
    return;
  }

  const bundleProducts = getBundleProducts(bundle);
  const total = getBundleTotal(bundle);
  const itemCount = getBundleItemCount(bundle);
  const isInBasket = isBundleAdded(bundle);

  bundleDetailMeta.textContent = `${bundle.accent} - ${bundle.tier}`;
  bundleDetailTitle.textContent = bundle.name;
  addSelectedBundleButton.textContent = isInBasket
    ? `Remove ${bundle.name}`
    : `Add ${bundle.name}`;
  addSelectedBundleButton.dataset.bundleAction = isInBasket ? "remove" : "add";
  addSelectedBundleButton.classList.toggle("bundle-remove", isInBasket);
  addSelectedBundleButton.setAttribute(
    "aria-label",
    isInBasket ? `Remove ${bundle.name} bundle` : `Add ${bundle.name} bundle`
  );

  bundleDetailBody.innerHTML = `
    <p class="bundle-detail-summary">${bundle.summary}</p>
    <div class="bundle-detail-stat">
      <span>${itemCount} item${itemCount === 1 ? "" : "s"}</span>
      <strong>${formatNaira(total)}</strong>
    </div>
    <div class="bundle-detail-items">
      ${bundleProducts
        .map(
          (product) => `
            <article class="bundle-detail-item">
              <img src="${product.image}" alt="${product.name}" loading="lazy" />
              <div>
                <strong>${product.name}</strong>
                <span>${product.unit} - Qty ${product.quantity}</span>
              </div>
              <strong>${formatNaira(product.price * product.quantity)}</strong>
            </article>
          `
        )
        .join("")}
    </div>
  `;
};

const openBundleDetails = (bundleId) => {
  const bundle = bundles.find((item) => item.id === bundleId);
  if (!bundle || !bundleModal) return;

  state.selectedBundleId = bundle.id;
  renderBundleDetails(bundle);
  bundleModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
};

const closeBundleDetails = () => {
  if (!bundleModal) return;

  bundleModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  state.selectedBundleId = null;
};

const categoryOrder = [
  "All",
  "Foodstuff & Pantry",
  "Toiletries",
  "Cleaning & Home Care",
  "Baby & Kids",
  "Drinks",
  "Skincare & Personal Care",
  "Stationery",
  "Pets",
];

const liveCategories = [...new Set(products.map((product) => product.category))];
const plannedCategories = new Set(["Stationery"]);
const categories = [
  ...categoryOrder.filter(
    (category) =>
      category === "All" ||
      liveCategories.includes(category) ||
      plannedCategories.has(category)
  ),
  ...liveCategories.filter((category) => !categoryOrder.includes(category)),
];
const allProductsSeed = Date.now();

const getSeededRank = (key) => {
  let hash = Math.floor(allProductsSeed % 2147483647) || 1;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 2147483647;
  }

  return hash;
};

const getDynamicAllProducts = (filteredProducts) => {
  const groupedProducts = new Map();

  filteredProducts.forEach((product) => {
    const group = groupedProducts.get(product.category) || [];
    group.push(product);
    groupedProducts.set(product.category, group);
  });

  const visibleCategories = categories.filter(
    (category) => category !== "All" && groupedProducts.has(category)
  );

  if (!visibleCategories.length) return filteredProducts;

  const orderedCategories = visibleCategories;
  const dynamicGroups = new Map(
    orderedCategories.map((category) => [
      category,
      [...groupedProducts.get(category)].sort(
        (a, b) =>
          getSeededRank(`${category}-${a.id}`) - getSeededRank(`${category}-${b.id}`)
      ),
    ])
  );
  const maxRows = Math.max(
    ...orderedCategories.map((category) => dynamicGroups.get(category).length)
  );
  const mixedProducts = [];

  for (let rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
    orderedCategories.forEach((category) => {
      const product = dynamicGroups.get(category)[rowIndex];
      if (product) mixedProducts.push(product);
    });
  }

  return mixedProducts;
};

const categoryTabs = document.querySelector("#categoryTabs");
const productSearch = document.querySelector("#productSearch");
const bundleSection = document.querySelector("#bundles");
const bundleGrid = document.querySelector("#bundleGrid");
const bundleSearch = document.querySelector("#bundleSearch");
const bundleFilterTabs = document.querySelector("#bundleFilterTabs");
const bundleCountMeta = document.querySelector("#bundleCountMeta");
const productGrid = document.querySelector("#productGrid");
const productPagination = document.querySelector("#productPagination");
const mobileCartBar = document.querySelector("#mobileCartBar");
const backToTopButton = document.querySelector("#backToTopButton");
const bundleModal = document.querySelector("#bundleModal");
const bundleDetailMeta = document.querySelector("#bundleDetailMeta");
const bundleDetailTitle = document.querySelector("#bundleDetailTitle");
const bundleDetailBody = document.querySelector("#bundleDetailBody");
const closeBundleButton = document.querySelector("#closeBundleButton");
const cancelBundleButton = document.querySelector("#cancelBundleButton");
const addSelectedBundleButton = document.querySelector("#addSelectedBundleButton");
const reviewModal = document.querySelector("#reviewModal");
const reviewItems = document.querySelector("#reviewItems");
const reviewGrandTotal = document.querySelector("#reviewGrandTotal");
const closeReviewButton = document.querySelector("#closeReviewButton");
const checkoutButton = document.querySelector("#checkoutButton");
const checkoutForm = document.querySelector("#checkoutForm");
const checkoutError = document.querySelector("#checkoutError");
const recurrenceContainer = document.querySelector("#recurrenceOptions");
const orderTypeContainer = document.querySelector("#orderTypeOptions");
const businessFields = document.querySelector("#businessFields");
const onboardingModal = document.querySelector("#onboardingModal");
const onboardingProgress = document.querySelector("#onboardingProgress");
const onboardingContent = document.querySelector("#onboardingContent");
const startShoppingButton = document.querySelector("#startShoppingButton");
const skipOnboardingTop = document.querySelector("#skipOnboardingTop");

const renderCategories = () => {
  if (!categoryTabs) return;

  categoryTabs.innerHTML = categories
    .map(
      (category) => `
        <button class="category-tab ${category === state.selectedCategory ? "active" : ""}"
          type="button"
          data-category="${category}"
          aria-pressed="${category === state.selectedCategory}">
          ${category}
        </button>
      `
    )
    .join("");
};

const renderBundleFilters = () => {
  if (!bundleFilterTabs) return;

  bundleFilterTabs.innerHTML = bundleFilterOptions
    .map(
      (filter) => `
        <button class="bundle-filter-tab ${
          filter === state.selectedBundleAccent ? "active" : ""
        }"
          type="button"
          data-bundle-filter="${filter}"
          aria-pressed="${filter === state.selectedBundleAccent}">
          ${filter}
        </button>
      `
    )
    .join("");
};

const renderBundles = () => {
  if (!bundleGrid) return;

  if (bundleSection) {
    bundleSection.hidden =
      bundleSection.dataset.hideOnSearch !== "false" &&
      Boolean(state.searchQuery.trim());
  }

  const filteredBundles = getFilteredBundles();
  const bundleLimit = Number(bundleGrid.dataset.bundleLimit || 0);
  const shouldLimitBundles =
    bundleLimit > 0 &&
    !state.bundleQuery.trim() &&
    state.selectedBundleAccent === "All";
  const visibleBundles = shouldLimitBundles
    ? filteredBundles.slice(0, bundleLimit)
    : filteredBundles;

  if (bundleCountMeta) {
    bundleCountMeta.textContent = `${visibleBundles.length} bundle${
      visibleBundles.length === 1 ? "" : "s"
    }`;
  }

  if (!visibleBundles.length) {
    bundleGrid.innerHTML = `
      <div class="bundle-empty">
        <strong>No bundles found</strong>
        <p>Try another search term or switch to All bundles.</p>
      </div>
    `;
    return;
  }

  bundleGrid.innerHTML = visibleBundles
    .map((bundle) => {
      const total = getBundleTotal(bundle);
      const itemCount = getBundleItemCount(bundle);
      const isInBasket = isBundleAdded(bundle);
      const preview = getBundlePreview(bundle);

      return `
        <article class="bundle-card" role="button" tabindex="0" data-open-bundle="${bundle.id}" aria-label="View ${bundle.name} bundle details">
          <div class="bundle-card-top">
            <span class="bundle-mark" aria-hidden="true">${getBundleIcon(bundle.icon)}</span>
            <div class="bundle-tier-wrap">
              <span class="bundle-accent">${bundle.accent}</span>
              <strong class="bundle-tier">${bundle.tier}</strong>
            </div>
          </div>
          <div class="bundle-copy">
            <h3>${bundle.name}</h3>
            <p class="bundle-preview">${preview}</p>
          </div>
          <div class="bundle-card-footer">
            <div class="bundle-total">
              <span>${itemCount} item${itemCount === 1 ? "" : "s"}</span>
              <strong>${formatNaira(total)}</strong>
            </div>
            <button
              class="button bundle-button ${isInBasket ? "bundle-remove" : ""}"
              type="button"
              data-bundle-id="${bundle.id}"
              data-bundle-action="${isInBasket ? "remove" : "add"}"
              aria-label="${isInBasket ? "Remove" : "Add"} ${bundle.name} bundle">
              ${isInBasket ? "Remove" : "Add bundle"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");
};

const getFilteredProducts = () => {
  const query = state.searchQuery.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      state.selectedCategory === "All" ||
      product.category === state.selectedCategory;
    const searchableText =
      `${product.name} ${product.brand} ${product.category} ${product.subcategory} ${product.unit}`.toLowerCase();
    const matchesSearch = !query || searchableText.includes(query);

    return matchesCategory && matchesSearch;
  });

  if (state.selectedCategory === "All" && !query) {
    return getDynamicAllProducts(filteredProducts);
  }

  return filteredProducts;
};

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  const startPage = Math.max(2, currentPage - 1);
  const endPage = Math.min(totalPages - 1, currentPage + 1);

  if (startPage > 2) pages.push("start-ellipsis");

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  if (endPage < totalPages - 1) pages.push("end-ellipsis");

  pages.push(totalPages);
  return pages;
};

const renderProductPagination = (totalProducts, startIndex, pageCount, totalPages) => {
  if (!productPagination) return;

  if (totalPages <= 1) {
    productPagination.hidden = true;
    productPagination.innerHTML = "";
    return;
  }

  const currentPage = state.productPage;
  const endIndex = startIndex + pageCount;
  const pageItems = getPaginationItems(currentPage, totalPages);

  productPagination.hidden = false;
  productPagination.innerHTML = `
    <p class="pagination-summary">
      <span>Showing ${startIndex + 1}-${endIndex} of ${totalProducts}</span>
      <span>Page ${currentPage} of ${totalPages}</span>
    </p>
    <div class="pagination-controls">
      <button class="pagination-btn pagination-nav" type="button" data-pagination-action="previous" aria-label="Go to previous products page" ${
        currentPage === 1 ? "disabled" : ""
      }>
        <span class="pagination-nav-full">Previous</span>
        <span class="pagination-nav-short" aria-hidden="true">Prev</span>
      </button>
      <div class="pagination-pages" aria-label="Page numbers">
        ${pageItems
          .map((item) =>
            typeof item === "number"
              ? `<button class="pagination-btn pagination-page ${
                  item === currentPage ? "active" : ""
                }" type="button" data-page="${item}" ${
                  item === currentPage ? 'aria-current="page"' : ""
                }>${item}</button>`
              : `<span class="pagination-ellipsis" aria-hidden="true">...</span>`
          )
          .join("")}
      </div>
      <button class="pagination-btn pagination-nav" type="button" data-pagination-action="next" aria-label="Go to next products page" ${
        currentPage === totalPages ? "disabled" : ""
      }>
        <span class="pagination-nav-full">Next</span>
        <span class="pagination-nav-short" aria-hidden="true">Next</span>
      </button>
    </div>
  `;
};

const scrollToProductGrid = () => {
  if (!productGrid) return;

  const headerHeight =
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")
    ) || 0;
  const controlsHeight = document.querySelector(".basket-controls")?.offsetHeight || 0;
  const offset = headerHeight + controlsHeight + 14;
  const top = productGrid.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
};

const goToProductPage = (page, shouldScroll = true) => {
  const totalPages = Math.max(1, Math.ceil(getFilteredProducts().length / PRODUCT_PAGE_SIZE));
  state.productPage = Math.min(Math.max(page, 1), totalPages);
  renderProducts();

  if (shouldScroll) {
    scrollToProductGrid();
  }
};

const resetProductPage = () => {
  state.productPage = 1;
};

const renderProducts = () => {
  if (!productGrid) return;

  const visibleProducts = getFilteredProducts();

  if (!visibleProducts.length) {
    productGrid.innerHTML = `
      <div class="empty-results">
        <strong>No products found</strong>
        <p>Try another search term or switch to All categories.</p>
      </div>
    `;
    productPagination.hidden = true;
    productPagination.innerHTML = "";
    return;
  }

  const totalPages = Math.ceil(visibleProducts.length / PRODUCT_PAGE_SIZE);
  state.productPage = Math.min(Math.max(state.productPage, 1), totalPages);

  const startIndex = (state.productPage - 1) * PRODUCT_PAGE_SIZE;
  const pageProducts = visibleProducts.slice(startIndex, startIndex + PRODUCT_PAGE_SIZE);

  productGrid.innerHTML = pageProducts
    .map((product) => {
      const quantity = getCartItem(product.id)?.quantity || 0;

      return `
        <article class="product-card" data-product-card="${product.id}">
          <div class="product-image-wrap">
            <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy" />
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
          </div>
          <div class="product-card-body">
            <div class="product-copy">
              <h3>${product.name}</h3>
              <div class="product-meta">
                <span class="pill">${product.category}</span>
                <span class="pill">${product.unit}</span>
              </div>
              <p class="product-price">${formatNaira(product.price)}</p>
            </div>
            <div class="product-actions">
              <span class="add-hint" data-add-hint>${quantity ? "In basket" : "Add item"}</span>
              <div class="quantity-control" aria-label="Quantity for ${product.name}">
                <button type="button" data-action="decrease" data-product-id="${product.id}" aria-label="Decrease ${product.name} quantity">-</button>
                <span data-quantity-value>${quantity}</span>
                <button type="button" data-action="increase" data-product-id="${product.id}" aria-label="Increase ${product.name} quantity">+</button>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  renderProductPagination(
    visibleProducts.length,
    startIndex,
    pageProducts.length,
    totalPages
  );
};

const renderCartSummary = () => {
  if (!mobileCartBar) return;

  const count = getCartCount();
  const grandTotal = getGrandTotal();

  mobileCartBar.classList.toggle("visible", state.cart.length > 0);
  document.body.classList.toggle("has-review-bar", state.cart.length > 0);
  mobileCartBar.innerHTML = `
    <div>
      <strong>${formatNaira(grandTotal)}</strong>
      <small>${count} selected item${count === 1 ? "" : "s"} - ${state.recurrence}</small>
    </div>
    <button class="button" type="button" data-open-review>Review order</button>
  `;
};

const renderReview = () => {
  if (!reviewItems || !reviewGrandTotal) return;

  const subtotal = getSubtotal();
  const serviceCharge = getServiceCharge();
  const grandTotal = getGrandTotal();
  const minimumOrderMarkup = isBelowMinimumOrder()
    ? `<p class="minimum-order-note">${getMinimumOrderMessage()}</p>`
    : "";

  reviewItems.innerHTML = state.cart.length
    ? `<div class="review-items">
        <div class="review-items-head" aria-hidden="true">
          <span>Item</span>
          <span>Quantity</span>
          <span>Unit price</span>
          <span>Total</span>
          <span></span>
        </div>
        ${state.cart
          .map(
            (item, index) => `
              <article class="review-item">
                <div class="review-item-main">
                  <span class="review-item-number">${index + 1}</span>
                  <div class="review-item-copy">
                    <strong>${item.name}</strong>
                    <small>${item.category} / ${item.unit}</small>
                  </div>
                </div>
                <div class="review-quantity-cell">
                  <span class="review-mobile-label">Quantity</span>
                  <div class="quantity-control" aria-label="Quantity for ${item.name}">
                    <button type="button" data-action="decrease" data-product-id="${item.productId}" aria-label="Decrease ${item.name} quantity">-</button>
                    <span>${item.quantity}</span>
                    <button type="button" data-action="increase" data-product-id="${item.productId}" aria-label="Increase ${item.name} quantity">+</button>
                  </div>
                </div>
                <div class="review-price-cell">
                  <span class="review-mobile-label">Unit price</span>
                  <strong>${formatNaira(item.price)}</strong>
                </div>
                <div class="review-line-total">
                  <span class="review-mobile-label">Total</span>
                  <strong>${formatNaira(item.price * item.quantity)}</strong>
                </div>
                <button class="remove-button" type="button" data-action="remove" data-product-id="${item.productId}">Remove</button>
              </article>
            `
          )
          .join("")}
      </div>
      <div class="total-row">
        <span>Subtotal</span>
        <strong>${formatNaira(subtotal)}</strong>
      </div>
      <div class="total-row total-row-soft">
        <span>Service charge (6%)</span>
        <strong>${formatNaira(serviceCharge)}</strong>
      </div>
      ${minimumOrderMarkup}
      <p class="delivery-note">Delivery fee will be confirmed on WhatsApp based on your location.</p>`
    : `<p class="empty-state">Please add at least one item to your basket.</p>`;

  reviewGrandTotal.textContent = formatNaira(grandTotal);
};

const renderRecurrence = () => {
  if (!recurrenceContainer) return;

  recurrenceContainer.innerHTML = recurrenceOptions
    .map(
      (option) => `
        <button class="recurrence-option ${option.value === state.recurrence ? "active" : ""}"
          type="button"
          data-recurrence="${option.value}"
          aria-pressed="${option.value === state.recurrence}">
          <strong>${option.title}</strong>
          <span>${option.text}</span>
        </button>
      `
    )
    .join("");
};

const renderOrderType = () => {
  if (!orderTypeContainer || !businessFields) return;

  orderTypeContainer.innerHTML = orderTypeOptions
    .map(
      (option) => `
        <button class="order-type-option ${option.value === state.orderType ? "active" : ""}"
          type="button"
          data-order-type="${option.value}"
          aria-pressed="${option.value === state.orderType}">
          <strong>${option.title}</strong>
          <span>${option.text}</span>
        </button>
      `
    )
    .join("");

  businessFields.classList.toggle("hidden", state.orderType !== "business");
};

const toggleBackToTopButton = () => {
  if (!backToTopButton) return;

  const shouldShow = window.scrollY > 520;
  backToTopButton.hidden = !shouldShow;
  backToTopButton.classList.toggle("visible", shouldShow);
};

const renderOnboarding = () => {
  if (!onboardingProgress || !onboardingContent) return;

  onboardingProgress.innerHTML = `
    <span class="onboarding-progress-dot active"></span>
    <span class="onboarding-progress-dot"></span>
    <span class="onboarding-progress-dot"></span>
  `;

  onboardingContent.innerHTML = `
    <div class="onboarding-intro">
      <p class="eyebrow">Welcome to Restoq</p>
      <h2 id="onboardingTitle">Never run out of what keeps the day moving.</h2>
      <p>Start with essentials, top up with anything else, and confirm availability on WhatsApp.</p>
    </div>
    <div class="onboarding-highlights" aria-label="Restoq order highlights">
      <span>Pantry</span>
      <span>Cleaning</span>
      <span>Office</span>
      <span>Drinks</span>
    </div>
    <div class="onboarding-list">
      ${onboardingSteps
        .map(
          (step, index) => `
            <article class="onboarding-step" style="--step-index: ${index}">
              <span class="onboarding-step-number">0${index + 1}</span>
              <div>
                <h3>${step.title}</h3>
                <p>${step.description}</p>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
};

const render = () => {
  renderCategories();
  renderBundleFilters();
  renderBundles();
  renderProducts();
  renderCartSummary();
  renderReview();
  renderRecurrence();
  renderOrderType();
};

let isLivePriceSyncing = false;

const initializeLivePrices = async () => {
  if (isLivePriceSyncing) return;

  isLivePriceSyncing = true;
  try {
    const livePrices = await fetchLivePriceMap();
    const updatedProductCount = applyLivePriceMap(livePrices);
    if (updatedProductCount) render();
  } finally {
    isLivePriceSyncing = false;
  }
};

const openReview = () => {
  if (!reviewModal) return;

  if (!state.cart.length) {
    if (checkoutError) {
      checkoutError.textContent = "Please add at least one item to your basket.";
    }
    return;
  }

  reviewModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  renderReview();
  if (checkoutError) checkoutError.textContent = "";
};

const closeReview = () => {
  if (!reviewModal) return;

  reviewModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
};

const completeOnboarding = () => {
  localStorage.setItem(ONBOARDING_KEY, "true");
  if (!onboardingModal) return;
  onboardingModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
};

const getOnboardingCloseCount = () => {
  const count = Number(localStorage.getItem(ONBOARDING_CLOSE_COUNT_KEY) || "0");
  return Number.isFinite(count) ? count : 0;
};

const softlyDismissOnboarding = () => {
  const nextCount = Math.min(getOnboardingCloseCount() + 1, ONBOARDING_CLOSE_LIMIT);
  localStorage.setItem(ONBOARDING_CLOSE_COUNT_KEY, String(nextCount));
  if (!onboardingModal) return;
  onboardingModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
};

const maybeShowOnboarding = () => {
  if (!onboardingModal) return;
  if (localStorage.getItem(ONBOARDING_KEY) === "true") return;
  if (getOnboardingCloseCount() >= ONBOARDING_CLOSE_LIMIT) return;
  renderOnboarding();
  onboardingModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
};

const getCustomerDetails = () => {
  if (!checkoutForm) {
    return {
      fullName: "",
      phone: "",
      deliveryArea: "",
      address: "",
      preferredDeliveryDay: "",
      companyName: "",
      invoiceNeeded: "No",
      note: "",
    };
  }

  const formData = new FormData(checkoutForm);
  return {
    fullName: String(formData.get("fullName") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    deliveryArea: String(formData.get("deliveryArea") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    preferredDeliveryDay: String(formData.get("preferredDeliveryDay") || "").trim(),
    companyName: String(formData.get("companyName") || "").trim(),
    invoiceNeeded: String(formData.get("invoiceNeeded") || "No").trim(),
    note: String(formData.get("note") || "").trim(),
  };
};

const setFieldError = (fieldName, message) => {
  const fieldError = document.querySelector(`[data-error-for="${fieldName}"]`);
  if (fieldError) fieldError.textContent = message;
};

const clearValidation = () => {
  if (checkoutError) checkoutError.textContent = "";
  document.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });
};

const validateCheckout = (customer) => {
  clearValidation();

  if (!state.cart.length) {
    if (checkoutError) {
      checkoutError.textContent = "Please add at least one item to your basket.";
    }
    return false;
  }

  if (isBelowMinimumOrder()) {
    if (checkoutError) checkoutError.textContent = getMinimumOrderMessage();
    return false;
  }

  let isValid = true;

  if (!customer.fullName) {
    setFieldError("fullName", "Please enter your full name.");
    isValid = false;
  }

  if (!customer.phone) {
    setFieldError("phone", "Please enter your phone number.");
    isValid = false;
  }

  if (!customer.deliveryArea) {
    setFieldError(
      "deliveryArea",
      "Please enter your delivery area so we know where to send your order."
    );
    isValid = false;
  }

  if (state.orderType === "business" && !customer.companyName) {
    setFieldError("companyName", "Please enter the company name for this order.");
    isValid = false;
  }

  if (!state.recurrence) {
    if (checkoutError) {
      checkoutError.textContent = "Please choose how often you want this order.";
    }
    isValid = false;
  }

  return isValid;
};

const buildWhatsAppMessage = (customer) => {
  const subtotal = getSubtotal();
  const serviceCharge = getServiceCharge();
  const grandTotal = getGrandTotal();
  const itemLines = state.cart
    .map(
      (item, index) => `${index + 1}. ${item.name} - ${item.unit}
   Qty: ${item.quantity}
   Unit Price: ${formatNaira(item.price)}
   Line Total: ${formatNaira(item.price * item.quantity)}`
    )
    .join("\n\n");

  const optionalAddress = customer.address || "Not provided";
  const optionalDay = customer.preferredDeliveryDay || "Not provided";
  const optionalNote = customer.note || "No additional note.";
  const orderTypeLabel =
    state.orderType === "business" ? "Business procurement" : "Household restock";
  const businessDetails =
    state.orderType === "business"
      ? `
BUSINESS DETAILS
Company Name: ${customer.companyName}
Invoice/Receipt Needed: ${customer.invoiceNeeded}
`
      : "";

  return `Hello ${BRAND_NAME}, I would like to place a ${orderTypeLabel.toLowerCase()} order.

CUSTOMER DETAILS
Order Type: ${orderTypeLabel}
Name: ${customer.fullName}
Phone: ${customer.phone}
Delivery Area: ${customer.deliveryArea}
Address: ${optionalAddress}
Preferred Delivery Day: ${optionalDay}
Recurrence: ${state.recurrence}
${businessDetails}

ORDER ITEMS
${itemLines}

TOTAL
Subtotal: ${formatNaira(subtotal)}
Service Charge (6%): ${formatNaira(serviceCharge)}
Grand Total: ${formatNaira(grandTotal)}

NOTE
${optionalNote}

Please confirm availability, substitution options if needed, delivery fee, and payment details.`;
};

const submitCheckout = () => {
  const customer = getCustomerDetails();
  if (!validateCheckout(customer)) return;

  const message = buildWhatsAppMessage(customer);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
};

if (categoryTabs) {
  categoryTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.selectedCategory = button.dataset.category;
    resetProductPage();
    render();
  });
}

if (productSearch) {
  productSearch.addEventListener("input", (event) => {
    state.searchQuery = event.target.value;
    resetProductPage();
    renderBundles();
    renderProducts();
  });
}

if (bundleSearch) {
  bundleSearch.addEventListener("input", (event) => {
    state.bundleQuery = event.target.value;
    renderBundles();
  });
}

if (bundleFilterTabs) {
  bundleFilterTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-bundle-filter]");
    if (!button) return;
    state.selectedBundleAccent = button.dataset.bundleFilter;
    renderBundleFilters();
    renderBundles();
  });
}

if (productPagination) {
  productPagination.addEventListener("click", (event) => {
    const pageButton = event.target.closest("[data-page]");
    if (pageButton) {
      goToProductPage(Number(pageButton.dataset.page));
      return;
    }

    const actionButton = event.target.closest("[data-pagination-action]");
    if (!actionButton) return;

    const direction = actionButton.dataset.paginationAction === "next" ? 1 : -1;
    goToProductPage(state.productPage + direction);
  });
}

document.addEventListener("click", (event) => {
  const bundleButton = event.target.closest("[data-bundle-id]");
  if (bundleButton) {
    if (bundleButton.dataset.bundleAction === "remove") {
      removeBundleFromCart(bundleButton.dataset.bundleId);
    } else {
      addBundleToCart(bundleButton.dataset.bundleId);
    }
    return;
  }

  const bundleCard = event.target.closest("[data-open-bundle]");
  if (bundleCard) {
    openBundleDetails(bundleCard.dataset.openBundle);
    return;
  }

  const quantityButton = event.target.closest("[data-action]");
  if (quantityButton) {
    const productId = quantityButton.dataset.productId;
    const currentQuantity = getCartItem(productId)?.quantity || 0;

    if (quantityButton.dataset.action === "increase") {
      setQuantity(productId, currentQuantity + 1);
    }

    if (quantityButton.dataset.action === "decrease") {
      setQuantity(productId, currentQuantity - 1);
    }

    if (quantityButton.dataset.action === "remove") {
      setQuantity(productId, 0);
    }

    renderBundles();
    return;
  }

  if (event.target.closest("[data-open-review]")) {
    openReview();
  }
});

if (bundleGrid) {
  bundleGrid.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const bundleCard = event.target.closest("[data-open-bundle]");
    if (!bundleCard) return;
    event.preventDefault();
    openBundleDetails(bundleCard.dataset.openBundle);
  });
}

if (recurrenceContainer) {
  recurrenceContainer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-recurrence]");
    if (!button) return;
    state.recurrence = button.dataset.recurrence;
    persistBasketState();
    render();
  });
}

if (orderTypeContainer) {
  orderTypeContainer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-order-type]");
    if (!button) return;
    state.orderType = button.dataset.orderType;
    persistBasketState();
    clearValidation();
    render();
  });
}

closeReviewButton?.addEventListener("click", closeReview);
checkoutButton?.addEventListener("click", submitCheckout);
closeBundleButton?.addEventListener("click", closeBundleDetails);
cancelBundleButton?.addEventListener("click", closeBundleDetails);
addSelectedBundleButton?.addEventListener("click", () => {
  if (!state.selectedBundleId) return;
  if (addSelectedBundleButton.dataset.bundleAction === "remove") {
    removeBundleFromCart(state.selectedBundleId);
  } else {
    addBundleToCart(state.selectedBundleId);
  }
  closeBundleDetails();
});

reviewModal?.addEventListener("click", (event) => {
  if (event.target === reviewModal) closeReview();
});

bundleModal?.addEventListener("click", (event) => {
  if (event.target === bundleModal) closeBundleDetails();
});

startShoppingButton?.addEventListener("click", () => {
  completeOnboarding();
  document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
});

skipOnboardingTop?.addEventListener("click", softlyDismissOnboarding);

onboardingModal?.addEventListener("click", (event) => {
  if (event.target === onboardingModal) softlyDismissOnboarding();
});

backToTopButton?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("scroll", toggleBackToTopButton, { passive: true });

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (bundleModal && !bundleModal.classList.contains("hidden")) closeBundleDetails();
  if (reviewModal && !reviewModal.classList.contains("hidden")) closeReview();
  if (onboardingModal && !onboardingModal.classList.contains("hidden")) {
    softlyDismissOnboarding();
  }
});

checkoutForm?.addEventListener("input", () => {
  clearValidation();
});

checkoutForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  submitCheckout();
});

render();
toggleBackToTopButton();
maybeShowOnboarding();
initializeLivePrices();

if (LIVE_PRICE_SHEET_URL && LIVE_PRICE_CACHE_BUST_MINUTES > 0) {
  window.setInterval(
    initializeLivePrices,
    LIVE_PRICE_CACHE_BUST_MINUTES * 60 * 1000
  );
}
