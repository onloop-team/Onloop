const WHATSAPP_NUMBER = "2348119636331";
const BRAND_NAME = "Restoq";
const ONBOARDING_KEY = "restoq_has_seen_onboarding";
const ONBOARDING_CLOSE_COUNT_KEY = "restoq_onboarding_close_count";
const LEGACY_ONBOARDING_KEY = "loop_has_seen_onboarding";
const LEGACY_ONBOARDING_CLOSE_COUNT_KEY = "loop_onboarding_close_count";
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

const giftProductIds = new Set([
  "maltina-can-33cl-x-24",
  "five-alive-pulpy-orange-1l-x-12",
  "milo-food-drink-500g",
  "bournvita-food-drink-500g",
  "capri-sun-orange-200ml-x-10",
  "ribena-blackcurrant-1l",
  "nivea-rich-nourishing-body-lotion-400ml",
  "nivea-perfect-radiant-body-lotion-400ml",
  "dove-beauty-bar-100g-x-4",
  "dettol-original-antibacterial-soap-110g-x-6",
  "bath-body-works-body-mist-japanese-cherry-blossom-236ml",
  "victoria-s-secret-body-mist-pure-seduction-250ml",
  "lattafa-yara-eau-de-parfum-100ml",
  "armaf-club-de-nuit-intense-man-105ml",
]);

const products = catalogProducts.map((product) => ({
  ...product,
  brand: product.brand || "",
  originalCategory: product.category,
  category: getDisplayCategory(product.category),
  subcategory: product.subcategory || "",
}));

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
    tier: "NGN 100k",
    summary: "A fuller pantry order for larger homes and team kitchens.",
    icon: "store",
    items: [
      { productId: "caprice-parboiled-rice-5kg", quantity: 4 },
      { productId: "indomie-instant-noodles-chicken-70g-x-40", quantity: 1 },
      { productId: "power-oil-vegetable-oil-3l", quantity: 3 },
      { productId: "golden-penny-spaghetti-500g", quantity: 6 },
      { productId: "golden-penny-semovita-1kg", quantity: 5 },
      { productId: "gino-tomato-paste-sachet-70g-x-50", quantity: 1 },
      { productId: "maggi-chicken-cubes-100-cubes", quantity: 1 },
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
    accent: "Gift pack",
    tier: "NGN 50k",
    summary: "A practical hamper base for appreciation and team welfare.",
    icon: "gift",
    items: [
      { productId: "maltina-can-33cl-x-24", quantity: 1 },
      { productId: "five-alive-pulpy-orange-1l-x-12", quantity: 1 },
      { productId: "milo-food-drink-500g", quantity: 1 },
      { productId: "bournvita-food-drink-500g", quantity: 1 },
      { productId: "nivea-rich-nourishing-body-lotion-400ml", quantity: 1 },
      { productId: "dettol-original-antibacterial-soap-110g-x-6", quantity: 1 },
    ],
  },
];

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

const state = {
  selectedCategory: "All",
  searchQuery: "",
  productPage: 1,
  cart: [],
  bundleCounts: {},
  recurrence: "Monthly",
  orderType: initialOrderType,
  selectedBundleId: null,
};

const formatNaira = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

const getProductById = (productId) =>
  products.find((product) => product.id === productId);

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
  };

  return icons[icon] || icons.basket;
};

const updateProductCardState = (productId) => {
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
};

const addBundleToCart = (bundleId) => {
  const bundle = bundles.find((item) => item.id === bundleId);
  if (!bundle) return;

  bundle.items.forEach((bundleItem) => {
    const currentQuantity = getCartItem(bundleItem.productId)?.quantity || 0;
    setQuantity(bundleItem.productId, currentQuantity + bundleItem.quantity);
  });

  state.bundleCounts[bundle.id] = (state.bundleCounts[bundle.id] || 0) + 1;
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
  renderBundles();
};

const getBundleProducts = (bundle) =>
  bundle.items
    .map((bundleItem) => {
      const product = getProductById(bundleItem.productId);
      return product ? { ...product, quantity: bundleItem.quantity } : null;
    })
    .filter(Boolean);

