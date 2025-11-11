console.log("Starfall site loaded successfully");

const button = document.getElementById("exploreBtn");
const message = document.getElementById("message");

if (button && message) {
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
}

// ===== Auth wiring =====
const emailInput = document.getElementById("authEmail");
const passwordInput = document.getElementById("authPassword");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authStatus = document.getElementById("authStatus");

// Guard in case elements don't exist yet
if (signupBtn && loginBtn && logoutBtn) {
  signupBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      authStatus.textContent = "Please enter email and password.";
      return;
    }

    authStatus.textContent = "Signing up...";
    const { error } = await signUpWithEmail(email, password);

    if (error) {
      authStatus.textContent = `Signup failed: ${error.message}`;
    } else {
      authStatus.textContent = "Signup successful. Check your email if confirmation is required.";
    }
  });

  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      authStatus.textContent = "Please enter email and password.";
      return;
    }

    authStatus.textContent = "Logging in...";
    const { error } = await signInWithEmail(email, password);

    if (error) {
      authStatus.textContent = `Login failed: ${error.message}`;
    } else {
      authStatus.textContent = "Logged in!";
    }
  });

  logoutBtn.addEventListener("click", async () => {
    authStatus.textContent = "Logging out...";
    await signOut();
    authStatus.textContent = "Logged out.";
  });
}
