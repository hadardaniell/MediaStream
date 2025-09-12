if (localStorage.getItem('isAuthenticated') !== 'true') {
   window.location.href = '../login/login.html';
 }
//---- Single content item (dummy) ----
const ITEM = {
  id: 'm001',
  title: 'חתונמי',
  year: 2016,
  genres: ['אהבה','אימה'],
  likes: 124,
  poster: '../assets/Danny.png'
};

// ---- LocalStorage keys ----
const LS_LIKE_COUNTS = 'feed.likeCounts';
const LS_LIKED       = 'feed.liked';

const loadJSON = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// init counts (seed on first run)
let likeCounts = loadJSON(LS_LIKE_COUNTS, null);
if (!likeCounts) { likeCounts = { [ITEM.id]: ITEM.likes }; saveJSON(LS_LIKE_COUNTS, likeCounts); }
let likedMap   = loadJSON(LS_LIKED, {});

document.addEventListener('DOMContentLoaded', () => {
  renderItem(ITEM);
  document.getElementById('content').addEventListener('click', (e) => {
    const btn = e.target.closest('.like-btn');
    if (!btn) return;
    toggleLike(ITEM.id, btn);
    burstAt(btn, likedMap[ITEM.id] ? '❤️' : '💔');
  });
});

function renderItem(item) {
  const liked = !!likedMap[item.id];
  const count = likeCounts[item.id] ?? item.likes;

  document.getElementById('content').innerHTML = `
    <div class="card" data-id="${item.id}">
      <div class="row-flex">
        ${item.poster ? `<img class="poster" src="${escapeHtml(item.poster)}" alt="${escapeHtml(item.title)}">` : ''}
        <div>
          <div class="title">${escapeHtml(item.title)} <span style="opacity:.7">(${item.year})</span></div>
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
  `;
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
  span.style.top  = `${y}px`;
  fxLayer.appendChild(span);
  span.addEventListener('animationend', () => span.remove());
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}