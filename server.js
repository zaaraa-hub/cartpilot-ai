import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();

app.use(cors());
app.use(express.json());

// Load product catalog
const catalog = JSON.parse(
  fs.readFileSync("./catalog.json", "utf8")
);

// Extract budget from user message
function extractBudget(text) {
  const match =
    text.match(/under\s*₹?\s*(\d[\d,]*)/i) ||
    text.match(/below\s*₹?\s*(\d[\d,]*)/i) ||
    text.match(/₹\s*(\d[\d,]*)/);

  if (match) {
    return Number(match[1].replace(/,/g, ""));
  }

  return Infinity;
}

// Score products based on user intent
function scoreProduct(product, query, budget) {
  const words = query
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);

  let score = product.rating;

  words.forEach((word) => {
    if (product.category.toLowerCase().includes(word)) {
      score += 4;
    }

    if (product.tags.some((tag) => tag.includes(word))) {
      score += 3;
    }

    if (product.description.toLowerCase().includes(word)) {
      score += 1;
    }
  });

  // Product must fit budget
  if (product.price <= budget) {
    score += 5;
  } else {
    score -= 100;
  }

  return score;
}

// AI recommendation endpoint
app.post("/api/recommend", (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({
      error: "Please provide a product query"
    });
  }

  const budget = extractBudget(query);

  const recommendations = catalog
    .map((product) => ({
      ...product,
      score: scoreProduct(product, query, budget)
    }))
    .filter((product) => product.price <= budget)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  res.json({
    query,
    budget,
    recommendations
  });
});

// Get all products
app.get("/api/products", (req, res) => {
  res.json(catalog);
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`CartPilot AI running on http://localhost:${PORT}`);
});