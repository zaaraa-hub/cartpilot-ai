# 🛒 CartPilot AI

**CartPilot AI** is an AI-oriented shopping assistant and checkout agent designed for D2C e-commerce.

It helps shoppers reduce decision fatigue by understanding natural-language shopping requests, matching them against a product catalog, handling common purchase questions, and guiding users from product discovery to checkout.

🌐 **Live Demo:** https://cartpilot-ai.onrender.com/

---

## ✨ Features

### 🧠 Natural-Language Product Discovery

Users can describe what they want naturally instead of manually browsing a product catalog.

**Example:**

> "I want a black dress under ₹2,500 for a party"

CartPilot analyzes the request and matches it against the available product catalog using category, budget, color, occasion, tags, and product relevance.

The current recommendation system is **rule-based**, providing a foundation for future LLM-powered intent extraction.

---

### 🎯 Intelligent Product Matching

CartPilot filters and ranks products based on the user's requirements.

The recommendation engine can consider:

* Product category
* Budget
* Color
* Occasion
* Product tags
* Relevance

This helps prevent unrelated products from appearing when the user specifies a particular product type.

---

### 💬 Buyer Hesitation Handling

CartPilot can answer common purchase-related questions such as:

* 📏 Sizing and fit
* 🔄 Returns and exchanges
* 🚚 Shipping and delivery
* 💵 Cash on Delivery
* 🔐 Payment safety
* 💳 EMI and offers

The current version provides predefined responses for these common questions, while a future version can connect them to live merchant and payment data.

---

### 🛍️ Product Recommendations

Each recommendation can display:

* Product name
* Price
* Rating
* Description
* Key differentiators
* Add to Cart
* Buy Now

The recommendation flow is designed to keep the number of choices manageable and reduce decision fatigue.

---

### 🛒 Shopping Cart

CartPilot includes a persistent shopping cart using browser `localStorage`.

Users can:

* Add products to their cart
* Increase product quantity
* View their cart
* Continue directly to checkout
* Checkout multiple products together

The cart count is updated dynamically as products are added.

---

### ⚡ Checkout Flow

CartPilot provides a complete **demo checkout experience** from product selection to order confirmation.

The checkout flow includes:

1. Product/order summary
2. Shipping details
3. Country code selection
4. Phone number validation
5. Address and pincode
6. Product size selection where applicable
7. Payment method selection
8. Order confirmation

Available demo payment options:

* ⚡ 1-Click UPI
* 💵 Cash on Delivery

⚠️ **No real payments are processed.**

A production implementation would integrate an approved payment provider securely on the server.

---

## 🏗️ Tech Stack

* **Node.js** — backend runtime
* **Express.js** — web server and API
* **JavaScript** — recommendation logic and frontend behavior
* **HTML** — frontend structure
* **CSS** — styling
* **JSON** — product catalog
* **LocalStorage** — client-side cart persistence

---

## 📂 Project Structure

```text
cartpilot-ai/
│
├── public/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── checkout.html
│
├── catalog.json
├── recommend.js
├── recommend.test.js
├── server.js
├── package.json
├── package-lock.json
└── README.md
```

---

## 🔄 How CartPilot Works

```text
User's Shopping Request
          ↓
Natural-Language Query
          ↓
Recommendation Engine
          ↓
Category + Budget + Attributes
          ↓
Product Filtering & Ranking
          ↓
Product Recommendations
          ↓
Add to Cart / Buy Now
          ↓
Checkout
          ↓
Demo Order Confirmation
```

---

## 🧪 Recommendation Testing

The recommendation engine includes automated tests covering cases such as:

* Dress category matching
* Plural category matching
* Running shoe category matching
* Preventing unrelated products from appearing

Run the tests with:

```bash
node --test recommend.test.js
```

---

## 🚀 Future Development

CartPilot is designed to evolve from a rule-based shopping assistant into a more capable AI shopping agent.

Planned improvements include:

### 🤖 LLM-Powered Intent Extraction

Use an LLM to convert natural-language requests into structured shopping intent.

Example:

```text
"I need a black dress under ₹2,500 for a party"

                ↓

{
  category: "dresses",
  color: "black",
  budget: 2500,
  occasion: "party"
}
```

The structured intent can then be passed into the existing recommendation engine.

---

### 🌐 Live Product Data

Future versions could connect to merchant/product APIs to retrieve:

* Live product availability
* Current prices
* Product images
* Inventory
* Offers
* Delivery information

This would allow recommendations to use current catalog information instead of only the local demo catalog.

---

### 💳 Real Payment Integration

A production version could integrate a secure payment provider such as Razorpay for real checkout and payment processing.

---

## ⚠️ Project Status

CartPilot AI is currently a **working e-commerce prototype/demo**.

The recommendation engine currently uses rule-based matching rather than an LLM or machine-learning model.

The checkout flow is simulated and does not process real payments.

---

## 👩‍💻 Author

**Zaara Mulani**

Built as a project exploring AI-assisted e-commerce, product discovery, autonomous sales workflows, and checkout experiences.

---

## 🔗 Links

**Live Demo:**
https://cartpilot-ai.onrender.com/

**GitHub Repository:**
https://github.com/zaaraa-hub/cartpilot-ai

```

