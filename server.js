const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (_req, res) => {
  res.send("Server is running successfully");
});

// Bulk products route
app.get("/bulk-products", async (_req, res) => {
  try {
    const products = [
      {
        id: 1,
        name: "Wireless Earbuds",
        slug: "wireless-earbuds",
        category: "Audio",
        price: 1299,
        oldPrice: 2499,
        rating: 4.3,
        stock: true,
        brand: "SoundMax",
        description: "High quality wireless earbuds with deep bass and long battery backup.",
        images: [
          "https://m.media-amazon.com/images/I/61CGHv6kmWL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/61imYpK33qL._SX522_.jpg"
        ]
      },
      {
        id: 2,
        name: "Smart Watch",
        slug: "smart-watch",
        category: "Wearables",
        price: 1999,
        oldPrice: 3499,
        rating: 4.1,
        stock: true,
        brand: "TechFit",
        description: "Stylish smartwatch with heart rate monitor and sports modes.",
        images: [
          "https://m.media-amazon.com/images/I/61y2VVWcGBL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/71Swqqe7XAL._SX522_.jpg"
        ]
      },
      {
        id: 3,
        name: "Power Bank",
        slug: "power-bank",
        category: "Accessories",
        price: 999,
        oldPrice: 1799,
        rating: 4.2,
        stock: true,
        brand: "ChargeUp",
        description: "10000mAh fast charging power bank with dual USB output.",
        images: [
          "https://m.media-amazon.com/images/I/61X5Jd0G7qL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/71JQh7U7A-L._SX522_.jpg"
        ]
      },
      {
        id: 4,
        name: "Bluetooth Speaker",
        slug: "bluetooth-speaker",
        category: "Audio",
        price: 1499,
        oldPrice: 2999,
        rating: 4.4,
        stock: true,
        brand: "BoomX",
        description: "Portable bluetooth speaker with rich sound and waterproof design.",
        images: [
          "https://m.media-amazon.com/images/I/71lHx7E7n9L._SX522_.jpg",
          "https://m.media-amazon.com/images/I/81cG6lT1cUL._SX522_.jpg"
        ]
      },
      {
        id: 5,
        name: "Gaming Mouse",
        slug: "gaming-mouse",
        category: "Gaming",
        price: 799,
        oldPrice: 1499,
        rating: 4.0,
        stock: true,
        brand: "GamePro",
        description: "Ergonomic gaming mouse with RGB lighting and adjustable DPI.",
        images: [
          "https://m.media-amazon.com/images/I/61mpMH5TzkL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/71L8o2nH2fL._SX522_.jpg"
        ]
      },
      {
        id: 6,
        name: "Laptop Backpack",
        slug: "laptop-backpack",
        category: "Bags",
        price: 1199,
        oldPrice: 2199,
        rating: 4.5,
        stock: true,
        brand: "UrbanCarry",
        description: "Water resistant laptop backpack with multiple storage compartments.",
        images: [
          "https://m.media-amazon.com/images/I/81KEhB0WmIL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/71W8r6D8S0L._SX522_.jpg"
        ]
      },
      {
        id: 7,
        name: "Mobile Holder",
        slug: "mobile-holder",
        category: "Accessories",
        price: 299,
        oldPrice: 699,
        rating: 3.9,
        stock: true,
        brand: "HoldIt",
        description: "Adjustable mobile holder for desk and car usage.",
        images: [
          "https://m.media-amazon.com/images/I/61aQKkJ0aNL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/71P6hT9lYjL._SX522_.jpg"
        ]
      },
      {
        id: 8,
        name: "USB Cable",
        slug: "usb-cable",
        category: "Accessories",
        price: 199,
        oldPrice: 499,
        rating: 4.1,
        stock: true,
        brand: "FastLink",
        description: "Durable fast charging USB cable compatible with multiple devices.",
        images: [
          "https://m.media-amazon.com/images/I/61rJQx8GJLL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/71v8jFawK-L._SX522_.jpg"
        ]
      }
    ];

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error("Error in /bulk-products:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bulk products"
    });
  }
});

