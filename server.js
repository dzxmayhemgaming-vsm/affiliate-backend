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

// Test Route
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

// Temporary Delete All Products Route
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
        image: "https://via.placeholder.com/200?text=Earbuds",
        category: "Audio"
      },
      {
        name: "Smart Watch",
        price: 1999,
        link: "https://www.amazon.in/dp/B0TEST2?tag=mayhemstore-21",
        image: "https://via.placeholder.com/200?text=Smart+Watch",
        category: "Wearables"
      },
      {
        name: "Bluetooth Speaker",
        price: 1499,
        link: "https://www.amazon.in/dp/B0TEST3?tag=mayhemstore-21",
        image: "https://via.placeholder.com/200?text=Speaker",
        category: "Audio"
      },
      {
        name: "Power Bank",
        price: 999,
        link: "https://www.amazon.in/dp/B0TEST4?tag=mayhemstore-21",
        image: "https://via.placeholder.com/200?text=Power+Bank",
        category: "Accessories"
      }
    ];

    for (const p of products) {
      const exists = await Product.findOne({ name: p.name, link: p.link });
      if (!exists) {
        await Product.create(p);
      }
    }

    res.send("Products Added 🚀");
  } catch (err) {
    res.status(500).send("Error adding products");
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
