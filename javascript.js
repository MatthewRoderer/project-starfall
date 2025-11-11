// Starfall proof of concept script
console.log("Starfall site loaded successfully");

const button = document.getElementById("exploreBtn");
const message = document.getElementById("message");

button.addEventListener("click", () => {
  const quotes = [
    "You feel the pull of the stars...",
    "A meteor streaks across the twilight sky.",
    "You hear whispers of forgotten gods in the dark.",
    "Somewhere, destiny stirs.",
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  message.textContent = randomQuote;
});
