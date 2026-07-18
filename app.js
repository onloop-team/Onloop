const WHATSAPP_NUMBER = "2348021438824";
const ONBOARDING_KEY = "loop_has_seen_onboarding";
const ONBOARDING_CLOSE_COUNT_KEY = "loop_onboarding_close_count";
const ONBOARDING_CLOSE_LIMIT = 3;
const MINIMUM_ORDER_AMOUNT = 20000;
const SERVICE_CHARGE_RATE = 0.06;
const PAGE_SIZE = 20;
const PAGINATION_START_COUNT = 5;
const PAGINATION_END_COUNT = 3;
const PAGINATION_MIDDLE_SIBLINGS = 1;

const normalizeCatalogField = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const getCatalogDedupKey = (product) =>
  [
    normalizeCatalogField(product.brand),
    normalizeCatalogField(product.name),
    normalizeCatalogField(product.category),
    normalizeCatalogField(product.subcategory),
    normalizeCatalogField(product.unit),
  ].join("|");

// Prevent repeated catalog rows from rendering more than once in the storefront.
const dedupeCatalogProducts = (catalog) => {
  const seenProducts = new Map();

  return catalog.filter((product) => {
    const dedupKey = getCatalogDedupKey(product);
    const existingProduct = seenProducts.get(dedupKey);

    if (!existingProduct) {
      seenProducts.set(dedupKey, product);
      return true;
    }

    console.warn(
      `Skipping duplicate catalog product "${product.name}" (${product.unit}). Keeping "${existingProduct.id}", dropping "${product.id}".`
    );
    return false;
  });
};

const catalogProducts = Array.isArray(window.LOOP_CATALOG_PRODUCTS)
  ? dedupeCatalogProducts(window.LOOP_CATALOG_PRODUCTS)
  : [];

const products = catalogProducts.map((product) => ({
  ...product,
  brand: product.brand || "",
  subcategory: product.subcategory || "",
}));

const bundles = [
  {
    id: "foodstuff-package",
    name: "Foodstuff Package",
    accent: "Pantry",
    icon: "basket",
    items: [
      { productId: "caprice-parboiled-rice-5kg", quantity: 1 },
      { productId: "golden-penny-spaghetti-500g", quantity: 2 },
      { productId: "power-oil-vegetable-oil-3l", quantity: 1 },
      { productId: "golden-penny-semovita-1kg", quantity: 1 },
    ],
  },
  {
    id: "toiletries-package",
    name: "Toiletries Package",
    accent: "Bathroom",
    icon: "droplet",
    items: [
      { productId: "familia-toilet-tissue-classic-natural-whiteness-12-rolls", quantity: 1 },
      { productId: "dettol-original-antibacterial-soap-110g-x-6", quantity: 1 },
      { productId: "closeup-toothpaste-deep-action-140g", quantity: 2 },
      { productId: "always-ultra-sanitary-pads-8-pads", quantity: 1 },
    ],
  },
  {
    id: "skincare-package",
    name: "Skincare Package",
    accent: "Care",
    icon: "sparkle",
    items: [
      { productId: "nivea-rich-nourishing-body-lotion-400ml", quantity: 1 },
      { productId: "simple-hydrating-light-moisturiser-125ml", quantity: 1 },
      { productId: "garnier-micellar-cleansing-water-400ml", quantity: 1 },
    ],
  },
  {
    id: "cleaning-package",
    name: "Cleaning Package",
    accent: "Cleaning",
    icon: "spray",
    items: [
      { productId: "good-mama-detergent-assorted-1-7kg", quantity: 1 },
      { productId: "morning-fresh-dishwashing-liquid-450ml", quantity: 1 },
      { productId: "hypo-bleach-regular-3-5l", quantity: 1 },
      { productId: "dettol-antiseptic-liquid-500ml", quantity: 1 },
    ],
  },
];

const recurrenceOptions = [
  { value: "One-time order", title: "One-time order", text: "Just this order for now." },
  { value: "Weekly", title: "Weekly", text: "Best for fast-moving essentials." },
  { value: "Biweekly", title: "Biweekly", text: "Good for couples and small homes." },
  { value: "Monthly", title: "Monthly", text: "Best for full home restock." },
];

