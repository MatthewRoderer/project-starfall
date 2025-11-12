console.log("Pantheon page loaded");

if (typeof supabaseClient === "undefined") {
  console.error("supabaseClient is not defined. Check auth.js.");
}

let pantheonIsAdmin = false;
let pantheonUser = null;
let pantheonOverviewId = null; // id of the pantheon article in DB

const pantheonStatusEl = document.getElementById("pantheonStatus");
const pantheonContentEl = document.getElementById("pantheonContent");
const pantheonEditWrapper = document.getElementById("pantheonEditWrapper");
const pantheonEditText = document.getElementById("pantheonEditText");
const pantheonEditStatus = document.getElementById("pantheonEditStatus");

const godsStatusEl = document.getElementById("godsStatus");
const godsListEl = document.getElementById("godsList");

async function loadAuthForPantheon() {
  if (typeof supabaseClient === "undefined") return;

  const { data, error } = await supabaseClient.auth.getUser();
  if (error) {
    console.error("Pantheon getUser error:", error);
    pantheonUser = null;
    pantheonIsAdmin = false;
    return;
  }

  pantheonUser = data?.user ?? null;
  if (!pantheonUser) {
    pantheonIsAdmin = false;
    return;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", pantheonUser.id)
    .single();

  if (profileError) {
    console.error("Pantheon profile error:", profileError);
  }

  pantheonIsAdmin = profile?.role === "admin";
}

async function loadPantheonOverview() {
  if (!pantheonStatusEl || !pantheonContentEl) return;

  pantheonStatusEl.textContent = "Loading pantheon info...";

  if (typeof supabaseClient === "undefined") {
    pantheonStatusEl.textContent = "Error: Supabase client not found.";
    return;
  }

  const { data, error } = await supabaseClient
    .from("articles")
    .select("id,title,slug,type,content")
    .eq("slug", "starfall-pantheon")
    .single();

  if (error) {
    console.error("Error loading pantheon overview:", error);
    pantheonStatusEl.textContent =
      "Error loading pantheon overview: " + error.message;
    return;
  }

  pantheonOverviewId = data.id;
  pantheonStatusEl.textContent = "";
  pantheonContentEl.textContent =
    data.content || "(No pantheon overview written yet.)";

  // If DM, show edit UI
  if (pantheonIsAdmin && pantheonEditWrapper && pantheonEditText) {
    pantheonEditWrapper.style.display = "block";
    pantheonEditText.value = data.content || "";
  } else if (pantheonEditWrapper) {
    pantheonEditWrapper.style.display = "none";
  }
}

async function savePantheonOverview() {
  if (!pantheonIsAdmin) {
    pantheonEditStatus.textContent = "Only DM can edit the pantheon overview.";
    return;
  }
  if (!pantheonOverviewId) {
    pantheonEditStatus.textContent =
      "Pantheon overview article not found.";
    return;
  }

  const newContent = pantheonEditText.value.trim();
  pantheonEditStatus.textContent = "Saving...";

  const { error } = await supabaseClient
    .from("articles")
    .update({ content: newContent })
    .eq("id", pantheonOverviewId);

  if (error) {
    console.error("Error saving pantheon overview:", error);
    pantheonEditStatus.textContent =
      "Error saving: " + error.message;
    return;
  }

  pantheonEditStatus.textContent = "Pantheon overview saved.";
  pantheonContentEl.textContent =
    newContent || "(No pantheon overview written yet.)";
}

async function loadGods() {
  if (!godsListEl || !godsStatusEl) return;

  godsStatusEl.textContent = "Loading gods...";

  if (typeof supabaseClient === "undefined") {
    godsStatusEl.textContent = "Error: Supabase client not found.";
    return;
  }

  const { data, error } = await supabaseClient
    .from("articles")
    .select("title,slug,type,content,is_public")
    .eq("type", "god")
    .order("title", { ascending: true });

  if (error) {
    console.error("Error loading pantheon gods:", error);
    godsStatusEl.textContent =
      "Error loading gods: " + error.message;
    return;
  }

  godsListEl.innerHTML = "";

  if (!data || data.length === 0) {
    godsStatusEl.textContent =
      "No gods found yet. Create them from the main page as DM.";
    return;
  }

  godsStatusEl.textContent = "";

  data.forEach((god) => {
    const card = document.createElement("div");
    card.className = "article-card";

    const titleEl = document.createElement("h3");
    titleEl.textContent = god.title;

    const metaEl = document.createElement("div");
    metaEl.className = "article-meta";
    metaEl.textContent = `${god.type} • ${
      god.is_public ? "public" : "private"
    }`;

    const contentEl = document.createElement("div");
    contentEl.className = "article-content";
    contentEl.textContent =
      god.content || "(no description yet)";

    const linkEl = document.createElement("a");
    linkEl.href = `god.html?slug=${encodeURIComponent(god.slug)}`;
    linkEl.textContent = "View full lore";
    linkEl.style.display = "inline-block";
    linkEl.style.marginTop = "0.5rem";

    card.appendChild(titleEl);
    card.appendChild(metaEl);
    card.appendChild(contentEl);
    card.appendChild(linkEl);

    godsListEl.appendChild(card);
  });
}

// Save button handler
const savePantheonBtn = document.getElementById("savePantheonBtn");
if (savePantheonBtn) {
  savePantheonBtn.addEventListener("click", () => {
    savePantheonOverview();
  });
}

// Init
async function initPantheonPage() {
  await loadAuthForPantheon();
  await loadPantheonOverview();
  await loadGods();
}

initPantheonPage();

