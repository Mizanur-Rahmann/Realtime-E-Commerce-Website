console.log("🛠️ TechParallax App.js loaded successfully");

const socket = io();
const CART_KEY = "techgadget_cart";

let allProducts = [];
let currentSearchTerm = "";
let currentCategory = "all";
let currentSort = "newest";

function getCart() {
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  $("#cartCount").text(totalItems);
  $("#mobileCartCount").text(totalItems);
}

function addToCart(product) {
  console.log("Adding to cart:", product);
  const cart = getCart();
  const existingItem = cart.find((item) => item.productId === product._id);

  if (existingItem) {
    if (existingItem.quantity >= product.stock) {
      showToast(`Only ${product.stock} items available in stock!`, "warning");
      return;
    }
    existingItem.quantity += 1;
  } else {
    if (product.stock === 0) {
      showToast("This product is out of stock!", "warning");
      return;
    }
    cart.push({
      productId: product._id,
      title: product.title,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
      category: product.category,
    });
  }

  saveCart(cart);
  showToast("🛒 Product added to cart!", "success");
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
  showToast("Product removed from cart", "info");
}

function updateCartQuantity(index, change) {
  const cart = getCart();
  cart[index].quantity += change;

  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  saveCart(cart);
  renderCart();
}

function filterProducts() {
  let filteredProducts = [...allProducts];

  if (currentSearchTerm) {
    const searchTerm = currentSearchTerm.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.title.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
  }

  if (currentCategory !== "all") {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === currentCategory
    );
  }

  filteredProducts.sort((a, b) => {
    switch (currentSort) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "name":
        return a.title.localeCompare(b.title);
      case "newest":
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return filteredProducts;
}

function performSearch() {
  const filteredProducts = filterProducts();
  renderProducts(filteredProducts);

  // Show/hide no results message
  if (filteredProducts.length === 0) {
    $("#noResults").show();
  } else {
    $("#noResults").hide();
  }
}

function renderProducts(products) {
  const grid = $("#productsGrid");
  grid.empty();

  if (products.length === 0) {
    $("#noResults").show();
    return;
  }

  $("#noResults").hide();

  products.forEach((product) => {
    const productCard = `
            <div class="col-md-6 col-lg-4">
                <div class="card product-card h-100">
                    <img src="${
                      product.imageUrl
                    }" class="card-img-top product-image" alt="${
      product.title
    }" 
                         onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
                    <div class="card-body d-flex flex-column">
                        <div class="product-category">${
                          product.category || "General"
                        }</div>
                        <h5 class="card-title">${product.title}</h5>
                        <p class="card-text flex-grow-1">${
                          product.description || "Premium tech gadget"
                        }</p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="price-tag">৳${product.price}</span>
                                <small class="stock-info ${
                                  product.stock < 5 ? "text-danger" : ""
                                }">
                                    ${
                                      product.stock > 0
                                        ? `${product.stock} in stock`
                                        : "Out of stock"
                                    }
                                </small>
                            </div>
                            <button class="btn btn-primary w-100 add-to-cart-btn" 
                                    ${product.stock === 0 ? "disabled" : ""}
                                    data-product-id="${product._id}"
                                    data-product-title="${product.title}"
                                    data-product-price="${product.price}"
                                    data-product-stock="${product.stock}"
                                    data-product-image="${product.imageUrl}"
                                    data-product-category="${product.category}">
                                ${
                                  product.stock === 0
                                    ? "Out of Stock"
                                    : "Add to Cart"
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    grid.append(productCard);
  });

  $(document)
    .off("click", ".add-to-cart-btn")
    .on("click", ".add-to-cart-btn", function () {
      try {
        const productId = $(this).data("product-id");
        const productTitle = $(this).data("product-title");
        const productPrice = $(this).data("product-price");
        const productStock = $(this).data("product-stock");
        const productImage = $(this).data("product-image");
        const productCategory = $(this).data("product-category");

        console.log("Adding product to cart:", productTitle);

        if (productId && productTitle) {
          const product = {
            _id: productId,
            title: productTitle,
            price: productPrice,
            stock: productStock,
            imageUrl: productImage,
            category: productCategory,
          };
          addToCart(product);
        } else {
          console.error("Missing product data");
          showToast("Error adding to cart", "danger");
        }
      } catch (error) {
        console.error("Error in add to cart:", error);
        showToast("Error adding to cart", "danger");
      }
    });
}

function renderCart() {
  const cart = getCart();
  const container = $("#cartItems");
  const totalElement = $("#cartTotal");

  container.empty();

  if (cart.length === 0) {
    container.html(
      '<p class="text-muted text-center py-4">Your cart is empty<br>🛒 Add some awesome tech gadgets!</p>'
    );
    totalElement.text("0");
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const cartItem = `
            <div class="cart-item">
                <div class="d-flex align-items-center">
                    <img src="${item.imageUrl}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" class="me-3"
                         onerror="this.src='https://via.placeholder.com/60x60?text=No+Image'">
                    <div>
                        <h6 class="mb-0">${item.title}</h6>
                        <small class="text-muted">৳${item.price} each • ${item.category}</small>
                    </div>
                </div>
                <div class="d-flex align-items-center">
                    <div class="btn-group me-3">
                        <button class="btn btn-sm btn-outline-secondary" onclick="updateCartQuantity(${index}, -1)">−</button>
                        <span class="px-3 fw-bold">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary" onclick="updateCartQuantity(${index}, 1)">+</button>
                    </div>
                    <span class="me-3 fw-bold text-primary">৳${itemTotal}</span>
                    <button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})">×</button>
                </div>
            </div>
        `;
    container.append(cartItem);
  });

  totalElement.text(total);
}

function renderOrders(orders) {
  const container = $("#ordersList");
  container.empty();

  if (!orders || orders.length === 0) {
    container.html(`
            <div class="text-center py-5">
                <i class="fas fa-receipt fa-3x text-muted mb-3"></i>
                <p class="text-muted">No orders yet</p>
                <small>Your order history will appear here</small>
            </div>
        `);
    return;
  }

  orders.forEach((order) => {
    const orderDate = new Date(order.createdAt).toLocaleString();
    const itemsList = order.items
      .map((item) => `${item.title} (${item.quantity} × ৳${item.price})`)
      .join(", ");

    const statusBadge =
      order.status === "PLACED"
        ? "bg-primary"
        : order.status === "CONFIRMED"
        ? "bg-warning"
        : order.status === "SHIPPED"
        ? "bg-info"
        : order.status === "DELIVERED"
        ? "bg-success"
        : "bg-secondary";

    const orderCard = `
            <div class="order-card">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h6 class="mb-1">Order #${order._id
                          .toString()
                          .slice(-8)
                          .toUpperCase()}</h6>
                        <p class="mb-1 text-sm"><strong>Customer:</strong> ${
                          order.customerName
                        }</p>
                        <p class="mb-1 text-sm"><strong>Email:</strong> ${
                          order.customerEmail
                        }</p>
                    </div>
                    <div class="text-end">
                        <span class="badge ${statusBadge}">${
      order.status
    }</span>
                        <br>
                        <small class="text-muted">${orderDate}</small>
                    </div>
                </div>
                <div class="mb-2">
                    <strong>Items:</strong> ${itemsList}
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <strong class="text-success">Total: ৳${
                      order.totalAmount
                    }</strong>
                    <small class="text-muted">Order ID: ${order._id
                      .toString()
                      .slice(-6)}</small>
                </div>
            </div>
        `;
    container.append(orderCard);
  });
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    const products = await response.json();
    allProducts = products;
    performSearch(); // Apply current filters
  } catch (error) {
    console.error("Error loading products:", error);
    showToast("Error loading products", "danger");
  }
}

async function loadOrders() {
  try {
    console.log("Loading orders...");
    const response = await fetch("/api/orders");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const orders = await response.json();
    console.log("Orders loaded:", orders.length);
    renderOrders(orders);
  } catch (error) {
    console.error("Error loading orders:", error);
    showToast("Error loading orders", "danger");
    $("#ordersList").html(`
            <div class="text-center py-4">
                <i class="fas fa-exclamation-triangle text-warning fa-2x mb-2"></i>
                <p class="text-warning">Failed to load orders</p>
                <small class="text-muted">${error.message}</small>
            </div>
        `);
  }
}

async function placeOrder(orderData) {
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, data: result };
    } else {
      return { success: false, error: result.message };
    }
  } catch (error) {
    return { success: false, error: "Network error occurred" };
  }
}

function showToast(message, type = "success") {
  const toast = $(`
        <div class="toast align-items-center text-bg-${type} border-0 position-fixed top-0 end-0 m-3" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `);

  $("body").append(toast);
  const bsToast = new bootstrap.Toast(toast[0]);
  bsToast.show();

  toast.on("hidden.bs.toast", function () {
    $(this).remove();
  });
}

function initSidebar() {
  // Check if sidebar state is saved
  const sidebarState = localStorage.getItem("sidebarCollapsed");
  if (sidebarState === "true") {
    $(".sidebar").addClass("collapsed");
    $(".main-content").addClass("collapsed");
  }

  $("#sidebarToggle").on("click", function () {
    $(".sidebar").toggleClass("collapsed");
    $(".main-content").toggleClass("collapsed");

    const isCollapsed = $(".sidebar").hasClass("collapsed");
    localStorage.setItem("sidebarCollapsed", isCollapsed);
  });

  $("#mobileMenuBtn").on("click", function () {
    $(".sidebar").toggleClass("active");
  });

  $(document).on("click", function (event) {
    if ($(window).width() <= 768) {
      if (
        !$(event.target).closest(".sidebar").length &&
        !$(event.target).closest("#mobileMenuBtn").length
      ) {
        $(".sidebar").removeClass("active");
      }
    }
  });
}

function initSearchAndFilter() {
  // Sidebar search
  $("#searchInput").on("input", function () {
    currentSearchTerm = $(this).val();
    performSearch();
  });

  $("#searchButton").on("click", function () {
    performSearch();
  });

  $("#mainSearchInput").on("input", function () {
    currentSearchTerm = $(this).val();
    performSearch();
  });

  $("#searchClear").on("click", function () {
    $("#mainSearchInput").val("");
    $("#searchInput").val("");
    currentSearchTerm = "";
    performSearch();
  });

  $(".sidebar-category-btn").on("click", function () {
    $(".sidebar-category-btn").removeClass("active");
    $(this).addClass("active");
    currentCategory = $(this).data("category");
    $("#categoryFilter").val(currentCategory);
    performSearch();
  });

  $("#categoryFilter").on("change", function () {
    currentCategory = $(this).val();
    $(".sidebar-category-btn").removeClass("active");
    $(`.sidebar-category-btn[data-category="${currentCategory}"]`).addClass(
      "active"
    );
    performSearch();
  });

  $("#sortFilter").on("change", function () {
    currentSort = $(this).val();
    performSearch();
  });

  $("#searchInput, #mainSearchInput").on("keypress", function (e) {
    if (e.which === 13) {
      performSearch();
    }
  });
}

$(document).ready(function () {
  console.log("🚀 TechParallax initialized");

  updateCartCount();
  initSidebar();
  initSearchAndFilter();
  loadProducts();

  const cartModal = new bootstrap.Modal("#cartModal");
  $("#viewCart, #mobileViewCart").on("click", function (e) {
    e.preventDefault();
    renderCart();
    cartModal.show();
  });

  const ordersModal = new bootstrap.Modal("#ordersModal");
  $("#viewOrders").on("click", function (e) {
    e.preventDefault();
    console.log("Orders button clicked");
    loadOrders();
    ordersModal.show();
  });

  $("#checkoutForm").on("submit", async function (e) {
    e.preventDefault();

    const customerName = $("#customerName").val().trim();
    const customerEmail = $("#customerEmail").val().trim();
    const cart = getCart();

    if (cart.length === 0) {
      showToast("Your cart is empty!", "warning");
      return;
    }

    if (!customerName || !customerEmail) {
      showToast("Please fill in all fields", "warning");
      return;
    }

    const orderData = {
      customerName,
      customerEmail,
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    $("#checkoutMessage").html(
      '<div class="alert alert-info">⏳ Processing your order...</div>'
    );

    const result = await placeOrder(orderData);

    if (result.success) {
      $("#checkoutMessage").html(
        '<div class="alert alert-success">✅ Order placed successfully!</div>'
      );
      saveCart([]);
      renderCart();
      $("#checkoutForm")[0].reset();

      if ($("#ordersModal").hasClass("show")) {
        loadOrders();
      }

      setTimeout(() => {
        cartModal.hide();
      }, 2000);
    } else {
      $("#checkoutMessage").html(
        `<div class="alert alert-danger">❌ ${result.error}</div>`
      );
    }
  });

  socket.on("productUpdate", function () {
    showToast("🔄 Product catalog updated!", "info");
    loadProducts(); // Reload products to get updates
  });

  socket.on("newOrder", function (order) {
    showToast(
      `📦 New order from ${order.customerName} for ৳${order.totalAmount}`,
      "info"
    );

    if ($("#ordersModal").hasClass("show")) {
      loadOrders();
    }
  });

  $(window).on("resize", function () {
    if ($(window).width() > 768) {
      $(".sidebar").removeClass("active");
    }
  });
});
