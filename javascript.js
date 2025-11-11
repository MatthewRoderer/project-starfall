console.log("Starfall site loaded successfully");

// ===== Flavor text button =====
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

// ===== Global auth state =====
let currentUser = null;
let currentProfile = null;
let isAdmin = false;

// Update UI based on auth state (show/hide DM form, status text)
function updateUIForAuthState() {
  const articlesStatus = document.getElementById("articlesStatus");
  const articleFormWrapper = document.getElementById("articleFormWrapper");

  if (!articlesStatus || !articleFormWrapper) return;

  if (!currentUser) {
    articlesStatus.textContent =
      "You can still see public articles. Log in as DM to create or see private ones.";
    articleFormWrapper.style.display = "none";
  } else if (isAdmin) {
    articlesStatus.textContent =
      "Logged in as DM – you can create and manage all articles.";
    articleFormWrapper.style.display = "block";
  } else {
    articlesStatus.textContent =
      "Logged in – you can see public and any articles shared with you.";
    articleFormWrapper.style.display = "none";
  }
}

// Fetch current user + profile from Supabase
async function refreshAuthState() {
  if (typeof supabaseClient === "undefined") {
    console.error("supabaseClient is not defined. Check auth.js.");
    return;
  }

  const { data, error } = await supabaseClient.auth.getUser();

  if (error) {
    console.error("getUser error:", error);
    currentUser = null;
    currentProfile = null;
    isAdmin = false;
    updateUIForAuthState();
    return;
  }

  currentUser = data?.user ?? null;

  if (!currentUser) {
    currentProfile = null;
    isAdmin = false;
    updateUIForAuthState();
    return;
  }

  // Load profile to see if user is admin
  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle?.() ?? {};

  // Fallback if maybeSingle is not available in this environment
  if (!profile && !profileError) {
    // Try again with .single()
    const { data: profile2, error: profileError2 } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();
    currentProfile = profile2 ?? null;
    if (profileError2) console.error("Profile error:", profileError2);
  } else {
    currentProfile = profile ?? null;
    if (profileError) console.error("Profile error:", profileError);
  }

  isAdmin = currentProfile?.role === "admin";
  updateUIForAuthState();
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

    try {
      const { error } = await signUpWithEmail(email, password);

      if (error) {
        authStatus.textContent = `Signup failed: ${error.message}`;
      } else {
        authStatus.textContent =
          "Signup successful. Check your email if confirmation is required.";
        await refreshAuthState();
        await loadArticles();
      }
    } catch (err) {
      console.error("Unexpected signup error:", err);
      authStatus.textContent = `Unexpected signup error: ${err.message}`;
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

    try {
      const { error } = await signInWithEmail(email, password);

      if (error) {
        authStatus.textContent = `Login failed: ${error.message}`;
      } else {
        authStatus.textContent = "Logged in!";
        await refreshAuthState();
        await loadArticles();
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      authStatus.textContent = `Unexpected login error: ${err.message}`;
    }
  });

  logoutBtn.addEventListener("click", async () => {
    authStatus.textContent = "Logging out...";
    try {
      await signOut();
      authStatus.textContent = "Logged out.";
      currentUser = null;
      currentProfile = null;
      isAdmin = false;
      updateUIForAuthState();
      await loadArticles();
    } catch (err) {
      console.error("Unexpected logout error:", err);
      authStatus.textContent = `Unexpected logout error: ${err.message}`;
    }
  });
}

// ===== Articles: fetch + render =====
async function loadArticles() {
  const listEl = document.getElementById("articlesList");
  const statusEl = document.getElementById("articlesStatus");
  if (!listEl) return;

  if (statusEl) {
    statusEl.textContent =
      statusEl.textContent || "Loading articles...";
  }

  if (typeof supabaseClient === "undefined") {
    console.error("supabaseClient is not defined. Check auth.js.");
    if (statusEl) statusEl.textContent = "Error: supabaseClient not found.";
    return;
  }

  const { data, error } = await supabaseClient
    .from("articles")
    .select("id,title,slug,type,content,is_public,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading articles:", error);
    if (statusEl) statusEl.textContent =
      "Error loading articles: " + error.message;
    return;
  }

  listEl.innerHTML = "";

  if (!data || data.length === 0) {
    if (statusEl) statusEl.textContent = "No articles yet.";
    return;
  }

  if (statusEl && statusEl.textContent.startsWith("Loading")) {
    statusEl.textContent = "";
  }

  data.forEach((article) => {
    const card = document.createElement("div");
    card.className = "article-card";

    const titleEl = document.createElement("h3");
    titleEl.textContent = article.title;

    const metaEl = document.createElement("div");
    metaEl.className = "article-meta";
    const visibility = article.is_public ? "public" : "private";
    metaEl.textContent = `${article.type} • slug: ${article.slug} • ${visibility}`;

    const contentEl = document.createElement("div");
    contentEl.className = "article-content";
    contentEl.textContent = article.content || "(no description yet)";

    card.appendChild(titleEl);
    card.appendChild(metaEl);
    card.appendChild(contentEl);

    listEl.appendChild(card);
  });
}

// ===== Articles: create (DM only) =====
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const createArticleBtn = document.getElementById("createArticleBtn");
const articleTitleInput = document.getElementById("articleTitle");
const articleTypeInput = document.getElementById("articleType");
const articleContentInput = document.getElementById("articleContent");
const articlePublicInput = document.getElementById("articlePublic");
const articleFormStatus = document.getElementById("articleFormStatus");

if (createArticleBtn) {
  createArticleBtn.addEventListener("click", async () => {
    if (!isAdmin) {
      articleFormStatus.textContent =
        "Only the DM/admin can create articles.";
      return;
    }

    const title = articleTitleInput.value.trim();
    const type = articleTypeInput.value.trim() || "misc";
    const content = articleContentInput.value.trim();
    const isPublic = articlePublicInput.checked;
    const slug = generateSlug(title);

    if (!title) {
      articleFormStatus.textContent = "Title is required.";
      return;
    }

    articleFormStatus.textContent = "Creating article...";

    try {
      const { data, error } = await supabaseClient
        .from("articles")
        .insert({
          title,
          slug,
          type,
          content,
          is_public: isPublic,
          created_by: currentUser ? currentUser.id : null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating article:", error);
        articleFormStatus.textContent =
          "Error creating article: " + error.message;
        return;
      }

      articleFormStatus.textContent = `Created article "${data.title}".`;
      // Clear fields
      articleTitleInput.value = "";
      articleTypeInput.value = "";
      articleContentInput.value = "";
      articlePublicInput.checked = true;

      await loadArticles();
    } catch (err) {
      console.error("Unexpected article create error:", err);
      articleFormStatus.textContent =
        "Unexpected error: " + err.message;
    }
  });
}

// ===== Init on load =====
async function initStarfallApp() {
  await refreshAuthState();
  await loadArticles();
}

initStarfallApp();