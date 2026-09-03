const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatMessages = document.getElementById("chatMessages");

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

  let html = `<p>${data.reply}</p>`;

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

          <button
            class="buy-button"
            onclick="startCheckout(${product.id})"
          >
            Choose this
          </button>

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