const express = require("express");
const Product = require("../models/Product");
const Order = require("../models/Order");

const router = express.Router();

// Get all products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
});

// Create new order
router.post("/orders", async (req, res) => {
  try {
    const { customerName, customerEmail, items } = req.body;

    if (!customerName || !customerEmail || !items || items.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let totalAmount = 0;
    const orderItems = [];

    // Calculate total and validate products
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res
          .status(400)
          .json({ message: `Product not found: ${item.productId}` });
      }

      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for ${product.title}` });
      }

      // Update product stock
      product.stock -= item.quantity;
      await product.save();

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
      });
    }

    // Create order
    const order = await Order.create({
      customerName,
      customerEmail,
      items: orderItems,
      totalAmount,
      status: "PLACED",
    });

    // Emit real-time events
    const io = req.app.get("io");
    io.emit("productUpdate");
    io.emit("newOrder", order);

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
});

// Get all orders
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
});

module.exports = router;
