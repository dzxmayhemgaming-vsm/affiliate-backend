const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

mongoose
  .connect(
    "mongodb+srv://DZXMAYHEMGAMING1997:Vikram%401997@cluster0.bsbxqjp.mongodb.net/affiliateDB"
  )
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err.message));

const ProductSchema = new mongoose.Schema(
  {
    sku: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    link: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    category: {
      type: String,
      enum: ["Audio", "Wearables", "Accessories", "Smartphones", "Electronics"],
      default: "Electronics"
    }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", ProductSchema);

function makeAffiliateLink(url) {
  if (!url) return "#";
  if (url.includes("tag=mayhemstore-21")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}tag=mayhemstore-21`;
}

function normalizeCategory(category) {
  const allowed = ["Audio", "Wearables", "Accessories", "Smartphones", "Electronics"];
  const found = allowed.find(
    (c) => c.toLowerCase() === String(category || "").trim().toLowerCase()
  );
  return found || "Electronics";
}

app.get("/", (_req, res) => {
  res.send("Backend Running 🚀");
});

app.get("/products/categories", (_req, res) => {
  res.json(["Audio", "Wearables", "Accessories", "Smartphones", "Electronics"]);
});

app.get("/products", async (req, res) => {
  try {
    const category = String(req.query.category || "").trim();
    const q = String(req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

    const filter = {};

    if (category) {
      filter.category = normalizeCategory(category);
    }

    if (q) {
      filter.name = { $regex: q, $options: "i" };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 }).limit(limit);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error loading products" });
  }
});

app.get("/delete-all", async (_req, res) => {
  try {
    await Product.deleteMany({});
    res.send("All Products Deleted ❌");
  } catch (err) {
    res.status(500).send("Error deleting products");
  }
});

app.get("/add-products", async (_req, res) => {
  try {
    const products = [
      {
        sku: "AUD-001",
        name: "Wireless Earbuds",
        price: 1299,
        link: makeAffiliateLink("https://www.amazon.in/s?k=wireless+earbuds"),
        image: "https://m.media-amazon.com/images/I/61CGHv6kmWL._SX522_.jpg",
        category: "Audio"
      },
      {
        sku: "WAR-001",
        name: "Smart Watch",
        price: 1999,
        link: makeAffiliateLink("https://www.amazon.in/s?k=smart+watch"),
        image: "https://m.media-amazon.com/images/I/61y2VVWcGBL._SX522_.jpg",
        category: "Wearables"
      },
      {
        sku: "ACC-001",
        name: "Power Bank",
        price: 999,
        link: makeAffiliateLink("https://www.amazon.in/s?k=power+bank"),
        image: "https://m.media-amazon.com/images/I/61X5Jd0G7qL._SX522_.jpg",
        category: "Accessories"
      },
      {
        sku: "PHN-001",
        name: "Smartphone X1",
        price: 14999,
        link: makeAffiliateLink("https://www.amazon.in/s?k=smartphone"),
        image: "https://m.media-amazon.com/images/I/71d7rfSl0wL._SX679_.jpg",
        category: "Smartphones"
      },
      {
        sku: "ELC-001",
        name: "Bluetooth Speaker",
        price: 1499,
        link: makeAffiliateLink("https://www.amazon.in/s?k=bluetooth+speaker"),
        image: "https://m.media-amazon.com/images/I/71lG7gC6PBL._SX522_.jpg",
        category: "Electronics"
      }
    ];

    let added = 0;

    for (const p of products) {
      const exists = await Product.findOne({ sku: p.sku });
      if (!exists) {
        await Product.create(p);
        added++;
      }
    }

    res.json({ message: "Products Added 🚀", added });
  } catch (err) {
    res.status(500).json({ message: "Error adding products" });
  }
});

app.get("/bulk-products", async (_req, res) => {
  try {
    const products = [];

    const categories = [
      {
        name: "Wireless Earbuds",
        category: "Audio",
        price: 1299,
        images: [
          "https://m.media-amazon.com/images/I/61CGHv6kmWL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/61imYpK33qL._SX522_.jpg"
        ]
      },
      {
        name: "Smart Watch",
        category: "Wearables",
        price: 1999,
        images: [
          "https://m.media-amazon.com/images/I/61y2VVWcGBL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/71Swqqe7XAL._SX522_.jpg"
        ]
      },
      {
        name: "Power Bank",
        category: "Accessories",
        price: 999,
        images: [
          "https://m.media-amazon.com/images/I/61X5Jd0G7qL._SX522_.jpg"
        ]
      },
      {
        name: "Bluetooth Speaker",
        category: "Electronics",
        price: 1499,
        images: [
          "https://m.media-amazon.com/images/I/71lG7gC6PBL._SX522_.jpg"
        ]
      },
      {
        name: "Smartphone",
        category: "Smartphones",
        price: 14999,
        images: [
          "https://m.media-amazon.com/images/I/71d7rfSl0wL._SX679_.jpg"
        ]
      }
    ];

    let count = 1;

    for (let i = 0; i < 200; i++) {
      for (const item of categories) {
        const sku = `SKU-${count}`;
        const exists = await Product.findOne({ sku });

        if (!exists) {
          products.push({
            sku,
            name: `${item.name} ${Math.floor(Math.random() * 999)}`,
            price: item.price + Math.floor(Math.random() * 500),
            link: makeAffiliateLink(`https://www.amazon.in/s?k=${encodeURIComponent(item.name)}`),
            image: item.images[Math.floor(Math.random() * item.images.length)],
            category: item.category
          });
        }

        count++;
      }
    }

    await Product.insertMany(products);

    res.json({ message: "Smart Products Added 🚀", total: products.length });
  } catch (err) {
    res.status(500).json({ message: "Error adding products" });
  }
});

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
