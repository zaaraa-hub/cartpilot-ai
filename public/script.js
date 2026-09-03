const chatForm = document.getElementById("chatForm");

const userInput = document.getElementById("userInput");

const chatMessages =
  document.getElementById("chatMessages");


chatForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const message = userInput.value.trim();


  if (!message) {
    return;
  }


  // Display user message
  const userMessage =
    document.createElement("div");

  userMessage.classList.add(
    "message",
    "user"
  );

  userMessage.textContent = message;

  chatMessages.appendChild(userMessage);


  userInput.value = "";


  // Send query to backend
  try {

    const response = await fetch(
      "/api/recommend",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          query: message
        })
      }
    );


    const data =
      await response.json();


    displayRecommendations(data);


  } catch (error) {

    console.error(error);

    addBotMessage(
      "Something went wrong. Please try again."
    );

  }

});


function displayRecommendations(data) {

  if (
    !data.recommendations ||
    data.recommendations.length === 0
  ) {

    addBotMessage(
      "Sorry, I couldn't find matching products."
    );

    return;

  }


  let message =
    "🔥 Here are my top recommendations:<br><br>";


  data.recommendations.forEach(
    (product, index) => {

      message +=
        `<b>${index + 1}. ${product.name}</b><br>

        💰 ₹${product.price}<br>

        ⭐ Rating: ${product.rating}<br>

        🏷️ ${product.description}<br><br>`;

    }
  );


  addBotMessage(message);

}


function addBotMessage(message) {

  const botMessage =
    document.createElement("div");

  botMessage.classList.add(
    "message",
    "bot"
  );

  botMessage.innerHTML = message;

  chatMessages.appendChild(
    botMessage
  );


  chatMessages.scrollTop =
    chatMessages.scrollHeight;

}