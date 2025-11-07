let contentsData = [];
const activeProfileId = localStorage.getItem('activeProfileId');

document.addEventListener('DOMContentLoaded', async () => {
  if (!Boolean(localStorage.getItem("isAuthenticated"))) {
    window.location.href = "/login";
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const mediaType = urlParams.get('mediaType');
  if (mediaType) {
    document.getElementById('search').placeholder = mediaType === 'movies' ? 'חיפוש סרטים...' : 'חיפוש סדרות...';

    await fetch("http://localhost:3000/api/content/profile/" + activeProfileId, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then(res => res.json()).then(data => {
        contentsData = data.filter(item => item.type === (mediaType === 'movies' ? 'movie' : 'series'));
        renderItems(contentsData);
      }
      )
      .catch(() => []);
  }
  else {

    await fetch("http://localhost:3000/api/content/profile/" + activeProfileId, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then(res => res.json()).then(data => {
        contentsData = data;
        renderItems(data);
      }
      )
      .catch(() => []);
  }
});

function renderItems(items) {
  const contentEl = document.getElementById('content');
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


function posterClick(id) {
  window.location.href = `/media-content/${id}`;
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




function burstAt(el, glyph = '❤️') {
  const fxLayer = document.getElementById('fx-layer');
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top;
  const span = document.createElement('span');
  span.className = 'burst';
  span.textContent = glyph;
  span.style.left = `${x}px`;
  span.style.top = `${y}px`;
  fxLayer.appendChild(span);
  span.addEventListener('animationend', () => span.remove());
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}


// חיפוש
const searchInput = document.getElementById('search');
searchInput.addEventListener('input', () => {
  searchInput.value?.length > 0 ? filterAndRender() : renderItems(contentsData);
});

// מיון אלפביתי
const btnSort = document.getElementById('btnSort');
let sortAsc = true; // מתחלף בין א->ת לת->א
btnSort.addEventListener('click', () => {
  sortAsc = !sortAsc;
  btnSort.textContent = sortAsc ? 'מיין א-ת' : 'מיין ת-א';
  filterAndRender(sortAsc);
});

function filterAndRender(sortAsc = true) {
  const term = document.getElementById('search').value.trim().toLowerCase();
  let filtered = contentsData.filter(it =>
    it.name.toLowerCase().includes(term) ||
    it.genres.some(g => g.toLowerCase().includes(term)) ||
    String(it.year).includes(term)
  );

  // מיון אלפביתי לפי שם
  filtered.sort((a, b) => {
    return sortAsc
      ? a.name.localeCompare(b.name, ['he', 'en'], { sensitivity: 'base' })
      : b.name.localeCompare(a.name, ['he', 'en'], { sensitivity: 'base' });
  });
  renderItems(filtered);
}