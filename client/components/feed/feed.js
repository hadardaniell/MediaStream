document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    // window.location.href = "../login";
    // return;
  }

  const allContent = await fetch("http://localhost:3000/api/content")
    .then(res => res.json())
    .catch(() => []);

  renderSection("continueWatching", getContinueWatching(allContent));
  renderSection("recommended", getRecommendations(allContent));
  renderSection("popular", getPopular(allContent));
  renderNewByGenre(allContent);
});

// --- LocalStorage לייקים ---
const LS_LIKE_COUNTS = "feed.likeCounts";
const LS_LIKED = "feed.liked";
let likeCounts = JSON.parse(localStorage.getItem(LS_LIKE_COUNTS) || "{}");
let likedMap = JSON.parse(localStorage.getItem(LS_LIKED) || "{}");

function saveLikes() {
  localStorage.setItem(LS_LIKE_COUNTS, JSON.stringify(likeCounts));
  localStorage.setItem(LS_LIKED, JSON.stringify(likedMap));
}

// Toggle לייק + פנייה לשרת
async function toggleLike(id, btnEl) {
  const nowLiked = !likedMap[id];
  likedMap[id] = nowLiked;
  likeCounts[id] = (likeCounts[id] || 0) + (nowLiked ? 1 : -1);
  if (likeCounts[id] < 0) likeCounts[id] = 0;

  saveLikes();

  // עדכון UI
  const card = btnEl.closest(".card");
  card.querySelector(".count").textContent = likeCounts[id];
  btnEl.setAttribute("aria-pressed", String(nowLiked));
  btnEl.textContent = nowLiked ? "אהבתי" : "סמן לייק";

  // פנייה ל־API
  try {
    await fetch(`http://localhost:3000/api/content/${id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liked: nowLiked }),
    });
  } catch (err) {
    console.error("Error sending like:", err);
  }
}

// --- פונקציות כלליות ---
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSection(containerId, data) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  data.forEach((item) => {
    container.appendChild(createCard(item));
  });
}

function createCard(item) {
  const liked = !!likedMap[item.id];
  const count = likeCounts[item.id] ?? item.likes;

  const col = document.createElement("div");
  col.className = "col-6 col-md-3 col-lg-2";
  
  const card = document.createElement("div");
  card.className = "card mb-3";
  card.dataset.id = item.id;

  if(item.poster) {
    const img = document.createElement("img");
    img.className = "card-img-top";
    img.src = item.poster;
    img.alt = item.name;
    card.appendChild(img);
  }

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("h5");
  title.className = "card-title";
  title.innerHTML = `${escapeHtml(item.name)} <small class="text-muted">(${item.year})</small>`;
  body.appendChild(title);

  const genre = document.createElement("p");
  genre.className = "card-text genre";
  genre.textContent = item.genres.join(" · ");
  body.appendChild(genre);

  const desc = document.createElement("p");
  desc.className = "card-text description";
  desc.textContent = item.description || "";
  body.appendChild(desc);

  const actions = document.createElement("div");
  actions.className = "d-flex align-items-center justify-content-between";
  actions.style.gap = "1em";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `btn btn-sm ${liked ? "btn-danger" : "btn-outline-primary"} like-btn`;
  btn.setAttribute("aria-pressed", liked);
  btn.textContent = liked ? "אהבתי" : "סמן לייק";
  btn.addEventListener("click", () => toggleLike(item.id, btn));

  const span = document.createElement("span");
  span.innerHTML = `<span class="count">${count}</span> לייקים`;

  actions.appendChild(btn);
  actions.appendChild(span);
  body.appendChild(actions);

  card.appendChild(body);
  col.appendChild(card);

  return col;
}


/* --- Mock logic --- */

// המשך צפייה (לשימוש בעתיד עם API אמיתי)
function getContinueWatching(all) {
  return all.slice(0, 5);
}

// המלצות לפי דירוג
function getRecommendations(all) {
  return all.filter((x) => x.rating >= 4.5).slice(0, 6);
}

// פופולריים
function getPopular(all) {
  return all.sort((a, b) => b.rating - a.rating).slice(0, 6);
}

// חדשים לפי ז'אנר
function renderNewByGenre(all) {
  const container = document.getElementById("newByGenre");
  container.innerHTML = "";

  const genreMap = {};
  all.forEach((item) => {
    item.genres.forEach((g) => {
      if (!genreMap[g]) genreMap[g] = [];
      genreMap[g].push(item);
    });
  });

  for (const [genre, items] of Object.entries(genreMap)) {
    const section = document.createElement("div");
    section.className = "mb-4";
    section.innerHTML = `<h2 class="section-title">${Genre[genre]}</h2>`;
    const row = document.createElement("div");
    row.className = "row g-3";
    items
      .sort((a, b) => b.year - a.year)
      .slice(0, 10)
      .forEach((i) => row.appendChild(createCard(i)));
    section.appendChild(row);
    container.appendChild(section);
  }
}
