const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb+srv://DZXMAYHEMGAMING1997:Vikram%401997@cluster0.bsbxqjp.mongodb.net/affiliateDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  link: String,
  image: String,
  category: String
});

const Product = mongoose.model("Product", ProductSchema);

app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

app.get("/products", async (req, res) => {
  const data = await Product.find();
  res.json(data);
});

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
