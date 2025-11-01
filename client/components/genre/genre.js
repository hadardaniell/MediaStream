const PAGE_SIZE = 8; // זה יכול להפוך למשתנה סביבה בהמשך
let currentPage = 1;
let currentGenre = "all";
let sortBy = "popularity";
let filterWatched = "all";
let loading = false;

// דוגמת דאטה (במקום DB)
const allSeries = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: `סדרה ${i + 1}`,
  genre: ["action", "comedy", "drama", "animation"][i % 4],
  popularity: Math.floor(Math.random() * 100),
  rating: (Math.random() * 5).toFixed(1),
  watched: Math.random() > 0.5,
  image: "https://placehold.co/400x600/2a2a2a/fff?text=Series+" + (i + 1),
}));

const seriesContainer = document.getElementById("seriesContainer");
const loadingIndicator = document.getElementById("loadingIndicator");

function renderSeries() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  let filtered = allSeries.filter(s =>
    (currentGenre === "all" || s.genre === currentGenre) &&
    (filterWatched === "all" ||
      (filterWatched === "watched" && s.watched) ||
      (filterWatched === "unwatched" && !s.watched))
  );

  filtered.sort((a, b) =>
    sortBy === "popularity" ? b.popularity - a.popularity : b.rating - a.rating
  );

  const slice = filtered.slice(start, end);

  slice.forEach(series => {
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <img src="${series.image}" class="card-img-top" alt="${series.title}">
      <div class="card-body">
        <h5 class="card-title">${series.title}</h5>
        <p class="mb-1">⭐ ${series.rating} | 🔥 ${series.popularity}</p>
        <small>${series.watched ? "✅ נצפה" : "👁️ לא נצפה"}</small>
      </div>
    `;

    seriesContainer.appendChild(card);
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
  }, 800);
}

function resetAndReload() {
  seriesContainer.innerHTML = "";
  currentPage = 1;
  loadMore();
}

// אירועים
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => {
      b.classList.remove("btn-primary");
      b.classList.add("btn-outline-light");
    });
    btn.classList.remove("btn-outline-light");
    btn.classList.add("btn-primary");

    currentGenre = btn.getAttribute("data-genre");
    resetAndReload();
  });
});

document.getElementById("sortSelect").addEventListener("change", e => {
  sortBy = e.target.value;
  resetAndReload();
});

document.getElementById("watchedSelect").addEventListener("change", e => {
  filterWatched = e.target.value;
  resetAndReload();
});

// גלילה אינסופית
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    loadMore();
  }
});

// טעינה ראשונית
loadMore();
