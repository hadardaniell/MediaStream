let sortBy = "likes";
let filterWatched = "all";
// let loading = false;

let contentData = [];
const mediaContainer = document.getElementById("mediaContainer");
const loading =   document.getElementById('loadingOverlay')

const activeProfileId = localStorage.getItem('activeProfileId');

document.addEventListener('DOMContentLoaded', async () => {
  const url = new URL(window.location.href);
  currentGenre = url.searchParams.get('genre');

  const genreSelect = document.getElementById("genreSelect");
  if (genreSelect) {
    genreSelect.value = currentGenre;
  }

  await fetchContentByGenre(currentGenre);
  applyFiltersAndSort();
});

document.getElementById("genreSelect").addEventListener("change", async e => {
  currentGenre = e.target.value;
  await fetchContentByGenre(currentGenre);
  applyFiltersAndSort();
});

document.getElementById("sortSelect").addEventListener("change", e => {
  sortBy = e.target.value;
  applyFiltersAndSort();
});

document.getElementById("watchedSelect").addEventListener("change", e => {
  filterWatched = e.target.value;
  applyFiltersAndSort();
});


function applyFiltersAndSort() {
  let filtered = [...contentData];

  if (filterWatched === "watched") {
    filtered = filtered.filter(item => item.watch?.status !== 'unstarted');
  } else if (filterWatched === "unwatched") {
    filtered = filtered.filter(item => item.watch?.status === 'unstarted');
  }

  if (sortBy === "likes") {
    filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else if (sortBy === "rating") {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  renderItems(filtered);
}

// שליפת תכנים לפי ז׳אנר
async function fetchContentByGenre(genre, sortBy) {
  try {
    loading.style.display = 'flex';
    const res = await fetch(`http://localhost:3000/api/content/profile/${activeProfileId}?genre=${genre}&mode=${sortBy}`);
    contentData = await res.json();
    loading.style.display = 'none';
  } catch (err) {
    console.error(err);
    loading.style.display = 'none';
  }
}

document.getElementById('disney-logo-btn').addEventListener('click', () => {
  window.location.href = '/feed?profile=' + activeProfileId
})

function createCard(item) {
  const count = item.likes || 0;
  const col = document.createElement("div");

  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = item._id;

  const img = document.createElement("img");
  img.src = item.photo;
  img.alt = item.name;
  img.addEventListener("click", () => posterClick(item._id));
  card.appendChild(img);

  const overlay = document.createElement("div");
  overlay.className = "card-overlay";

  const title = document.createElement("h5");
  title.className = "card-title";
  title.innerHTML = `${escapeHtml(item.name)} <small>(${item.year})</small>`;
  overlay.appendChild(title);

  const genre = document.createElement("div");
  genre.className = "card-details";
  genre.textContent = item.genres.join(" · ");
  overlay.appendChild(genre);

  const desc = document.createElement("p");
  desc.className = "description";
  desc.textContent = item.description || "";
  overlay.appendChild(desc);

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const likeBtn = document.createElement("button");
  likeBtn.id = "likeBtn";
  likeBtn.className = `like-btn ${item.hasLike ? "active" : ""}`;
  likeBtn.innerHTML = item.hasLike
    ? `<i class="bi bi-heart-fill"></i> ${count}`
    : `<i class="bi bi-heart"></i> ${count}`;
  likeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleLike(item, likeBtn);
  });

  const watchBtn = document.createElement("button");
  watchBtn.className = "btn-watch";
  watchBtn.textContent = "צפה עכשיו";
  watchBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    posterClick(item._id);
  });

  actions.appendChild(watchBtn);
  actions.appendChild(likeBtn);
  overlay.appendChild(actions);

  card.appendChild(overlay);
  col.appendChild(card);

  return col;
}

async function toggleLike(item, btnEl) {
  try {
    if (!item.hasLike) {
      await fetch(`http://localhost:3000/api/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: activeProfileId, contentId: item._id }),
      });

      const likeBtn = document.getElementById("likeBtn");

      item.hasLike = true;
      item.likes += 1;

      // עדכון כפתור ו‑count
      likeBtn.textContent = item.likes;
      btnEl.classList.add("active");
      btnEl.innerHTML = `<i class="bi bi-heart-fill"></i> ${item.likes}`;
    } else {
      await fetch(`http://localhost:3000/api/likes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: activeProfileId, contentId: item._id }),
      });
      const likeBtn = document.getElementById("likeBtn");

      item.hasLike = false;
      item.likes -= 1;

      // עדכון כפתור ו‑count
      likeBtn.textContent = item.likes;
      btnEl.classList.remove("active");
      btnEl.innerHTML = `<i class="bi bi-heart"></i> ${item.likes}`;
    }
  } catch (err) {
    console.error(err);
  }
}

function renderItems(items) {
  const contentEl = document.getElementById('mediaContainer');
  contentEl.innerHTML = '';

  if (!items.length) {
    contentEl.innerHTML = `<div class="no-results">לא נמצאו תוצאות</div>`;
    return;
  }

  items.forEach(item => {
    const card = createCard(item);
    contentEl.appendChild(card);
  });
}

// async function fetchContentByGenre(genre) {
//   await fetch(`http://localhost:3000/api/content/profile/${activeProfileId}?genre=` + genre, {
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     method: 'GET'
//   }).then(res => res.json()).then(data => {
//     contentData = data;
//   })
// }

function posterClick(id) {
  window.location.href = `/media-content/${id}`;
}


function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
