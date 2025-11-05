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
      const res = await fetch(`http://localhost:3000/api/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: activeProfileId, contentId: item._id }),
      }).then(
        res => res.json()).then(data => {
          const card = btnEl.closest(".card");
          card.querySelector(".count").textContent = item.likes + 1;
          btnEl.className = `btn btn-sm btn-danger like-btn`;
          btnEl.textContent = "אהבתי";
          item.hasLike = true;
          item.likes += 1;
        }).catch(err => {
        });
    } else {
      const res = await fetch(`http://localhost:3000/api/likes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: activeProfileId, contentId: item._id }),
      }).then(
        res => res.json()).then(data => {
          const card = btnEl.closest(".card");
          card.querySelector(".count").textContent = item.likes - 1;
          btnEl.className = `btn btn-sm btn-outline-primary like-btn`;
          btnEl.textContent = "סמן לייק";
          item.hasLike = false;
          item.likes -= 1;
        }).catch(err => {
        });
    }
  } catch (err) {
    console.error(err);
  }
}


function createCard(item) {
  const count = item.likes || 0;

  const col = document.createElement("div");

  const card = document.createElement("div");
  card.className = "card mb-3";
  card.dataset.id = item._id;

  if (item.photo) {
    const posterContainer = document.createElement("div");
    posterContainer.className = "poster-container";
    const img = document.createElement("img");
    img.className = "poster";
    img.src = item.photo;
    posterContainer.appendChild(img);
    posterContainer.addEventListener("click", () => posterClick(item._id));
    card.appendChild(posterContainer);
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
  btn.className = `btn btn-sm ${item.hasLike ? "btn-danger" : "btn-outline-primary"} like-btn`;
  btn.textContent = item.hasLike ? "אהבתי" : "סמן לייק";

  btn.addEventListener("click", () => toggleLike(item, btn));


  const span = document.createElement("span");
  span.innerHTML = `<span class="count">${count}</span> לייקים`;

  actions.appendChild(btn);
  actions.appendChild(span);
  body.appendChild(actions);

  card.appendChild(body);
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