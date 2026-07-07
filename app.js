const WHATSAPP_NUMBER = "2348021438824";
const ONBOARDING_KEY = "loop_has_seen_onboarding";
const ONBOARDING_CLOSE_COUNT_KEY = "loop_onboarding_close_count";
const ONBOARDING_CLOSE_LIMIT = 3;
const MINIMUM_ORDER_AMOUNT = 20000;
const SERVICE_CHARGE_RATE = 0.06;

const products = [
  { id: "toilet-tissue-pack", name: "Toilet Tissue Pack", category: "Toiletries", unit: "12 rolls", price: 6500, badge: "Monthly essential" },
  { id: "bathing-soap-pack", name: "Bathing Soap Pack", category: "Toiletries", unit: "6 pieces", price: 4200 },
  { id: "toothpaste", name: "Toothpaste", category: "Toiletries", unit: "140g", price: 2500 },
  { id: "body-cream", name: "Body Cream", category: "Toiletries", unit: "400ml", price: 5800 },
  { id: "sanitary-pads", name: "Sanitary Pads", category: "Toiletries", unit: "Pack", price: 3500 },
  { id: "rice", name: "Rice", category: "Foodstuffs", unit: "5kg", price: 9500, badge: "Popular" },
  { id: "spaghetti-pack", name: "Spaghetti Pack", category: "Foodstuffs", unit: "10 pieces", price: 8000 },
  { id: "vegetable-oil", name: "Vegetable Oil", category: "Foodstuffs", unit: "3L", price: 7800 },
  { id: "noodles-carton", name: "Noodles Carton", category: "Foodstuffs", unit: "40 pieces", price: 9800, badge: "Family pick" },
  { id: "garri", name: "Garri", category: "Foodstuffs", unit: "5kg", price: 5500 },
  { id: "baby-cereal", name: "Baby Cereal", category: "Baby Food", unit: "400g", price: 6700 },
  { id: "baby-wipes", name: "Baby Wipes", category: "Baby Food", unit: "Pack", price: 3000 },
  { id: "diapers", name: "Diapers", category: "Baby Food", unit: "Medium Pack", price: 9500, badge: "Family pick" },
  { id: "baby-lotion", name: "Baby Lotion", category: "Baby Food", unit: "300ml", price: 4500 },
  { id: "dry-dog-food", name: "Dry Dog Food", category: "Dog Food", unit: "3kg", price: 12000, badge: "Popular" },
  { id: "dog-treats", name: "Dog Treats", category: "Dog Food", unit: "Pack", price: 3500 },
  { id: "pet-shampoo", name: "Pet Shampoo", category: "Dog Food", unit: "500ml", price: 4800 },
  { id: "bottled-water", name: "Bottled Water", category: "Beverages", unit: "12 bottles", price: 2800 },
  { id: "malt-drink-pack", name: "Malt Drink Pack", category: "Beverages", unit: "6 cans", price: 4500 },
  { id: "tea-pack", name: "Tea Pack", category: "Beverages", unit: "50 bags", price: 3200 },
  { id: "coffee", name: "Coffee", category: "Beverages", unit: "100g", price: 4700 },
  { id: "milk-refill", name: "Milk Refill", category: "Beverages", unit: "400g", price: 5000, badge: "Monthly essential" },
  { id: "detergent", name: "Detergent", category: "Cleaning Supplies", unit: "2kg", price: 5500 },
  { id: "dishwashing-liquid", name: "Dishwashing Liquid", category: "Cleaning Supplies", unit: "750ml", price: 2700 },
  { id: "bleach", name: "Bleach", category: "Cleaning Supplies", unit: "1L", price: 1800 },
  { id: "disinfectant", name: "Disinfectant", category: "Cleaning Supplies", unit: "1L", price: 3200 },
  { id: "mop-refill", name: "Mop Refill", category: "Cleaning Supplies", unit: "1 piece", price: 2500 },
  { id: "light-bulb", name: "Light Bulb", category: "Other Home Essentials", unit: "2 pieces", price: 3000 },
  { id: "trash-bags", name: "Trash Bags", category: "Other Home Essentials", unit: "Roll", price: 2200 },
  { id: "kitchen-foil", name: "Kitchen Foil", category: "Other Home Essentials", unit: "Roll", price: 2000 },
  { id: "insecticide", name: "Insecticide", category: "Other Home Essentials", unit: "300ml", price: 2800 },
].map((product) => ({
  ...product,
  image: `images/products/${product.id}.png`,
}));

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
};

const formatNaira = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

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

const setQuantity = (productId, quantity) => {
  const product = products.find((item) => item.id === productId);
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

  render();
};

const categories = ["All", ...new Set(products.map((product) => product.category))];

const categoryTabs = document.querySelector("#categoryTabs");
const productSearch = document.querySelector("#productSearch");
const productGrid = document.querySelector("#productGrid");
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

const renderProducts = () => {
  const query = state.searchQuery.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const matchesCategory =
      state.selectedCategory === "All" ||
      product.category === state.selectedCategory;
    const searchableText = `${product.name} ${product.category} ${product.unit}`.toLowerCase();
    const matchesSearch = !query || searchableText.includes(query);

    return matchesCategory && matchesSearch;
  });

  if (!visibleProducts.length) {
    productGrid.innerHTML = `
      <div class="empty-results">
        <strong>No products found</strong>
        <p>Try another search term or switch to All categories.</p>
      </div>
    `;
    return;
  }

  productGrid.innerHTML = visibleProducts
    .map((product) => {
      const quantity = getCartItem(product.id)?.quantity || 0;

      return `
        <article class="product-card">
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
              <span class="add-hint">${quantity ? "In basket" : "Add item"}</span>
              <div class="quantity-control" aria-label="Quantity for ${product.name}">
                <button type="button" data-action="decrease" data-product-id="${product.id}" aria-label="Decrease ${product.name} quantity">-</button>
                <span>${quantity}</span>
                <button type="button" data-action="increase" data-product-id="${product.id}" aria-label="Increase ${product.name} quantity">+</button>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
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
  render();
});

productSearch.addEventListener("input", (event) => {
  state.searchQuery = event.target.value;
  renderProducts();
});

document.addEventListener("click", (event) => {
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
