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

// Test API
app.get("/", (req, res) => {
  res.json({
    message: "CartPilot AI API is running 🚀"
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