const renderBundleDetails = (bundle) => {
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
  if (!bundle) return;

  state.selectedBundleId = bundle.id;
  renderBundleDetails(bundle);
  bundleModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
};

const closeBundleDetails = () => {
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
  "Gifts",
  "Stationery",
  "Pets",
];

const liveCategories = [...new Set(products.map((product) => product.category))];
const plannedCategories = new Set(["Gifts", "Stationery"]);
const categories = [
  ...categoryOrder.filter(
    (category) =>
      category === "All" ||
      liveCategories.includes(category) ||
      plannedCategories.has(category)
  ),
  ...liveCategories.filter((category) => !categoryOrder.includes(category)),
];

const categoryTabs = document.querySelector("#categoryTabs");
const productSearch = document.querySelector("#productSearch");
const bundleSection = document.querySelector("#bundles");
const bundleGrid = document.querySelector("#bundleGrid");
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

const renderBundles = () => {
  bundleSection.hidden = Boolean(state.searchQuery.trim());

  bundleGrid.innerHTML = bundles
    .map((bundle) => {
      const total = getBundleTotal(bundle);
      const itemCount = getBundleItemCount(bundle);
      const isInBasket = isBundleAdded(bundle);
      const preview = bundle.items
        .map((bundleItem) => {
          const product = getProductById(bundleItem.productId);
          return product ? `${product.name} x${bundleItem.quantity}` : "";
        })
        .filter(Boolean)
        .join(", ");

      return `
        <article class="bundle-card" role="button" tabindex="0" data-open-bundle="${bundle.id}" aria-label="View ${bundle.name} bundle details">
          <div class="bundle-card-top">
            <span class="bundle-mark" aria-hidden="true">${getBundleIcon(bundle.icon)}</span>
            <div>
              <span class="bundle-accent">${bundle.accent}</span>
              <strong>${bundle.tier}</strong>
            </div>
          </div>
          <div class="bundle-copy">
            <h3>${bundle.name}</h3>
          </div>
          <p class="bundle-preview">${preview}</p>
          <div class="bundle-card-footer">
            <span>${itemCount} item${itemCount === 1 ? "" : "s"} - ${formatNaira(total)}</span>
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
  return products.filter((product) => {
    const matchesCategory =
      state.selectedCategory === "All" ||
      product.category === state.selectedCategory ||
      (state.selectedCategory === "Gifts" && giftProductIds.has(product.id));
    const searchableText = `${product.name} ${product.brand} ${product.category} ${product.subcategory} ${product.unit} ${
      giftProductIds.has(product.id) ? "gifts welfare hamper" : ""
    }`.toLowerCase();
    const matchesSearch = !query || searchableText.includes(query);

    return matchesCategory && matchesSearch;
  });
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
  const subtotal = getSubtotal();
  const serviceCharge = getServiceCharge();
  const grandTotal = getGrandTotal();
  const minimumOrderMarkup = isBelowMinimumOrder()
    ? `<p class="minimum-order-note">${getMinimumOrderMessage()}</p>`
    : "";

  reviewItems.innerHTML = state.cart.length
    ? `<div class="review-items">
        ${state.cart
          .map(
            (item) => `
              <div class="review-item">
                <div class="cart-item-row">
                  <div>
                    <strong>${item.name}</strong>
                    <small>${item.unit}</small>
                  </div>
                  <strong>${formatNaira(item.price * item.quantity)}</strong>
                </div>
                <small>Unit price: ${formatNaira(item.price)}</small>
                <div class="cart-item-row">
                  <div class="quantity-control" aria-label="Quantity for ${item.name}">
                    <button type="button" data-action="decrease" data-product-id="${item.productId}" aria-label="Decrease ${item.name} quantity">-</button>
                    <span>${item.quantity}</span>
                    <button type="button" data-action="increase" data-product-id="${item.productId}" aria-label="Increase ${item.name} quantity">+</button>
                  </div>
                  <button class="remove-button" type="button" data-action="remove" data-product-id="${item.productId}">Remove</button>
                </div>
              </div>
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
  const shouldShow = window.scrollY > 520;
  backToTopButton.hidden = !shouldShow;
  backToTopButton.classList.toggle("visible", shouldShow);
};

const renderOnboarding = () => {
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
  renderBundles();
  renderProducts();
  renderCartSummary();
  renderReview();
  renderRecurrence();
  renderOrderType();
};

const openReview = () => {
  if (!state.cart.length) {
    checkoutError.textContent = "Please add at least one item to your basket.";
    return;
  }

  reviewModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  renderReview();
  checkoutError.textContent = "";
};

const closeReview = () => {
  reviewModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
};

const completeOnboarding = () => {
  localStorage.setItem(ONBOARDING_KEY, "true");
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
  onboardingModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
};

const maybeShowOnboarding = () => {
  if (localStorage.getItem(ONBOARDING_KEY) === "true") return;
  if (getOnboardingCloseCount() >= ONBOARDING_CLOSE_LIMIT) return;
  renderOnboarding();
  onboardingModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
};

const getCustomerDetails = () => {
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
  checkoutError.textContent = "";
  document.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });
};

const validateCheckout = (customer) => {
  clearValidation();

  if (!state.cart.length) {
    checkoutError.textContent = "Please add at least one item to your basket.";
    return false;
  }

  if (isBelowMinimumOrder()) {
    checkoutError.textContent = getMinimumOrderMessage();
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
    checkoutError.textContent = "Please choose how often you want this order.";
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

categoryTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.selectedCategory = button.dataset.category;
  resetProductPage();
  render();
});

productSearch.addEventListener("input", (event) => {
  state.searchQuery = event.target.value;
  resetProductPage();
  renderBundles();
  renderProducts();
});

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

bundleGrid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const bundleCard = event.target.closest("[data-open-bundle]");
  if (!bundleCard) return;
  event.preventDefault();
  openBundleDetails(bundleCard.dataset.openBundle);
});

recurrenceContainer.addEventListener("click", (event) => {
  const button = event.target.closest("[data-recurrence]");
  if (!button) return;
  state.recurrence = button.dataset.recurrence;
  render();
});

orderTypeContainer.addEventListener("click", (event) => {
  const button = event.target.closest("[data-order-type]");
  if (!button) return;
  state.orderType = button.dataset.orderType;
  clearValidation();
  render();
});

closeReviewButton.addEventListener("click", closeReview);
checkoutButton.addEventListener("click", submitCheckout);
closeBundleButton.addEventListener("click", closeBundleDetails);
cancelBundleButton.addEventListener("click", closeBundleDetails);
addSelectedBundleButton.addEventListener("click", () => {
  if (!state.selectedBundleId) return;
  if (addSelectedBundleButton.dataset.bundleAction === "remove") {
    removeBundleFromCart(state.selectedBundleId);
  } else {
    addBundleToCart(state.selectedBundleId);
  }
  closeBundleDetails();
});

reviewModal.addEventListener("click", (event) => {
  if (event.target === reviewModal) closeReview();
});

bundleModal.addEventListener("click", (event) => {
  if (event.target === bundleModal) closeBundleDetails();
});

startShoppingButton.addEventListener("click", () => {
  completeOnboarding();
  document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
});

skipOnboardingTop.addEventListener("click", softlyDismissOnboarding);

onboardingModal.addEventListener("click", (event) => {
  if (event.target === onboardingModal) softlyDismissOnboarding();
});

backToTopButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("scroll", toggleBackToTopButton, { passive: true });

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!bundleModal.classList.contains("hidden")) closeBundleDetails();
  if (!reviewModal.classList.contains("hidden")) closeReview();
  if (!onboardingModal.classList.contains("hidden")) softlyDismissOnboarding();
});

checkoutForm.addEventListener("input", () => {
  clearValidation();
});

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitCheckout();
});

render();
toggleBackToTopButton();
maybeShowOnboarding();
