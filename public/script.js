const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatMessages = document.getElementById("chatMessages");

const CART_KEY = "cartpilot_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById("cartCount");
  if (badge) badge.textContent = count;
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.rawPrice,
      priceFormatted: product.price,
      qty: 1
    });
  }

  saveCart(cart);
  renderCart();
}

function removeFromCart(id) {
  const cart = getCart().filter((item) => item.id !== id);
  saveCart(cart);
  renderCart();
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    return removeFromCart(id);
  }

  saveCart(cart);
  renderCart();
}

function openCart() {
  renderCart();
  document.getElementById("cartOverlay").classList.add("open");
}

function closeCart() {
  document.getElementById("cartOverlay").classList.remove("open");
}

function closeCartOnOverlay(event) {
  if (event.target.id === "cartOverlay") closeCart();
}

function renderCart() {
  const cart = getCart();
  const itemsEl = document.getElementById("cartItems");
  const footerEl = document.getElementById("cartFooter");

  if (!cart.length) {
    itemsEl.innerHTML = `<p class="cart-empty">Your cart is empty. Ask CartPilot to find something!</p>`;
    footerEl.innerHTML = "";
    return;
  }

  itemsEl.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">${item.priceFormatted}</p>
      </div>
      <div class="cart-item-controls">
        <button onclick="changeQty(${item.id}, -1)">−</button>
        <span>${item.qty}</span>
        <button onclick="changeQty(${item.id}, 1)">+</button>
        <button class="cart-remove" onclick="removeFromCart(${item.id})">🗑️</button>
      </div>
    </div>
  `).join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalFormatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(total);

  footerEl.innerHTML = `
    <div class="cart-total">
      <span>Total</span>
      <span>${totalFormatted}</span>
    </div>
    <button class="checkout-button" onclick="checkoutCart()">
      Proceed to Checkout
    </button>
  `;
}

function checkoutCart() {
  const cart = getCart();
  if (!cart.length) return;
  window.location.href = "/checkout.html?cart=1";
}

updateCartBadge();

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = userInput.value.trim();

  if (!message) return;

  // Show user's message
  addMessage(message, "user");

  userInput.value = "";

  // Show temporary thinking message
  const thinkingMessage = document.createElement("div");

  thinkingMessage.classList.add("message", "bot");

  thinkingMessage.textContent = "CartPilot is thinking...";

  chatMessages.appendChild(thinkingMessage);

  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: message
      })
    });

    const data = await response.json();

    // Remove thinking message
    thinkingMessage.remove();

    displayResponse(data);

  } catch (error) {

    thinkingMessage.remove();

    addMessage(
      "Something went wrong. Please try again.",
      "bot"
    );

    console.error(error);
  }
});


function displayResponse(data) {

  let html = `
  <p>${data.reply}</p>
  <small>✨ Showing the closest matches to what you asked for.</small>
`;

  // If CartPilot recommends products
  if (data.products) {

    html += `<div class="products">`;

    data.products.forEach((product) => {

      html += `
        <div class="product-card">

          <h3>${product.name}</h3>

          <p>${product.description}</p>

          <p>
            💰 <b>${product.price}</b>
          </p>

          <p>
            ⭐ ${product.rating}
          </p>

          <p class="tags">
            ${product.differentiator}
          </p>

          <div class="product-actions">
            <button
              class="cart-add-button"
              onclick='addToCart(${JSON.stringify(product)})'
            >
              🛒 Add to Cart
            </button>

            <button
              class="buy-button"
              onclick="startCheckout(${product.id})"
            >
              ⚡ Buy Now
            </button>
          </div>

        </div>
      `;

    });

    html += `</div>`;
  }

  // Show offers
  if (data.offers) {

    html += `
      <div class="offer">
        ✨ ${data.offers}
      </div>
    `;
  }

  // Show checkout CTA
  if (data.cta) {

    html += `
      <div class="checkout-cta">
        ${data.cta}
      </div>
    `;
  }

  addMessage(html, "bot", true);
}


function addMessage(message, type, isHTML = false) {

  const messageElement =
    document.createElement("div");

  messageElement.classList.add(
    "message",
    type
  );

  if (isHTML) {
    messageElement.innerHTML = message;
  } else {
    messageElement.textContent = message;
  }

  chatMessages.appendChild(
    messageElement
  );

  chatMessages.scrollTop =
    chatMessages.scrollHeight;
}


// Start checkout
async function startCheckout(productId) {

  try {

    const response =
      await fetch("/api/checkout", {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          productId: productId
        })

      });


    const data =
      await response.json();


    if (data.success) {

      window.location.href =
        data.checkoutUrl;

    }

  } catch (error) {

    console.error(error);

    alert(
      "Unable to start checkout."
    );

  }

}