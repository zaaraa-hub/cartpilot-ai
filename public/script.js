const chatForm = document.getElementById("chatForm");

const userInput = document.getElementById("userInput");

const chatMessages =
  document.getElementById("chatMessages");


chatForm.addEventListener("submit", (event) => {

  event.preventDefault();

  const message = userInput.value.trim();


  if (!message) {

    return;

  }


  const userMessage =
    document.createElement("div");


  userMessage.classList.add(
    "message",
    "user"
  );


  userMessage.textContent = message;


  chatMessages.appendChild(
    userMessage
  );


  userInput.value = "";


  chatMessages.scrollTop =
    chatMessages.scrollHeight;

});