const onboardingSteps = [
  {
    title: "Choose essentials.",
    description:
      "Add the items your home needs regularly.",
  },
  {
    title: "Set your rhythm.",
    description:
      "Pick one-time, weekly, biweekly, or monthly.",
  },
  {
    title: "Confirm on WhatsApp.",
    description:
      "We confirm availability, delivery, and payment.",
  },
];

const state = {
  selectedCategory: "All",
  searchQuery: "",
  cart: [],
  recurrence: "Monthly",
  currentPage: 1,
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
};

const categories = ["All", ...new Set(products.map((product) => product.category))];

const categoryTabs = document.querySelector("#categoryTabs");
const productSearch = document.querySelector("#productSearch");
const bundleGrid = document.querySelector("#bundleGrid");
const productResultsMeta = document.querySelector("#productResultsMeta");
const productGrid = document.querySelector("#productGrid");
const productPagination = document.querySelector("#productPagination");
const desktopCart = document.querySelector("#desktopCart");
const mobileCartBar = document.querySelector("#mobileCartBar");
const reviewModal = document.querySelector("#reviewModal");
const reviewItems = document.querySelector("#reviewItems");
const reviewGrandTotal = document.querySelector("#reviewGrandTotal");
const closeReviewButton = document.querySelector("#closeReviewButton");
const checkoutButton = document.querySelector("#checkoutButton");
const checkoutForm = document.querySelector("#checkoutForm");
const checkoutError = document.querySelector("#checkoutError");
const recurrenceContainer = document.querySelector("#recurrenceOptions");
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
  bundleGrid.innerHTML = bundles
    .map((bundle) => {
      const total = getBundleTotal(bundle);
      const itemCount = getBundleItemCount(bundle);
      const preview = bundle.items
        .map((bundleItem) => {
          const product = getProductById(bundleItem.productId);
          return product ? `${product.name} x${bundleItem.quantity}` : "";
        })
        .filter(Boolean)
        .join(", ");

      return `
        <article class="bundle-card">
          <div class="bundle-card-top">
            <span class="bundle-mark" aria-hidden="true">${getBundleIcon(bundle.icon)}</span>
            <div>
              <span class="bundle-accent">${bundle.accent}</span>
              <strong>${formatNaira(total)}</strong>
            </div>
          </div>
          <div class="bundle-copy">
            <h3>${bundle.name}</h3>
          </div>
          <p class="bundle-preview">${preview}</p>
          <div class="bundle-card-footer">
            <span>${itemCount} item${itemCount === 1 ? "" : "s"}</span>
            <button class="button bundle-button" type="button" data-bundle-id="${bundle.id}">
              Add bundle
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
      product.category === state.selectedCategory;
    const searchableText = `${product.name} ${product.brand} ${product.category} ${product.subcategory} ${product.unit}`.toLowerCase();
    const matchesSearch = !query || searchableText.includes(query);

    return matchesCategory && matchesSearch;
  });
};

const renderProductPagination = (totalProducts, totalPages) => {
  if (!productResultsMeta || !productPagination) return;

  if (!totalProducts) {
    productResultsMeta.textContent = "0 products";
    productPagination.innerHTML = "";
    productPagination.hidden = true;
    return;
  }

  const pageStart = (state.currentPage - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, totalProducts);

  productResultsMeta.textContent = `Showing ${pageStart + 1}-${pageEnd} of ${totalProducts} products | Page ${state.currentPage} of ${totalPages}`;

  if (totalPages === 1) {
    productPagination.innerHTML = "";
    productPagination.hidden = true;
    return;
  }

  const visiblePages = new Set();

  const isWithinStartBlock = state.currentPage <= PAGINATION_START_COUNT;

  if (isWithinStartBlock) {
    for (
      let pageNumber = 1;
      pageNumber <= Math.min(totalPages, PAGINATION_START_COUNT);
      pageNumber += 1
    ) {
      visiblePages.add(pageNumber);
    }
  } else {
    visiblePages.add(1);
  }

  for (
    let pageNumber = Math.max(1, totalPages - PAGINATION_END_COUNT + 1);
    pageNumber <= totalPages;
    pageNumber += 1
  ) {
    visiblePages.add(pageNumber);
  }

  if (!isWithinStartBlock) {
    for (
      let pageNumber = Math.max(1, state.currentPage - PAGINATION_MIDDLE_SIBLINGS);
      pageNumber <= Math.min(totalPages, state.currentPage + PAGINATION_MIDDLE_SIBLINGS);
      pageNumber += 1
    ) {
      visiblePages.add(pageNumber);
    }
  }

  const pageButtons = [];
  const sortedPages = [...visiblePages].sort((left, right) => left - right);
  let previousPageNumber = 0;

  sortedPages.forEach((pageNumber) => {
    if (previousPageNumber && pageNumber - previousPageNumber > 1) {
      pageButtons.push(`<span class="pagination-ellipsis" aria-hidden="true">...</span>`);
    }

    const isActive = pageNumber === state.currentPage;
    pageButtons.push(`
      <button
        class="pagination-button ${isActive ? "active" : ""}"
        type="button"
        data-page-number="${pageNumber}"
        ${isActive ? 'aria-current="page"' : ""}
      >
        ${pageNumber}
      </button>
    `);

    previousPageNumber = pageNumber;
  });

  productPagination.hidden = false;
  productPagination.innerHTML = `
    <button
      class="pagination-button pagination-button-nav"
      type="button"
      data-page-direction="previous"
      ${state.currentPage === 1 ? "disabled" : ""}
    >
      Previous
    </button>
    ${pageButtons.join("")}
    <button
      class="pagination-button pagination-button-nav"
      type="button"
      data-page-direction="next"
      ${state.currentPage === totalPages ? "disabled" : ""}
    >
      Next
    </button>
  `;
};

const renderProducts = () => {
  const filteredProducts = getFilteredProducts();
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  state.currentPage = Math.min(Math.max(state.currentPage, 1), totalPages);
  const pageStart = (state.currentPage - 1) * PAGE_SIZE;
  const visibleProducts = filteredProducts.slice(pageStart, pageStart + PAGE_SIZE);

  if (!filteredProducts.length) {
    productGrid.innerHTML = `
      <div class="empty-results">
        <strong>No products found</strong>
        <p>Try another search term or switch to All categories.</p>
      </div>
    `;
    renderProductPagination(0, 1);
    return;
  }

  productGrid.innerHTML = visibleProducts
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

  renderProductPagination(filteredProducts.length, totalPages);
};

const goToPage = (nextPage) => {
  const filteredProducts = getFilteredProducts();
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const clampedPage = Math.min(Math.max(nextPage, 1), totalPages);

  if (clampedPage === state.currentPage) return;

  state.currentPage = clampedPage;
  renderProducts();
  document.querySelector(".product-scroll")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

const renderCartSummary = () => {
  const count = getCartCount();
  const subtotal = getSubtotal();
  const serviceCharge = getServiceCharge();
  const grandTotal = getGrandTotal();
  const minimumOrderMarkup = isBelowMinimumOrder()
    ? `<p class="minimum-order-note">${getMinimumOrderMessage()}</p>`
    : "";

  const itemsMarkup = state.cart.length
    ? `<div class="cart-items">
        ${state.cart
          .map(
            (item) => `
              <div class="cart-item">
                <div class="cart-item-row">
                  <strong>${item.name}</strong>
                  <strong>${formatNaira(item.price * item.quantity)}</strong>
                </div>
                <small>${item.unit} - Qty: ${item.quantity} - ${formatNaira(item.price)} each</small>
                <button class="remove-button" type="button" data-action="remove" data-product-id="${item.productId}">Remove</button>
              </div>
            `
          )
          .join("")}
      </div>`
    : `<p class="empty-state">Your basket is empty. Add a few home essentials to see your bill.</p>`;

  desktopCart.innerHTML = `
    <div class="cart-card">
      <div class="cart-header">
        <div>
          <p class="eyebrow">Current bill</p>
          <h3>${count} selected item${count === 1 ? "" : "s"}</h3>
        </div>
        <span class="pill pill-amber">${state.recurrence}</span>
      </div>
      ${itemsMarkup}
      <div class="total-row">
        <span>Subtotal</span>
        <strong>${formatNaira(subtotal)}</strong>
      </div>
      <div class="total-row total-row-soft">
        <span>Service charge (6%)</span>
        <strong>${formatNaira(serviceCharge)}</strong>
      </div>
      ${minimumOrderMarkup}
      <p class="delivery-note">Delivery fee will be confirmed on WhatsApp based on your location.</p>
      <div class="total-row">
        <span>Grand total</span>
        <strong>${formatNaira(grandTotal)}</strong>
      </div>
      <button class="button button-primary" type="button" data-open-review ${state.cart.length ? "" : "disabled"}>Review order</button>
    </div>
  `;

  mobileCartBar.classList.toggle("visible", state.cart.length > 0);
  mobileCartBar.innerHTML = `
    <div>
      <strong>${formatNaira(grandTotal)}</strong>
      <small>${count} selected item${count === 1 ? "" : "s"}</small>
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

const renderOnboarding = () => {
  onboardingProgress.innerHTML = "";

  onboardingContent.innerHTML = `
    <div class="onboarding-glow" aria-hidden="true"></div>
    <div class="onboarding-intro">
      <p class="eyebrow">Welcome to Loop</p>
      <h2 id="onboardingTitle">Build your home restock basket.</h2>
      <p>Pick what you need, choose a rhythm, and send it to WhatsApp.</p>
    </div>
    <div class="onboarding-list">
      ${onboardingSteps
        .map(
          (step, index) => `
            <article class="onboarding-step">
              <span>${index + 1}</span>
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

  return `Hello Loop, I would like to place a home essentials order.

CUSTOMER DETAILS
Name: ${customer.fullName}
Phone: ${customer.phone}
Delivery Area: ${customer.deliveryArea}
Address: ${optionalAddress}
Preferred Delivery Day: ${optionalDay}
Recurrence: ${state.recurrence}

ORDER ITEMS
${itemLines}

TOTAL
Subtotal: ${formatNaira(subtotal)}
Service Charge (6%): ${formatNaira(serviceCharge)}
Grand Total: ${formatNaira(grandTotal)}

NOTE
${optionalNote}

Please confirm availability, delivery fee, and payment details.`;
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
  state.currentPage = 1;
  render();
});

productSearch.addEventListener("input", (event) => {
  state.searchQuery = event.target.value;
  state.currentPage = 1;
  renderProducts();
});

document.addEventListener("click", (event) => {
  const bundleButton = event.target.closest("[data-bundle-id]");
  if (bundleButton) {
    addBundleToCart(bundleButton.dataset.bundleId);
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
  }

  if (event.target.closest("[data-open-review]")) {
    openReview();
  }

  const pageButton = event.target.closest("[data-page-number]");
  if (pageButton) {
    goToPage(Number(pageButton.dataset.pageNumber) || 1);
  }

  const pageDirectionButton = event.target.closest("[data-page-direction]");
  if (pageDirectionButton) {
    const direction = pageDirectionButton.dataset.pageDirection;
    goToPage(direction === "next" ? state.currentPage + 1 : state.currentPage - 1);
  }
});

recurrenceContainer.addEventListener("click", (event) => {
  const button = event.target.closest("[data-recurrence]");
  if (!button) return;
  state.recurrence = button.dataset.recurrence;
  render();
});

closeReviewButton.addEventListener("click", closeReview);
checkoutButton.addEventListener("click", submitCheckout);

reviewModal.addEventListener("click", (event) => {
  if (event.target === reviewModal) closeReview();
});

startShoppingButton.addEventListener("click", () => {
  completeOnboarding();
  document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
});

skipOnboardingTop.addEventListener("click", softlyDismissOnboarding);

onboardingModal.addEventListener("click", (event) => {
  if (event.target === onboardingModal) softlyDismissOnboarding();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
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
maybeShowOnboarding();
