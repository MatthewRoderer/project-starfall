console.log("God detail page loaded");

if (typeof supabaseClient === "undefined") {
  console.error("supabaseClient is not defined. Check auth.js.");
}

let godIsAdmin = false;
let godUser = null;
let godArticleId = null;

const godTitleEl = document.getElementById("godTitle");
const godStatusEl = document.getElementById("godStatus");
const godMetaEl = document.getElementById("godMeta");
const godContentEl = document.getElementById("godContent");

const godEditWrapper = document.getElementById("godEditWrapper");
const godEditText = document.getElementById("godEditText");
const godEditStatus = document.getElementById("godEditStatus");

function getSlugFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug");
}

async function loadAuthForGodPage() {
  if (typeof supabaseClient === "undefined") return;

  const { data, error } = await supabaseClient.auth.getUser();
  if (error) {
    console.error("God getUser error:", error);
    godUser = null;
    godIsAdmin = false;
    return;
  }

  godUser = data?.user ?? null;
  if (!godUser) {
    godIsAdmin = false;
    return;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", godUser.id)
    .single();

  if (profileError) {
    console.error("God profile error:", profileError);
  }

  godIsAdmin = profile?.role === "admin";
}

async function loadGod() {
  const slug = getSlugFromQuery();

  if (!slug) {
    godTitleEl.textContent = "No god specified.";
    godStatusEl.textContent =
      "This page expects a ?slug=... parameter in the URL.";
    return;
  }

  godStatusEl.textContent = "Loading deity lore...";

  if (typeof supabaseClient === "undefined") {
    godStatusEl.textContent = "Error: Supabase client not found.";
    return;
  }

  const { data, error } = await supabaseClient
    .from("articles")
    .select("id,title,slug,type,content,is_public,created_at")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error loading god:", error);
    godTitleEl.textContent = "Unable to load deity.";
    godStatusEl.textContent =
      "Error loading this god's entry: " + error.message;
    return;
  }

  godArticleId = data.id;

  godTitleEl.textContent = data.title;
  godStatusEl.textContent = "";
  godMetaEl.textContent = `${data.type} • ${
    data.is_public ? "public" : "private"
  }`;
  godContentEl.textContent =
    data.content || "(no lore has been written yet.)";

  if (godIsAdmin && godEditWrapper && godEditText) {
    godEditWrapper.style.display = "block";
    godEditText.value = data.content || "";
  } else if (godEditWrapper) {
    godEditWrapper.style.display = "none";
  }
}

async function saveGodLore() {
  if (!godIsAdmin) {
    godEditStatus.textContent =
      "Only the DM/admin can edit god lore.";
    return;
  }
  if (!godArticleId) {
    godEditStatus.textContent =
      "God article not loaded yet.";
    return;
  }

  const newContent = godEditText.value.trim();
  godEditStatus.textContent = "Saving...";

  const { error } = await supabaseClient
    .from("articles")
    .update({ content: newContent })
    .eq("id", godArticleId);

  if (error) {
    console.error("Error saving god lore:", error);
    godEditStatus.textContent =
      "Error saving: " + error.message;
    return;
  }

  godEditStatus.textContent = "God lore saved.";
  godContentEl.textContent =
    newContent || "(no lore has been written yet.)";
}

const saveGodBtn = document.getElementById("saveGodBtn");
if (saveGodBtn) {
  saveGodBtn.addEventListener("click", () => {
    saveGodLore();
  });
}

async function initGodPage() {
  await loadAuthForGodPage();
  await loadGod();
}

initGodPage();