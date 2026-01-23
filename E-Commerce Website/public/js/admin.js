const socket = io();

let allProducts = [];
let allOrders = [];

async function loadProducts() {
  try {
    const response = await fetch("/admin/products");
    const products = await response.json();
    allProducts = products;
    renderProductsTable(products);
    updateStatistics();
  } catch (error) {
    console.error("Error loading products:", error);
    showAdminMessage("Error loading products", "danger");
  }
}

async function loadOrders() {
  try {
    const response = await fetch("/api/orders");
    if (response.ok) {
      const orders = await response.json();
      allOrders = orders;
      updateStatistics();
    }
  } catch (error) {
    console.error("Error loading orders:", error);
  }
}

function updateStatistics() {
  $("#totalProducts").text(allProducts.length);

  $("#totalOrders").text(allOrders.length);

  const lowStockCount = allProducts.filter(
    (product) => product.stock < 5 && product.stock > 0
  ).length;
  $("#lowStock").text(lowStockCount);

  const totalRevenue = allOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );
  $("#totalRevenue").text(totalRevenue);
}

function renderProductsTable(products) {
  const table = $("#productsTable");
  table.empty();

  if (products.length === 0) {
    table.html(`
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-box-open fa-2x text-muted mb-3"></i>
                    <p class="text-muted">No products in inventory</p>
                    <small>Add your first product using the form above</small>
                </td>
            </tr>
        `);
    return;
  }

  products.forEach((product) => {
    const stockStatus =
      product.stock === 0
        ? '<span class="badge bg-danger">Out of Stock</span>'
        : product.stock < 5
        ? '<span class="badge bg-warning">Low Stock</span>'
        : '<span class="badge bg-success">In Stock</span>';

    const row = `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${product.imageUrl}" 
                             alt="${product.title}" 
                             style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;" 
                             class="me-3"
                             onerror="this.src='https://via.placeholder.com/50x50?text=No+Image'">
                        <div>
                            <strong class="d-block">${product.title}</strong>
                            <small class="text-muted">${
                              product.description
                                ? product.description.substring(0, 50) + "..."
                                : "No description"
                            }</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="category-badge">${
                      product.category || "General"
                    }</span>
                </td>
                <td>
                    <input type="number" 
                           class="form-control price-input" 
                           value="${product.price}" 
                           data-id="${product._id}"
                           style="min-width: 100px;"
                           min="0"
                           step="0.01">
                </td>
                <td>
                    <input type="number" 
                           class="form-control stock-input" 
                           value="${product.stock}" 
                           data-id="${product._id}"
                           style="min-width: 80px;"
                           min="0">
                </td>
                <td>
                    ${stockStatus}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-success update-btn" data-id="${
                          product._id
                        }" title="Update Price & Stock">
                            <i class="fas fa-save"></i>
                        </button>
                        <button class="btn btn-danger delete-btn" data-id="${
                          product._id
                        }" title="Delete Product">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    table.append(row);
  });
}

$("#addProductForm").on("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("title", $("#productTitle").val().trim());
  formData.append("price", parseFloat($("#productPrice").val()));
  formData.append("stock", parseInt($("#productStock").val()));
  formData.append("category", $("#productCategory").val());
  formData.append("currency", $("#productCurrency").val());
  formData.append("description", $("#productDescription").val().trim());

  const imageFile = $("#productImageFile")[0].files[0];
  if (imageFile) {
    formData.append("productImage", imageFile);
  }

  if (!formData.get("title")) {
    showAdminMessage("Please enter a product name", "warning");
    $("#productTitle").focus();
    return;
  }

  if (!formData.get("price") || formData.get("price") <= 0) {
    showAdminMessage("Please enter a valid price", "warning");
    $("#productPrice").focus();
    return;
  }

  if (!formData.get("stock") || formData.get("stock") < 0) {
    showAdminMessage("Please enter a valid stock quantity", "warning");
    $("#productStock").focus();
    return;
  }

  if (!formData.get("category")) {
    showAdminMessage("Please select a category", "warning");
    $("#productCategory").focus();
    return;
  }

  if (!imageFile) {
    showAdminMessage("Please upload a product image", "warning");
    $("#productImageFile").focus();
    return;
  }

  if (imageFile.size > 5 * 1024 * 1024) {
    showAdminMessage("Image file size must be less than 5MB", "warning");
    return;
  }

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(imageFile.type)) {
    showAdminMessage(
      "Please upload a valid image file (JPEG, PNG, or WebP)",
      "warning"
    );
    return;
  }

  try {
    const submitBtn = $(this).find('button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn
      .prop("disabled", true)
      .html('<i class="fas fa-spinner fa-spin me-1"></i>Adding...');

    const response = await fetch("/admin/products", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const product = await response.json();
      showAdminMessage(
        `✅ Product "${product.title}" added successfully!`,
        "success"
      );
      $("#addProductForm")[0].reset();
      $("#productCurrency").val("BDT");
      loadProducts();
    } else {
      const error = await response.json();
      showAdminMessage("❌ Error: " + error.message, "danger");
    }
  } catch (error) {
    console.error("Add product error:", error);
    showAdminMessage("❌ Network error occurred", "danger");
  } finally {
    const submitBtn = $('#addProductForm button[type="submit"]');
    submitBtn
      .prop("disabled", false)
      .html('<i class="fas fa-plus me-1"></i>Add Product');
  }
});

$(document).on("click", ".update-btn", async function () {
  const productId = $(this).data("id");
  const price = parseFloat($(`.price-input[data-id="${productId}"]`).val());
  const stock = parseInt($(`.stock-input[data-id="${productId}"]`).val());

  if (isNaN(price) || price < 0) {
    showAdminMessage("Please enter a valid price", "warning");
    $(`.price-input[data-id="${productId}"]`).focus();
    return;
  }

  if (isNaN(stock) || stock < 0) {
    showAdminMessage("Please enter a valid stock quantity", "warning");
    $(`.stock-input[data-id="${productId}"]`).focus();
    return;
  }

  try {
    const updateBtn = $(this);
    const originalHtml = updateBtn.html();
    updateBtn
      .prop("disabled", true)
      .html('<i class="fas fa-spinner fa-spin"></i>');

    const response = await fetch(`/admin/products/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ price, stock }),
    });

    if (response.ok) {
      showAdminMessage("✅ Product updated successfully!", "success");
      loadProducts(); // Reload to get updated data
    } else {
      const error = await response.json();
      showAdminMessage("❌ Error: " + error.message, "danger");
    }
  } catch (error) {
    console.error("Update product error:", error);
    showAdminMessage("❌ Network error occurred", "danger");
  } finally {
    const updateBtn = $(`.update-btn[data-id="${productId}"]`);
    updateBtn.prop("disabled", false).html('<i class="fas fa-save"></i>');
  }
});

