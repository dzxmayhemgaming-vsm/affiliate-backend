const express = require("express");
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
