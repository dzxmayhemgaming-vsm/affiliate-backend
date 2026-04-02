const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 MongoDB Connection
mongoose.connect("mongodb+srv://DZXMAYHEMGAMING1997:Vikram%401997@cluster0.bsbxqjp.mongodb.net/affiliateDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// 🔥 Schema
const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  link: String
});

const Product = mongoose.model("Product", ProductSchema);

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

// ✅ Get Products
app.get("/products", async (req, res) => {
  const data = await Product.find();
  res.json(data);
});

// ✅ Add Demo Products
app.get("/add-products", async (req, res) => {
  try {
    const products = [
      {
        name: "Wireless Earbuds",
        price: 1299,
        link: "https://www.amazon.in/dp/B0TEST1?tag=mayhemstore-21"
      },
      {
        name: "Smart Watch",
        price: 1999,
        link: "https://www.amazon.in/dp/B0TEST2?tag=mayhemstore-21"
      },
      {
        name: "Bluetooth Speaker",
        price: 1499,
        link: "https://www.amazon.in/dp/B0TEST3?tag=mayhemstore-21"
      },
      {
        name: "Power Bank",
        price: 999,
        link: "https://www.amazon.in/dp/B0TEST4?tag=mayhemstore-21"
      }
    ];

    await Product.insertMany(products);
    res.send("Products Added 🚀");
  } catch (err) {
    res.send("Error adding products");
  }
});

// ✅ Server Start (LAST)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
