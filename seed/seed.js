require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");

const sampleProducts = [
  {
    title: "Wireless Earbuds Pro",
    description: "Premium noise-cancelling wireless earbuds with 30hr battery",
    price: 8999,
    currency: "BDT",
    imageUrl:
      "https://images.unsplash.com/photo-1590658165737-15a047b8b5e3?w=400&h=300&fit=crop",
    stock: 25,
    category: "Audio",
  },
  {
    title: "Smart Fitness Band",
    description:
      "Advanced fitness tracker with heart rate and sleep monitoring",
    price: 3499,
    currency: "BDT",
    imageUrl:
      "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&h=300&fit=crop",
    stock: 30,
    category: "Wearables",
  },
  {
    title: "Mechanical Keyboard",
    description: "RGB mechanical gaming keyboard with blue switches",
    price: 5999,
    currency: "BDT",
    imageUrl:
      "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=300&fit=crop",
    stock: 15,
    category: "Gaming",
  },
  {
    title: "Portable Power Bank",
    description: "20000mAh fast charging power bank with PD support",
    price: 2499,
    currency: "BDT",
    imageUrl:
      "https://images.unsplash.com/photo-1609592810793-abeb6c64b5c6?w=400&h=300&fit=crop",
    stock: 40,
    category: "Accessories",
  },
  {
    title: "Bluetooth Speaker",
    description: "Waterproof portable speaker with 360° surround sound",
    price: 4599,
    currency: "BDT",
    imageUrl:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop",
    stock: 20,
    category: "Audio",
  },
  {
    title: "USB-C Hub Adapter",
    description: "7-in-1 USB-C hub with 4K HDMI, USB 3.0, and Ethernet",
    price: 3299,
    currency: "BDT",
    imageUrl:
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=300&fit=crop",
    stock: 35,
    category: "Accessories",
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME,
    });

    console.log("Connected to MongoDB");

    await Product.deleteMany({});
    console.log("Cleared existing products");

    await Product.insertMany(sampleProducts);
    console.log("6 tech gadgets added successfully!");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();
