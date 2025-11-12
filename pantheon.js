console.log("Pantheon page loaded");

// Make sure Supabase client exists
if (typeof supabaseClient === "undefined") {
  console.error("supabaseClient is not defined. Check auth.js.");
}

const godsListEl = document.getElementById("godsList");
const pantheonStatusEl = document.getElementById("pantheonStatus");

async function loadPantheon() {
  if (!godsListEl || !pantheonStatusEl) return;

  pantheonStatusEl.textContent = "Loading gods...";

  if (typeof supabaseClient === "undefined") {
    pantheonStatusEl.textContent = "Error: Supabase client not found.";
    return;
  }

  const { data, error } = await supabaseClient
    .from("articles")
    .select("id,title,slug,type,content,is_public")
    .eq("type", "god")
    .order("title", { ascending: true });

  if (error) {
    console.error("Error loading pantheon:", error);
    pantheonStatusEl.textContent =
      "Error loading gods: " + error.message;
    return;
  }

  godsListEl.innerHTML = "";

  if (!data || data.length === 0) {
    pantheonStatusEl.textContent = "No gods found in the pantheon yet.";
    return;
  }

  pantheonStatusEl.textContent = "";

  data.forEach((god) => {
    const card = document.createElement("div");
    card.className = "article-card";

    const titleEl = document.createElement("h3");
    titleEl.textContent = god.title;

    const metaEl = document.createElement("div");
    metaEl.className = "article-meta";
    metaEl.textContent = `type: ${god.type} • ${
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

loadPantheon();