$(document).on("click", ".delete-btn", async function () {
  const productId = $(this).data("id");
  const productRow = $(this).closest("tr");
  const productName = productRow.find("strong").text();

  if (
    !confirm(
      `Are you sure you want to delete "${productName}"?\n\nThis action cannot be undone and will remove the product from the store.`
    )
  ) {
    return;
  }

  try {
    const deleteBtn = $(this);
    const originalHtml = deleteBtn.html();
    deleteBtn
      .prop("disabled", true)
      .html('<i class="fas fa-spinner fa-spin"></i>');

    const response = await fetch(`/admin/products/${productId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      showAdminMessage(
        `✅ Product "${productName}" deleted successfully!`,
        "success"
      );
      loadProducts();
    } else {
      const error = await response.json();
      showAdminMessage("❌ Error: " + error.message, "danger");
    }
  } catch (error) {
    console.error("Delete product error:", error);
    showAdminMessage("❌ Network error occurred", "danger");
  } finally {
    const deleteBtn = $(`.delete-btn[data-id="${productId}"]`);
    if (deleteBtn.length) {
      deleteBtn.prop("disabled", false).html('<i class="fas fa-trash"></i>');
    }
  }
});

$("#refreshProducts").on("click", function () {
  const refreshBtn = $(this);
  const originalHtml = refreshBtn.html();
  refreshBtn
    .prop("disabled", true)
    .html('<i class="fas fa-spinner fa-spin me-1"></i>Refreshing...');

  loadProducts();
  loadOrders();

  setTimeout(() => {
    refreshBtn.prop("disabled", false).html(originalHtml);
    showAdminMessage("📊 Data refreshed successfully!", "info");
  }, 1000);
});

$(document).on("keypress", ".price-input, .stock-input", function (e) {
  if (e.which === 13) {
    // Enter key
    $(this).closest("tr").find(".update-btn").click();
  }
});

$(document).on("blur", ".price-input, .stock-input", function () {
  const productId = $(this).data("id");
  const originalPrice = parseFloat(
    $(this).closest("tr").find(".price-input").data("original-value")
  );
  const originalStock = parseInt(
    $(this).closest("tr").find(".stock-input").data("original-value")
  );
  const currentPrice = parseFloat(
    $(this).closest("tr").find(".price-input").val()
  );
  const currentStock = parseInt(
    $(this).closest("tr").find(".stock-input").val()
  );

  if (currentPrice !== originalPrice || currentStock !== originalStock) {
    $(this).closest("tr").find(".update-btn").click();
  }
});

$(document).on("focus", ".price-input, .stock-input", function () {
  $(this).data("original-value", $(this).val());
});

function showAdminMessage(message, type) {
  $(".admin-message").remove();

  const messageDiv = $(`
        <div class="alert alert-${type} alert-dismissible fade show admin-message" role="alert">
            <div class="d-flex align-items-center">
                <div class="flex-grow-1">${message}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        </div>
    `);

  $(".admin-container").prepend(messageDiv);

  const autoRemoveTime = type === "success" || type === "info" ? 5000 : 8000;
  setTimeout(() => {
    if (messageDiv.is(":visible")) {
      messageDiv.alert("close");
    }
  }, autoRemoveTime);
}

socket.on("productUpdate", function () {
  showAdminMessage("🔄 Product inventory updated in real-time", "info");
  loadProducts();
});

$(document).ready(function () {
  console.log("Admin dashboard initialized");

  loadProducts();
  loadOrders();

  $("#productTitle").focus();

  setInterval(() => {
    loadProducts();
    loadOrders();
  }, 30000);

  console.log("💡 Admin Tips:");
  console.log("• Use Enter key to quickly update price/stock");
  console.log("• Changes auto-save when you click away from inputs");
  console.log("• Data refreshes automatically every 30 seconds");
  console.log("• Low stock items are highlighted in the table");
});
