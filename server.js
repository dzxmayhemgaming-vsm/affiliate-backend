const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb+srv://DZXMAYHEMGAMING1997:Vikram%401997@cluster0.bsbxqjp.mongodb.net/affiliateDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Product Schema
const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  link: String,
  image: String,
  category: String
});

const Product = mongoose.model("Product", ProductSchema);

// Home Route
app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

// Get All Products
app.get("/products", async (req, res) => {
  try {
    const data = await Product.find();
    res.json(data);
  } catch (err) {
    res.status(500).send("Error loading products");
  }
});

// Delete All Products
app.get("/delete-all", async (req, res) => {
  try {
    await Product.deleteMany({});
    res.send("All Products Deleted ❌");
  } catch (err) {
    res.status(500).send("Error deleting products");
  }
});

// Add Demo Products
app.get("/add-products", async (req, res) => {
  try {
    const products = [
      {
        name: "Wireless Earbuds",
        price: 1299,
        link: "https://www.amazon.in/dp/B0TEST1?tag=mayhemstore-21",
        image: "https://m.media-amazon.com/images/I/61CGHv6kmWL._SX522_.jpg",
        category: "Audio"
      },
      {
        name: "Smart Watch",
        price: 1999,
        link: "https://www.amazon.in/dp/B0TEST2?tag=mayhemstore-21",
        image: "https://m.media-amazon.com/images/I/61y2VVWcGBL._SX522_.jpg",
        category: "Wearables"
      },
      {
        name: "Bluetooth Speaker",
        price: 1499,
        link: "https://www.amazon.in/dp/B0TEST3?tag=mayhemstore-21",
        image: "https://m.media-amazon.com/images/I/71lG7gC6PBL._SX522_.jpg",
        category: "Audio"
      },
      {
        name: "Power Bank",
        price: 999,
        link: "https://www.amazon.in/dp/B0TEST4?tag=mayhemstore-21",
        image: "https://m.media-amazon.com/images/I/61X5Jd0G7qL._SX522_.jpg",
        category: "Accessories"
      }
    ];

    for (const p of products) {
      await Product.create(p);
    }

    res.send("Products Added 🚀");
  } catch (err) {
    res.status(500).send("Error adding products");
  }
});

// Add 1000 Bulk Products with Images
app.get("/bulk-products", async (req, res) => {
  try {
    const baseProducts = [
      {
        name: "Wireless Earbuds",
        price: 1299,
        image: "https://m.media-amazon.com/images/I/61CGHv6kmWL._SX522_.jpg",
        category: "Audio"
      },
      {
        name: "Smart Watch",
        price: 1999,
        image: "https://m.media-amazon.com/images/I/61y2VVWcGBL._SX522_.jpg",
        category: "Wearables"
      },
      {
        name: "Bluetooth Speaker",
        price: 1499,
        image: "https://m.media-amazon.com/images/I/71lG7gC6PBL._SX522_.jpg",
        category: "Audio"
      },
      {
        name: "Power Bank",
        price: 999,
        image: "https://m.media-amazon.com/images/I/61X5Jd0G7qL._SX522_.jpg",
        category: "Accessories"
      }
    ];

    let products = [];

    for (let i = 1; i <= 250; i++) {
      baseProducts.forEach((item) => {
        products.push({
          name: `${item.name} ${i}`,
          price: item.price,
          image: item.image,
          category: item.category,
          link: `https://www.amazon.in/s?k=${encodeURIComponent(item.name)}&tag=mayhemstore-21`
        });
      });
    }

    await Product.insertMany(products);

    res.send("1000 Products Added with Images 🚀");
  } catch (err) {
    res.status(500).send("Error adding bulk products");
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
