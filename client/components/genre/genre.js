const PAGE_SIZE = 8;
let currentPage = 1;
let currentGenre = "all";
let sortBy = "popularity";
let filterWatched = "all";
let loading = false;
let allSeries = [];

const seriesContainer = document.getElementById("seriesContainer");
const loadingIndicator = document.getElementById("loadingIndicator");

async function fetchSeries() {
  try {
    loadingIndicator.style.display = "block";
    const activeProfileId = localStorage.getItem('activeProfileId');
    if (!activeProfileId) { alert("לא נמצא פרופיל פעיל"); return; }

    let url = `http://localhost:3000/api/content/profile/${activeProfileId}?type=series&sortBy=${sortBy}`;
    if (currentGenre !== "all") url += `&genre=${encodeURIComponent(currentGenre)}`;

    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("שגיאה בטעינת תכנים מהשרת");

    allSeries = await res.json();
    resetAndReload();
  } catch (err) {
    console.error(err);
    alert("לא ניתן לטעון תוכן מהשרת: " + err.message);
  } finally {
    loadingIndicator.style.display = "none";
  }
}

function renderSeries() {
  seriesContainer.innerHTML = "";

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  let filtered = [...allSeries];
  if (filterWatched !== "all") {
    filtered = filtered.filter(s =>
      (filterWatched === "watched" && s.watch?.status === "completed") ||
      (filterWatched === "unwatched" && (!s.watch || s.watch.status !== "completed"))
    );
  }

  filtered.slice(start, end).forEach(series => {
    const card = document.createElement("div");
    card.className = "card";

    const poster = series.photo ?? "/client/assets/default-poster.png";
    const liked = series.liked ? "active" : "";
    card.innerHTML = `
      <img src="${poster}" alt="${series.name}">
      <div class="card-body">
        <h5 class="card-title">${series.name ?? "ללא שם"} <small>(${series.year ?? ""})</small></h5>
        <p class="card-details">${Array.isArray(series.genres) ? series.genres.join(" · ") : series.genres ?? ""}</p>
        <p class="description">${series.description ?? ""}</p>
        <div class="card-actions">
          <button class="btn-watch"><i class="bi bi-play-fill"></i> צפה עכשיו</button>
          <button class="like-btn ${liked}"><i class="bi bi-heart-fill"></i> ${series.likes ?? 0}</button>
        </div>
      </div>
    `;
    seriesContainer.appendChild(card);

    const likeBtn = card.querySelector(".like-btn");
    likeBtn.addEventListener("click", () => {
      likeBtn.classList.toggle("active");
      let count = parseInt(likeBtn.textContent) || 0;
      likeBtn.innerHTML = `<i class="bi bi-heart-fill"></i> ${likeBtn.classList.contains("active") ? count + 1 : count - 1}`;
    });
  });
}

function loadMore() {
  if (loading) return;
  loading = true;
  loadingIndicator.style.display = "block";

  setTimeout(() => {
    renderSeries();
    currentPage++;
    loading = false;
    loadingIndicator.style.display = "none";
  }, 300);
}

function resetAndReload() {
  seriesContainer.innerHTML = "";
  currentPage = 1;
  loadMore();
}

// אירועים
document.getElementById("sortSelect").addEventListener("change", e => { sortBy = e.target.value; fetchSeries(); });
document.getElementById("watchedSelect").addEventListener("change", e => { filterWatched = e.target.value; resetAndReload(); });
document.getElementById("genreSelect").addEventListener("change", e => { currentGenre = e.target.value; fetchSeries(); });

// גלילה אינסופית
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    loadMore();
  }
});

fetchSeries();
