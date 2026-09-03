import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const catalog = JSON.parse(fs.readFileSync("./catalog.json", "utf8"));

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

function extractBudget(text) {
  const patterns = [
    /under\s*₹?\s*(\d[\d,]*)/i,
    /below\s*₹?\s*(\d[\d,]*)/i,
    /less than\s*₹?\s*(\d[\d,]*)/i,
    /within\s*₹?\s*(\d[\d,]*)/i,
    /budget.*?₹?\s*(\d[\d,]*)/i,
    /₹\s*(\d[\d,]*)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match) {
      return Number(match[1].replace(/,/g, ""));
    }
  }

  return Infinity;
}

function scoreProduct(product, text, budget) {
  const words = text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);

  let score = product.rating * 2;

  const searchableText = [
    product.name,
    product.category,
    product.description,
    ...product.tags
  ]
    .join(" ")
    .toLowerCase();

  for (const word of words) {

    if (searchableText.includes(word)) {
      score += 3;
    }

  }

  if (product.price <= budget) {
    score += 5;
  } else {
    score -= 100;
  }

  return score;
}

function recommend(query) {
  const budget = extractBudget(query);
  const matches = catalog
    .map(p => ({ ...p, score: scoreProduct(p, query, budget) }))
    .filter(p => p.price <= budget)
    .sort((a,b) => b.score - a.score)
    .slice(0, 2);

  return { budget, matches };
}

function answerDoubt(message) {
  const text = message.toLowerCase();

  if (/size|sizing|fit/.test(text)) {
    return "For sizing, choose your usual UK size. If you are between sizes, go one size up for a more comfortable fit. Easy returns are available in this demo.";
  }
  if (/return|exchange/.test(text)) {
    return "You can request an easy return or exchange within the merchant's stated return window. Always confirm the final policy before purchase.";
  }
  if (/cod|cash on delivery/.test(text)) {
    return "COD availability depends on the merchant and delivery PIN code. CartPilot can surface it at checkout when supported.";
  }
  if (/safe|security|payment/.test(text)) {
    return "Payment should be completed through the merchant's secure checkout. This demo does not collect or store card or UPI credentials.";
  }
  if (/shipping|delivery|when.*arrive/.test(text)) {
    return "Delivery time depends on the merchant and location. A production version would fetch live shipping estimates using the merchant's logistics data.";
  }
  if (/emi|offer|cashback|discount/.test(text)) {
    return "A production integration would query eligible Razorpay offers, bank cashbacks and EMI options in real time. This demo shows how the agent would surface them.";
  }

  return null;
}

app.post("/api/chat", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const doubt = answerDoubt(message);
  if (doubt) {
    return res.json({
      type: "answer",
      reply: doubt,
      cta: "Ready to order? Click below to complete checkout."
    });
  }

  const { budget, matches } = recommend(message);

  if (!matches.length) {
    return res.json({
      type: "answer",
      reply: `I couldn't find a close match${Number.isFinite(budget) ? ` under ${INR.format(budget)}` : ""}. Try changing your budget or product requirements.`
    });
  }

  return res.json({
    type: "recommendations",
    reply: "I found the top 2 matches for you:",
    products: matches.map(p => ({
      id: p.id,
      name: p.name,
      price: INR.format(p.price),
      rawPrice: p.price,
      rating: p.rating,
      description: p.description,
      differentiator: p.tags.slice(0, 3).join(" • ")
    })),
    offers: matches.some(p => p.price >= 2500)
      ? "Eligible orders may qualify for offers, cashback or EMI in a production payment integration."
      : "UPI and other checkout options can be shown at payment."
  });
});

app.post("/api/checkout", (req, res) => {
  const { productId } = req.body;
  const product = catalog.find(p => p.id === Number(productId));

  if (!product) return res.status(404).json({ error: "Product not found" });

  // Demo only. Replace with an authenticated server-side Razorpay/Magic Checkout flow.
  res.json({
    success: true,
    demo: true,
    product,
    checkoutUrl: `/checkout.html?productId=${product.id}`
  });
});

app.get("/api/product/:id", (req, res) => {
  const product = catalog.find(p => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`CartPilot AI running on http://localhost:${process.env.PORT || 3000}`);
});