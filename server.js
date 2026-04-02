# Mayhemstore Starter

## 1) `server.js`

```js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://USERNAME:PASSWORD@cluster0.mongodb.net/mayhemstore";
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const AMAZON_TAG = "mayhemstore-21";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err.message));

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    category: {
      type: String,
      enum: [
        "Audio",
        "Wearables",
        "Accessories",
        "Smartphones",
        "Electronics"
      ],
      default: "Electronics"
    },
    brand: { type: String, default: "Mayhemstore" },
    searchKeyword: { type: String, default: "" },
    link: { type: String, required: true },
    affiliateLink: { type: String, required: true },
    stockStatus: { type: String, default: "In Stock" }
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer" }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
const User = mongoose.model("User", userSchema);

function makeAffiliateLink(url) {
  if (!url) return "#";
  if (url.includes("tag=")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}tag=${AMAZON_TAG}`;
}

function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return res.status(401).json({ message: "Login required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

app.get("/", (req, res) => {
  res.send("Mayhemstore API Running 🚀");
});

app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, password are required" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash
    });

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password || "", user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed" });
  }
});

app.get("/auth/me", authRequired, async (req, res) => {
  const user = await User.findById(req.user.id).select("name email role");
  return res.json(user);
});

app.get("/products", async (req, res) => {
  try {
    const category = (req.query.category || "").trim();
    const q = (req.query.q || "").trim();

    const filter = {};
    if (category) filter.category = category;
    if (q) filter.name = { $regex: q, $options: "i" };

    const products = await Product.find(filter).sort({ category: 1, name: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to load products" });
  }
});

app.get("/products/categories", async (_req, res) => {
  res.json([
    "Audio",
    "Wearables",
    "Accessories",
    "Smartphones",
    "Electronics"
  ]);
});

app.post("/products", async (req, res) => {
  try {
    const { sku, name, price, image, category, brand, searchKeyword, link } = req.body;

    if (!sku || !name || !price || !link) {
      return res.status(400).json({ message: "sku, name, price and link are required" });
    }

    const exists = await Product.findOne({ sku });
    if (exists) {
      return res.status(409).json({ message: "Duplicate product sku" });
    }

    const product = await Product.create({
      sku,
      name,
      price,
      image,
      category: category || "Electronics",
      brand,
      searchKeyword,
      link,
      affiliateLink: makeAffiliateLink(link)
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to add product" });
  }
});

app.get("/seed-mayhemstore", async (_req, res) => {
  try {
    const baseProducts = [
      {
        sku: "AUD-001",
        name: "Mayhem Wireless Earbuds",
        price: 1299,
        image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80",
        category: "Audio",
        brand: "Mayhemstore",
        searchKeyword: "wireless earbuds",
        link: "https://www.amazon.in/s?k=wireless+earbuds"
      },
      {
        sku: "WAR-001",
        name: "Mayhem Smart Watch",
        price: 1999,
        image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80",
        category: "Wearables",
        brand: "Mayhemstore",
        searchKeyword: "smart watch",
        link: "https://www.amazon.in/s?k=smart+watch"
      },
      {
        sku: "ACC-001",
        name: "Mayhem Power Bank",
        price: 999,
        image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80",
        category: "Accessories",
        brand: "Mayhemstore",
        searchKeyword: "power bank",
        link: "https://www.amazon.in/s?k=power+bank"
      },
      {
        sku: "PHN-001",
        name: "Mayhem Smartphone X1",
        price: 14999,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80",
        category: "Smartphones",
        brand: "Mayhemstore",
        searchKeyword: "smartphone",
        link: "https://www.amazon.in/s?k=smartphone"
      },
      {
        sku: "ELC-001",
        name: "Mayhem Bluetooth Speaker",
        price: 1499,
        image: "https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=600&q=80",
        category: "Electronics",
        brand: "Mayhemstore",
        searchKeyword: "bluetooth speaker",
        link: "https://www.amazon.in/s?k=bluetooth+speaker"
      }
    ];

    let added = 0;

    for (const item of baseProducts) {
      const exists = await Product.findOne({ sku: item.sku });
      if (!exists) {
        await Product.create({
          ...item,
          affiliateLink: makeAffiliateLink(item.link)
        });
        added++;
      }
    }

    res.json({ message: "Mayhemstore seed complete", added });
  } catch (err) {
    res.status(500).json({ message: "Seed failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

## 2) `package.json`

```json
{
  "name": "mayhemstore-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^7.0.0"
  }
}
```

## 3) Frontend brand changes

* Site name: **Mayhemstore**
* Header text: `🔥 Mayhemstore`
* Products filter by category using query `?category=Smartphones` etc.

## 4) Simple logo SVG code

Save as `logo.svg`:

```svg
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#111111"/>
  <path d="M138 332L208 150H252L182 332H138Z" fill="#F59E0B"/>
  <path d="M260 332L330 150H374L304 332H260Z" fill="#F59E0B"/>
  <path d="M186 274H326V314H170L186 274Z" fill="white"/>
</svg>
```

## 5) Next steps

1. Replace backend `server.js`
2. Replace `package.json`
3. Run `npm install`
4. Deploy to Render
5. Open `/seed-mayhemstore`
6. Update frontend title/header to **Mayhemstore**

```
```
