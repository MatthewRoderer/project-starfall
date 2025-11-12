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

const godSymbolWrapper = document.getElementById("godSymbolWrapper");
const godSymbolImg = document.getElementById("godSymbolImg");
const godTitlesEl = document.getElementById("godTitles");
const godDomainsEl = document.getElementById("godDomains");

const godEditWrapper = document.getElementById("godEditWrapper");
const godEditText = document.getElementById("godEditText");
const godEditStatus = document.getElementById("godEditStatus");
const godSymbolInput = document.getElementById("godSymbolInput");
const godTitlesInput = document.getElementById("godTitlesInput");
const godDomainsInput = document.getElementById("godDomainsInput");

function getSlugFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug");
}

// Simple wiki-link renderer: [[slug]] or [[slug|Label]]
function renderLore(content) {
  if (!content) return "(no lore has been written yet.)";

  // Escape HTML first
  let escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Replace [[slug]] or [[slug|Label]]
  escaped = escaped.replace(
    /\[\[([^\|\]]+)(\|([^\]]+))?\]\]/g,
    (match, slugPart, _rest, labelPart) => {
      const slug = slugPart.trim().toLowerCase();
      const label = (labelPart || slugPart).trim();
      const url = `god.html?slug=${encodeURIComponent(slug)}`;
      return `<a href="${url}">${label}</a>`;
    }
  );

  // Preserve line breaks
  return escaped.replace(/\n/g, "<br>");
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
    .select(
      "id,title,slug,type,content,is_public,created_at,symbol_url,titles,domains"
    )
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

  // Title + meta
  godTitleEl.textContent = data.title;
  godStatusEl.textContent = "";
  godMetaEl.textContent = `${data.type} • ${
    data.is_public ? "public" : "private"
  }`;

  // Symbol
  if (data.symbol_url) {
    godSymbolImg.src = data.symbol_url;
    godSymbolImg.style.display = "block";
  } else {
    godSymbolImg.style.display = "none";
  }

  // Titles & domains
  godTitlesEl.textContent = data.titles || "(none specified)";
  godDomainsEl.textContent = data.domains || "(none specified)";

  // Lore with internal links
  godContentEl.innerHTML = renderLore(data.content);

  // If DM, show edit controls
  if (godIsAdmin && godEditWrapper && godEditText) {
    godEditWrapper.style.display = "block";
    godEditText.value = data.content || "";
    godSymbolInput.value = data.symbol_url || "";
    godTitlesInput.value = data.titles || "";
    godDomainsInput.value = data.domains || "";
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

  const newLore = godEditText.value.trim();
  const newSymbol = godSymbolInput.value.trim();
  const newTitles = godTitlesInput.value.trim();
  const newDomains = godDomainsInput.value.trim();

  godEditStatus.textContent = "Saving...";

  const { error } = await supabaseClient
    .from("articles")
    .update({
      content: newLore,
      symbol_url: newSymbol,
      titles: newTitles,
      domains: newDomains,
    })
    .eq("id", godArticleId);

  if (error) {
    console.error("Error saving god lore:", error);
    godEditStatus.textContent =
      "Error saving: " + error.message;
    return;
  }

  godEditStatus.textContent = "God lore saved.";

  // Update display
  if (newSymbol) {
    godSymbolImg.src = newSymbol;
    godSymbolImg.style.display = "block";
  } else {
    godSymbolImg.style.display = "none";
  }

  godTitlesEl.textContent = newTitles || "(none specified)";
  godDomainsEl.textContent = newDomains || "(none specified)";
  godContentEl.innerHTML = renderLore(newLore);
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