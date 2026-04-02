const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
const https = require("https");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb+srv://DZXMAYHEMGAMING1997:Vikram%401997@cluster0.bsbxqjp.mongodb.net/affiliateDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const ProductSchema = new mongoose.Schema({
  name: String,
  price: String,
  link: String,
  image: String,
  category: String,
  asin: String
});

const Product = mongoose.model("Product", ProductSchema);

app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

app.get("/products", async (req, res) => {
  try {
    const data = await Product.find();
    res.json(data);
  } catch (err) {
    res.status(500).send("Error loading products");
  }
});

const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY;
const AMAZON_SECRET_KEY = process.env.AMAZON_SECRET_KEY;
const AMAZON_PARTNER_TAG = process.env.AMAZON_PARTNER_TAG || "mayhemstore-21";

const AMAZON_HOST = "webservices.amazon.in";
const AMAZON_REGION = "eu-west-1";
const AMAZON_URI = "/paapi5/searchitems";
const AMAZON_TARGET = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";

function sha256(data) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function hmac(key, data, encoding) {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest(encoding);
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = hmac("AWS4" + key, dateStamp);
  const kRegion = hmac(kDate, regionName);
  const kService = hmac(kRegion, serviceName);
  return hmac(kService, "aws4_request");
}

function detectCategory(title = "") {
  const t = title.toLowerCase();
  if (t.includes("earbud") || t.includes("speaker") || t.includes("headphone")) return "Audio";
  if (t.includes("watch")) return "Wearables";
  if (t.includes("power bank") || t.includes("charger")) return "Accessories";
  if (t.includes("phone") || t.includes("mobile")) return "Mobiles";
  return "Electronics";
}

async function amazonSearch(keyword = "earbuds") {
  if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY || !AMAZON_PARTNER_TAG) {
    throw new Error("Amazon API credentials missing");
  }

  const payloadObj = {
    Keywords: keyword,
    SearchIndex: "All",
    ItemCount: 10,
    PartnerTag: AMAZON_PARTNER_TAG,
    PartnerType: "Associates",
    Marketplace: "www.amazon.in",
    Resources: [
      "Images.Primary.Medium",
      "ItemInfo.Title",
      "Offers.Listings.Price"
    ]
  };

  const payload = JSON.stringify(payloadObj);

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.substring(0, 8);

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${AMAZON_HOST}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${AMAZON_TARGET}\n`;

  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
  const payloadHash = sha256(payload);

  const canonicalRequest =
    `POST\n${AMAZON_URI}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${AMAZON_REGION}/ProductAdvertisingAPI/aws4_request`;
  const stringToSign =
    `${algorithm}\n${amzDate}\n${credentialScope}\n${sha256(canonicalRequest)}`;

  const signingKey = getSignatureKey(
    AMAZON_SECRET_KEY,
    dateStamp,
    AMAZON_REGION,
    "ProductAdvertisingAPI"
  );

  const signature = hmac(signingKey, stringToSign, "hex");

  const authorizationHeader =
    `${algorithm} Credential=${AMAZON_ACCESS_KEY}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const options = {
    hostname: AMAZON_HOST,
    path: AMAZON_URI,
    method: "POST",
    headers: {
      "Content-Encoding": "amz-1.0",
      "Content-Type": "application/json; charset=utf-8",
      "Host": AMAZON_HOST,
      "X-Amz-Date": amzDate,
      "X-Amz-Target": AMAZON_TARGET,
      "Authorization": authorizationHeader,
      "Content-Length": Buffer.byteLength(payload)
    }
  };

  const apiResponse = await new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let data = "";
      response.on("data", chunk => data += chunk);
      response.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("Invalid Amazon response"));
        }
      });
    });

    request.on("error", reject);
    request.write(payload);
    request.end();
  });

  return (apiResponse.SearchResult?.Items || []).map(item => ({
    asin: item.ASIN,
    name: item.ItemInfo?.Title?.DisplayValue || "No title",
    price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount || "N/A",
    image: item.Images?.Primary?.Medium?.URL || "",
    link: item.DetailPageURL || "#",
    category: detectCategory(item.ItemInfo?.Title?.DisplayValue || "")
  }));
}

app.get("/amazon-search", async (req, res) => {
  try {
    const keyword = (req.query.q || "earbuds").trim();
    const items = await amazonSearch(keyword);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/import-amazon", async (req, res) => {
  try {
    const keyword = (req.query.q || "earbuds").trim();
    const items = await amazonSearch(keyword);

    let added = 0;

    for (const item of items) {
      const exists = await Product.findOne({ asin: item.asin });
      if (!exists) {
        await Product.create(item);
        added++;
      }
    }

    res.json({ message: "Amazon products imported", added });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
