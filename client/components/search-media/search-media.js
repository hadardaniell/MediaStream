let contentsData = [];
document.addEventListener('DOMContentLoaded', async () => {

  await fetch('http://localhost:3000/api/content', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  }).then(res => res.json())
    .then(data => {
      contentsData = data;
      renderItems(data);
    })
    .catch(err => {
      console.error('Error fetching content:', err);
    });



  // לייקים
  document.getElementById('content').addEventListener('click', (e) => {
    const btn = e.target.closest('.like-btn');
    if (!btn) return;
    const card = btn.closest('.card');
    const id = card.dataset.id;
    toggleLike(id, btn);
    burstAt(btn, likedMap[id] ? '❤️' : '💔');
  });

  // // חיפוש
  // const searchInput = document.getElementById('search');
  // searchInput.addEventListener('input', () => {
  //   const term = searchInput.value.trim().toLowerCase();
  //   const filtered = ITEMS.filter(it =>
  //     it.title.toLowerCase().includes(term) ||
  //     it.genres.some(g => g.toLowerCase().includes(term)) ||
  //     String(it.year).includes(term)
  //   );
  //   renderItems(filtered);
  // });

});


if (localStorage.getItem('isAuthenticated') !== 'true') {
  window.location.href = '/login';
}

// ---- LocalStorage keys ----
const LS_LIKE_COUNTS = 'feed.likeCounts';
const LS_LIKED = 'feed.liked';

const loadJSON = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// init counts (seed on first run)
let likeCounts = loadJSON(LS_LIKE_COUNTS, null);
if (!likeCounts) {
  likeCounts = {};
  ITEMS.forEach(it => { likeCounts[it.id] = it.likes; });
  saveJSON(LS_LIKE_COUNTS, likeCounts);
}
let likedMap = loadJSON(LS_LIKED, {});

// document.addEventListener('DOMContentLoaded', () => {
//   renderItems(ITEMS);
// });

function renderItems(items) {
  if (!items.length) {
    document.getElementById('content').innerHTML = `
      <div class="no-results">לא נמצאו תוצאות</div>
    `;
    return;
  }
  const content = items.map(item => createCard(item).outerHTML).join('');
  document.getElementById('content').innerHTML = content;
}

//   

function createCard(item) {
  const liked = !!likedMap[item.id];
  const count = likeCounts[item.id] ?? item.likes;

  const col = document.createElement("div");
  col.className = "col-6 col-md-3 col-lg-2";

  const card = document.createElement("div");
  card.className = "card mb-3";
  card.dataset.id = item.id;

  if (item.poster) {
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

function toggleLike(id, btnEl) {
  const nowLiked = !likedMap[id];
  likedMap[id] = nowLiked;

  likeCounts[id] = (likeCounts[id] ?? 0) + (nowLiked ? 1 : -1);
  if (likeCounts[id] < 0) likeCounts[id] = 0;

  saveJSON(LS_LIKED, likedMap);
  saveJSON(LS_LIKE_COUNTS, likeCounts);

  const card = btnEl.closest('.card');
  card.querySelector('.count').textContent = likeCounts[id];
  btnEl.setAttribute('aria-pressed', String(nowLiked));
  btnEl.textContent = nowLiked ? 'אהבתי' : 'סמן לייק';
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