// Single product by slug
app.get("/product/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const products = [
      {
        id: 1,
        name: "Wireless Earbuds",
        slug: "wireless-earbuds",
        category: "Audio",
        price: 1299,
        oldPrice: 2499,
        rating: 4.3,
        stock: true,
        brand: "SoundMax",
        description: "High quality wireless earbuds with deep bass and long battery backup.",
        images: [
          "https://m.media-amazon.com/images/I/61CGHv6kmWL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/61imYpK33qL._SX522_.jpg"
        ]
      },
      {
        id: 2,
        name: "Smart Watch",
        slug: "smart-watch",
        category: "Wearables",
        price: 1999,
        oldPrice: 3499,
        rating: 4.1,
        stock: true,
        brand: "TechFit",
        description: "Stylish smartwatch with heart rate monitor and sports modes.",
        images: [
          "https://m.media-amazon.com/images/I/61y2VVWcGBL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/71Swqqe7XAL._SX522_.jpg"
        ]
      },
      {
        id: 3,
        name: "Power Bank",
        slug: "power-bank",
        category: "Accessories",
        price: 999,
        oldPrice: 1799,
        rating: 4.2,
        stock: true,
        brand: "ChargeUp",
        description: "10000mAh fast charging power bank with dual USB output.",
        images: [
          "https://m.media-amazon.com/images/I/61X5Jd0G7qL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/71JQh7U7A-L._SX522_.jpg"
        ]
      },
      {
        id: 4,
        name: "Bluetooth Speaker",
        slug: "bluetooth-speaker",
        category: "Audio",
        price: 1499,
        oldPrice: 2999,
        rating: 4.4,
        stock: true,
        brand: "BoomX",
        description: "Portable bluetooth speaker with rich sound and waterproof design.",
        images: [
          "https://m.media-amazon.com/images/I/71lHx7E7n9L._SX522_.jpg",
          "https://m.media-amazon.com/images/I/81cG6lT1cUL._SX522_.jpg"
        ]
      },
      {
        id: 5,
        name: "Gaming Mouse",
        slug: "gaming-mouse",
        category: "Gaming",
        price: 799,
        oldPrice: 1499,
        rating: 4.0,
        stock: true,
        brand: "GamePro",
        description: "Ergonomic gaming mouse with RGB lighting and adjustable DPI.",
        images: [
          "https://m.media-amazon.com/images/I/61mpMH5TzkL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/71L8o2nH2fL._SX522_.jpg"
        ]
      },
      {
        id: 6,
        name: "Laptop Backpack",
        slug: "laptop-backpack",
        category: "Bags",
        price: 1199,
        oldPrice: 2199,
        rating: 4.5,
        stock: true,
        brand: "UrbanCarry",
        description: "Water resistant laptop backpack with multiple storage compartments.",
        images: [
          "https://m.media-amazon.com/images/I/81KEhB0WmIL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/71W8r6D8S0L._SX522_.jpg"
        ]
      },
      {
        id: 7,
        name: "Mobile Holder",
        slug: "mobile-holder",
        category: "Accessories",
        price: 299,
        oldPrice: 699,
        rating: 3.9,
        stock: true,
        brand: "HoldIt",
        description: "Adjustable mobile holder for desk and car usage.",
        images: [
          "https://m.media-amazon.com/images/I/61aQKkJ0aNL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/71P6hT9lYjL._SX522_.jpg"
        ]
      },
      {
        id: 8,
        name: "USB Cable",
        slug: "usb-cable",
        category: "Accessories",
        price: 199,
        oldPrice: 499,
        rating: 4.1,
        stock: true,
        brand: "FastLink",
        description: "Durable fast charging USB cable compatible with multiple devices.",
        images: [
          "https://m.media-amazon.com/images/I/61rJQx8GJLL._SX522_.jpg",
          "https://m.media-amazon.com/images/I/71v8jFawK-L._SX522_.jpg"
        ]
      }
    ];

    const product = products.find((item) => item.slug === slug);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error("Error in /product/:slug:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product"
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
