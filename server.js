import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { extractBudget, matchingCategories, recommend as recommendProducts } from "./recommend.js";
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
function recommend(query) {
  return recommendProducts(query, catalog);
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
function isVagueQuery(text, budget) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length > 3) return false;
  if (Number.isFinite(budget)) return false;
  if (matchingCategories(text, catalog).length) return false;
  const lower = text.toLowerCase();
  const hasDescriptor = catalog.some((p) =>
    (p.color && lower.includes(p.color.toLowerCase())) ||
    (p.occasion && lower.includes(p.occasion.toLowerCase())) ||
    p.tags.some((tag) => tag.toLowerCase() !== p.category.toLowerCase() && lower.includes(tag.toLowerCase()))
  );
  return !hasDescriptor;
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
  const budget = extractBudget(message);
  if (isVagueQuery(message, budget)) {
    return res.json({
      type: "clarify",
      reply: `Got it — you're looking for ${message.trim()}. To find the best match, tell me a bit more: any preferred color, budget, or occasion (casual, party, sports)?`
    });
  }
  const { matches } = recommend(message);
  if (!matches.length) {
    return res.json({
      type: "answer",
      reply: `I couldn't find a close match${Number.isFinite(budget) ? ` under ${INR.format(budget)}` : ""}. Try changing your budget or product requirements.`
    });
  }
  return res.json({
    type: "recommendations",
    reply: matches.length === 1
      ? "I found a match for you:"
      : `I found ${matches.length} matches for you:`,
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
app.post("/api/checkout-cart", (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }
  const resolved = items.map((item) => {
    const product = catalog.find(p => p.id === Number(item.productId));
    const qty = Math.max(1, Number(item.qty) || 1);
    return product ? { ...product, qty, lineTotal: product.price * qty } : null;
  }).filter(Boolean);
  if (!resolved.length) {
    return res.status(404).json({ error: "No valid products found in cart" });
  }
  const total = resolved.reduce((sum, p) => sum + p.lineTotal, 0);
  // Demo only. Replace with an authenticated server-side Razorpay/Magic Checkout flow.
  res.json({
    success: true,
    demo: true,
    items: resolved,
    total,
    totalFormatted: INR.format(total)
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