document.addEventListener('DOMContentLoaded', () => {
  renderItems(ITEMS);

  // לייקים
  document.getElementById('content').addEventListener('click', (e) => {
    const btn = e.target.closest('.like-btn');
    if (!btn) return;
    const card = btn.closest('.card');
    const id = card.dataset.id;
    toggleLike(id, btn);
    burstAt(btn, likedMap[id] ? '❤️' : '💔');
  });

  // חיפוש
  const searchInput = document.getElementById('search');
  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = ITEMS.filter(it =>
      it.title.toLowerCase().includes(term) ||
      it.genres.some(g => g.toLowerCase().includes(term)) ||
      String(it.year).includes(term)
    );
    renderItems(filtered);
  });
});

if (localStorage.getItem('isAuthenticated') !== 'true') {
  window.location.href = '../login/login.html';
}

//---- Multiple content items ----
const ITEMS = [
  {
    id: 'm001',
    title: 'חתונמי',
    year: 2016,
    genres: ['אהבה', 'אימה'],
    likes: 124,
    poster: '../assets/Danny.png'
  },
  {
    id: 'm002',
    title: 'האח הגדול',
    year: 2019,
    genres: ['ריאליטי', 'דרמה'],
    likes: 85,
    poster: '../assets/BigBrother.png'
  },
  {
    id: 'm003',
    title: 'פאודה',
    year: 2020,
    genres: ['אקשן', 'מתח'],
    likes: 312,
    poster: '../assets/Fauda.png'
  }
];

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

document.addEventListener('DOMContentLoaded', () => {
  renderItems(ITEMS);

  document.getElementById('content').addEventListener('click', (e) => {
    const btn = e.target.closest('.like-btn');
    if (!btn) return;
    const card = btn.closest('.card');
    const id = card.dataset.id;
    toggleLike(id, btn);
    burstAt(btn, likedMap[id] ? '❤️' : '💔');
  });
});

function renderItems(items) {
  if (!items.length) {
    document.getElementById('content').innerHTML = `
      <div class="no-results">לא נמצאו תוצאות</div>
    `;
    return;
  }

  const html = items.map(item => {
    const liked = !!likedMap[item.id];
    const count = likeCounts[item.id] ?? item.likes;
    {/* <div class="card" style="width: 18rem;">
  <img class="card-img-top" src="..." alt="Card image cap">
  <div class="card-body">
    <h5 class="card-title">Card title</h5>
    <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
    <a href="#" class="btn btn-primary">Go somewhere</a>
  </div>
</div> */}
    return `
      <div class="card" data-id="${item.id}">
        <div class="card-img-top">
          ${item.poster ? `<img class="poster" src="${escapeHtml(item.poster)}" alt="${escapeHtml(item.title)}">` : ''}
          <div>
          <div class="card-body">

          <div class="card-title">${escapeHtml(item.title)} <span style="opacity:.7">(${item.year})</span></div>
          <div class="meta">ז'אנר: ${item.genres.map(escapeHtml).join(', ')}</div>
          <div class="actions">
            <button type="button" class="btn btn-sm like-btn" aria-pressed="${liked}" aria-label="Like ${escapeHtml(item.title)}">
              ${liked ? '♥ נלחץ' : '♡ לייק'}
            </button>
            <span class="likes"><span class="count">${count}</span> לייקים</span>
          </div>
          </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('content').innerHTML = html;
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
  btnEl.textContent = nowLiked ? '♥ נלחץ' : '♡ לייק';
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
