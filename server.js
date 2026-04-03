const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// =========================
// CONFIG
// =========================
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://DZXMAYHEMGAMING1997:Vikram%401997@cluster0.bsbxqjp.mongodb.net/mayhemstore";
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const AMAZON_TAG = "mayhemstore-21";

const ALLOWED_CATEGORIES = [
  "Audio",
  "Wearables",
  "Accessories",
  "Smartphones",
  "Electronics"
];

// =========================
// MIDDLEWARE
// =========================
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// =========================
// DATABASE
// =========================
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err.message));

// =========================
// SCHEMAS
// =========================
const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    category: {
      type: String,
      enum: ALLOWED_CATEGORIES,
      default: "Electronics"
    },
    brand: { type: String, default: "Mayhemstore" },
    description: { type: String, default: "" },
    searchKeyword: { type: String, default: "" },
    link: { type: String, required: true, trim: true },
    affiliateLink: { type: String, required: true, trim: true },
    stockStatus: {
      type: String,
      enum: ["In Stock", "Out of Stock"],
      default: "In Stock"
    }
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      trim: true
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer"
    }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
const User = mongoose.model("User", userSchema);

// =========================
// HELPERS
// =========================
function makeAffiliateLink(url) {
  if (!url) return "#";
  if (url.includes("tag=")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}tag=${AMAZON_TAG}`;
}

function normalizeCategory(category) {
  if (!category) return "Electronics";
  const found = ALLOWED_CATEGORIES.find(
    (c) => c.toLowerCase() === String(category).trim().toLowerCase()
  );
  return found || "Electronics";
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
  } catch (_err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function adminRequired(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// =========================
// ROOT
// =========================
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    app: "Mayhemstore API",
    message: "Mayhemstore backend running 🚀"
  });
});

// =========================
// AUTH
// =========================
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
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
  } catch (_err) {
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

    const validPassword = await bcrypt.compare(password || "", user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      },
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
  } catch (_err) {
    return res.status(500).json({ message: "Login failed" });
  }
});

app.get("/auth/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  } catch (_err) {
    return res.status(500).json({ message: "Failed to load profile" });
  }
});

// =========================
// CATEGORY + SEARCH APIs
// =========================
app.get("/products/categories", (_req, res) => {
  res.json(ALLOWED_CATEGORIES);
});

app.get("/products", async (req, res) => {
  try {
    const category = (req.query.category || "").trim();
    const q = (req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const filter = {};

    if (category) {
      filter.category = normalizeCategory(category);
    }

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { brand: { $regex: q, $options: "i" } },
        { searchKeyword: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1, name: 1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter)
    ]);

    return res.json({
      total,
      page,
      limit,
      products
    });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to load products" });
  }
});

app.get("/products/:sku", async (req, res) => {
  try {
    const product = await Product.findOne({ sku: req.params.sku });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json(product);
  } catch (_err) {
    return res.status(500).json({ message: "Failed to load product" });
  }
});

// =========================
// ADMIN PRODUCT MANAGEMENT
// =========================
app.post("/products", authRequired, adminRequired, async (req, res) => {
  try {
    const {
      sku,
      name,
      price,
      image,
      category,
      brand,
      description,
      searchKeyword,
      link,
      stockStatus
    } = req.body;

    if (!sku || !name || price === undefined || !link) {
      return res
        .status(400)
        .json({ message: "sku, name, price and link are required" });
    }

    const existingProduct = await Product.findOne({ sku: String(sku).trim() });
    if (existingProduct) {
      return res.status(409).json({ message: "Duplicate product sku" });
    }

    const product = await Product.create({
      sku: String(sku).trim(),
      name: String(name).trim(),
      price: Number(price),
      image: image || "",
      category: normalizeCategory(category),
      brand: brand || "Mayhemstore",
      description: description || "",
      searchKeyword: searchKeyword || "",
      link: String(link).trim(),
      affiliateLink: makeAffiliateLink(String(link).trim()),
      stockStatus: stockStatus || "In Stock"
    });

    return res.status(201).json(product);
  } catch (_err) {
    return res.status(500).json({ message: "Failed to add product" });
  }
});

app.put("/products/:sku", authRequired, adminRequired, async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.category) {
      updates.category = normalizeCategory(updates.category);
    }

    if (updates.link) {
      updates.affiliateLink = makeAffiliateLink(updates.link);
    }

    const product = await Product.findOneAndUpdate(
      { sku: req.params.sku },
      updates,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (_err) {
    return res.status(500).json({ message: "Failed to update product" });
  }
});

app.delete("/products/:sku", authRequired, adminRequired, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ sku: req.params.sku });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ message: "Product deleted successfully" });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to delete product" });
  }
});

// =========================
// RESET + SEED
// =========================
app.get("/delete-all", authRequired, adminRequired, async (_req, res) => {
  try {
    await Product.deleteMany({});
    return res.json({ message: "All products deleted" });
  } catch (_err) {
    return res.status(500).json({ message: "Error deleting products" });
  }
});

app.get("/seed-mayhemstore", async (_req, res) => {
  try {
    const baseProducts = [
      {
        sku: "AUD-001",
        name: "Mayhem Wireless Earbuds",
        price: 1299,
        image:
          "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80",
        category: "Audio",
        brand: "Mayhemstore",
        description: "Wireless audio buds with clear sound and deep bass.",
        searchKeyword: "wireless earbuds",
        link: "https://www.amazon.in/s?k=wireless+earbuds"
      },
      {
        sku: "WAR-001",
        name: "Mayhem Smart Watch",
        price: 1999,
        image:
          "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80",
        category: "Wearables",
        brand: "Mayhemstore",
        description: "Smart watch with fitness tracking and stylish design.",
        searchKeyword: "smart watch",
        link: "https://www.amazon.in/s?k=smart+watch"
      },
      {
        sku: "ACC-001",
        name: "Mayhem Power Bank",
        price: 999,
        image:
          "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80",
        category: "Accessories",
        brand: "Mayhemstore",
        description: "Compact power bank for daily fast charging use.",
        searchKeyword: "power bank",
        link: "https://www.amazon.in/s?k=power+bank"
      },
      {
        sku: "PHN-001",
        name: "Mayhem Smartphone X1",
        price: 14999,
        image:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80",
        category: "Smartphones",
        brand: "Mayhemstore",
        description: "Powerful smartphone with great battery and camera.",
        searchKeyword: "smartphone",
        link: "https://www.amazon.in/s?k=smartphone"
      },
      {
        sku: "ELC-001",
        name: "Mayhem Bluetooth Speaker",
        price: 1499,
        image:
          "https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=600&q=80",
        category: "Electronics",
        brand: "Mayhemstore",
        description: "Portable speaker with rich sound and modern design.",
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

    return res.json({ message: "Mayhemstore seed complete", added });
  } catch (_err) {
    return res.status(500).json({ message: "Seed failed" });
  }
});

app.get("/bulk-products", async (_req, res) => {
  try {
    const baseProducts = [
      {
        name: "Wireless Earbuds",
        price: 1299,
        image:
          "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80",
        category: "Audio"
      },
      {
        name: "Smart Watch",
        price: 1999,
        image:
          "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80",
        category: "Wearables"
      },
      {
        name: "Power Bank",
        price: 999,
        image:
          "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80",
        category: "Accessories"
      },
      {
        name: "Smartphone",
        price: 14999,
        image:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80",
        category: "Smartphones"
      },
      {
        name: "Bluetooth Speaker",
        price: 1499,
        image:
          "https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=600&q=80",
        category: "Electronics"
      }
    ];

    let added = 0;

    for (let i = 1; i <= 200; i++) {
      for (const item of baseProducts) {
        const sku = `${item.category.slice(0, 3).toUpperCase()}-${String(i).padStart(3, "0")}-${item.name
          .replace(/\s+/g, "-")
          .toUpperCase()}`;

        const exists = await Product.findOne({ sku });
        if (!exists) {
          const link = `https://www.amazon.in/s?k=${encodeURIComponent(
            item.name
          )}`;

          await Product.create({
            sku,
            name: `${item.name} ${i}`,
            price: item.price,
            image: item.image,
            category: item.category,
            brand: "Mayhemstore",
            description: `${item.name} ${i} by Mayhemstore`,
            searchKeyword: item.name,
            link,
            affiliateLink: makeAffiliateLink(link)
          });

          added++;
        }
      }
    }

    return res.json({ message: "Bulk products added", added });
  } catch (_err) {
    return res.status(500).json({ message: "Bulk import failed" });
  }
});

// =========================
// 404
// =========================
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// =========================
// SERVER
// =========================
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
