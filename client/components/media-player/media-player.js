
/* ---- דיגום פרקים ---- */
const episodes = [
  { id: '1', title: 'פרק 1 — פתיחה', subtitle: 'S01E01', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
  { id: '2', title: 'פרק 2 — המשך', subtitle: 'S01E02', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
  { id: '3', title: 'פרק 3 — פרק אחר', subtitle: 'S01E03', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
];

/* ---- אלמנטים ---- */
const video = document.getElementById('video');
const playPauseBtn = document.getElementById('playPause');
const back10Btn = document.getElementById('back10');
const forward10Btn = document.getElementById('forward10');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const nextBtn = document.getElementById('nextBtn');
const seekBar = document.getElementById('seekBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const openListBtn = document.getElementById('openListBtn');
const drawer = document.getElementById('drawer');
const episodesList = document.getElementById('episodesList');
const titleEl = document.getElementById('title');
const subtitleEl = document.getElementById('subtitle');

let currentIndex = 0;
let seekDrag = false;

/* ---- פונקציות עזר ---- */
function formatTime(sec){
  if(!sec || isNaN(sec)) return '0:00';
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60);
  return `${m}:${s.toString().padStart(2,'0')}`;
}

function loadEpisode(index, autoplay = false){
  const ep = episodes[index];
  if(!ep) return;
  currentIndex = index;
  // עדכון UI
  titleEl.textContent = ep.title;
  subtitleEl.textContent = ep.subtitle;
  video.src = ep.src;
  video.load();
  highlightActiveEpisode();
  if(autoplay) video.play();
}

/* ---- אירועים בסיסיים ---- */
playPauseBtn.addEventListener('click', ()=> {
  if(video.paused) { video.play(); }
  else { video.pause(); }
});

video.addEventListener('play', ()=> {
  playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
});
video.addEventListener('pause', ()=> {
  playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>'
});

// חזרה/קדימה 10 שניות
back10Btn.addEventListener('click', ()=> { video.currentTime = Math.max(0, video.currentTime - 10); });
forward10Btn.addEventListener('click', ()=> { video.currentTime = Math.min(video.duration || 0, video.currentTime + 10); });

// עדכון סטטוס של tqdm
video.addEventListener('loadedmetadata', ()=> {
  durationEl.textContent = formatTime(video.duration);
  seekBar.max = video.duration || 0;
});

video.addEventListener('timeupdate', ()=> {
  if(!seekDrag) seekBar.value = video.currentTime;
  currentTimeEl.textContent = formatTime(video.currentTime);
});

// סרגל חיפוש (seek)
seekBar.addEventListener('input', (e)=> {
  currentTimeEl.textContent = formatTime(e.target.value);
});
seekBar.addEventListener('change', (e)=> {
  video.currentTime = parseFloat(e.target.value);
});
seekBar.addEventListener('mousedown', ()=> seekDrag = true);
seekBar.addEventListener('mouseup', ()=> seekDrag = false);

// כפתור מסך מלא
fullscreenBtn.addEventListener('click', async ()=> {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch(err){ console.warn('Fullscreen error', err); }
});

// כפתור פרק הבא
nextBtn.addEventListener('click', ()=> {
  const next = (currentIndex + 1) % episodes.length;
  loadEpisode(next, true);
});

// סיום הפרק — עוברים אוטומטית לפרק הבא
video.addEventListener('ended', ()=> {
  const next = (currentIndex + 1) % episodes.length;
  loadEpisode(next, true);
});

/* ---- Drawer / episodes list ---- */
function renderEpisodes(){
  episodesList.innerHTML = '';
  episodes.forEach((ep, i) => {
    const el = document.createElement('div');
    el.className = 'episode' + (i === currentIndex ? ' active' : '');
    el.innerHTML = `<div style="font-weight:600">${ep.title}</div><div style="color:rgba(255,255,255,0.6);font-size:13px">${ep.subtitle}</div>`;
    el.addEventListener('click', ()=> {
      loadEpisode(i, true);
      toggleDrawer(false);
    });
    episodesList.appendChild(el);
  });
}

function highlightActiveEpisode(){
  const items = episodesList.querySelectorAll('.episode');
  items.forEach((it, idx)=> {
    it.classList.toggle('active', idx === currentIndex);
  });
}

function toggleDrawer(show){
  drawer.classList.toggle('open', !!show);
  drawer.setAttribute('aria-hidden', !show);
  if(show) renderEpisodes();
}

openListBtn.addEventListener('click', ()=> toggleDrawer(!drawer.classList.contains('open')));

/* ---- קיצורי מקלדת יעילים ---- */
document.addEventListener('keydown', (e)=> {
  // F - fullscreen, Space - play/pause, ArrowLeft/Right - jump 10s
  if(e.code === 'Space'){
    e.preventDefault();
    if(video.paused) video.play(); else video.pause();
  } else if(e.code === 'ArrowLeft'){
    video.currentTime = Math.max(0, video.currentTime - 10);
  } else if(e.code === 'ArrowRight'){
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
  } else if(e.key.toLowerCase() === 'f'){
    fullscreenBtn.click();
  }
});

/* ---- התחלה ---- */
// בדיקה האם יש id ב־URL (כשהדף פתוח ישירות)
(function initFromUrl(){
  // אם רצת מתוך SPA יתכן שתחליפי לוגיקה אחרת; פה פשוט בודקים path
  const pathParts = window.location.pathname.split('/');
  const maybeId = pathParts[pathParts.length - 1];
  // אם יש query ?id= אפשר גם לקרוא מזה
  const q = new URLSearchParams(window.location.search).get('id');
  let idx = 0;
  if(q){
    idx = episodes.findIndex(e=> e.id === q);
  } else if(maybeId && /\d+/.test(maybeId)){
    const found = episodes.findIndex(e=> e.id === maybeId);
    if(found >= 0) idx = found;
  }
  loadEpisode(idx, false);
  renderEpisodes();
})();