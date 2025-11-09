let activeWatchData = null;
let contentData = null;
const activeProfileId = localStorage.getItem('activeProfileId');
// let seasonNumber = 1;
// let currentIndex = 0;

let startFromBeginning = false;
let progressSeconds = 0;
let season = 0;
let episode = 0;

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
const seasonNumberDrawer = document.getElementById('seasonNumber');


document.addEventListener('DOMContentLoaded', async () => {
  const url = new URL(window.location.href);

  // קבלת הפרמטרים ב‑query string
  startFromBeginning = Boolean(url.searchParams.get('startFromBeginning'));
  progressSeconds = Number(url.searchParams.get('progressSeconds'));
  season = Number(url.searchParams.get('season'));
  episode = Number(url.searchParams.get('episode'));

  const pathParts = url.pathname.split('/');
  const contentId = pathParts[2];

  console.log('ID:', contentId);
  console.log('startFromBeginning:', startFromBeginning);

  await fetch('http://localhost:3000/api/content/' + contentId + '?include=episodes').then(
    res => res.json()).then(data => {
      contentData = data;
    }).catch(err => {
    });

  switch (contentData.type) {
    case 'series': {
      if (startFromBeginning) {
        season = 1;
        episode = 1;
      }
      loadEpisode(contentData.episodes, season, episode, progressSeconds ?? 0, false);
      renderEpisodes()
      break;
    }
    case 'movie': {
      movieMode();
      loadMovie(contentData, progressSeconds ?? 0, true)
    }
  }

  function loadMovie(movieData, progressSeconds = 0, autoplay = false) {
    if (!movieData) return;

    // עדכון UI
    titleEl.textContent = movieData.name || '';
    video.src = movieData.video; // כאן ה-URL של הסרט
    video.load();

    video.currentTime = progressSeconds;
    if (autoplay) video.play();

    video.removeEventListener('loadedmetadata', startPosition);
  }



  function loadEpisode(episodes, season, episode, progressSeconds = 0, autoplay = false) {
    const ep = episodes.find(ep => ep.seasonNumber === season && ep.episodeNumber === episode);
    if (!ep) return;
    currentIndex = episodes.findIndex((_ep) => _ep === ep);
    // עדכון UI
    titleEl.textContent = ep.shortDescription;
    subtitleEl.textContent = 'S' + ep.seasonNumber.toString() + ' ' + 'E' + ep.episodeNumber.toString();
    video.src = ep.video;
    video.load();
    highlightActiveEpisode();

    video.currentTime = progressSeconds;

    if (autoplay) video.play();
  }

  function renderEpisodes() {
  seasonNumberDrawer.textContent = 'עונה ' + season;
    const seasonIndex = contentData.episodes.filter(ep => ep.seasonNumber === season)
      .findIndex(ep => ep.episodeNumber === episode);
    episodesList.innerHTML = '';
    contentData.episodes.filter(ep => ep.seasonNumber === season).forEach((ep, i) => {
      const subtitle = 'S' + ep.seasonNumber.toString() + ' ' + 'E' + ep.episodeNumber.toString();
      const el = document.createElement('div');
      el.className = 'episode' + (i === seasonIndex ? ' active' : '');
      el.innerHTML = `<div style="font-weight:600">${ep.shortDescription}</div><div style="color:rgba(255,255,255,0.6);font-size:13px">${subtitle}</div>`;
      el.addEventListener('click', () => {
        episode = ep.episodeNumber;
        season = ep.seasonNumber;
        loadEpisode(contentData.episodes, ep.seasonNumber, ep.episodeNumber, 0, true);
        toggleDrawer(false);
      });
      episodesList.appendChild(el);
    });
  }

  /* ---- אלמנטים ---- */


  let seekDrag = false;

  /* ---- פונקציות עזר ---- */
  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const s = Math.floor(sec % 60);
    const m = Math.floor(sec / 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }


  /* ---- אירועים בסיסיים ---- */
  playPauseBtn.addEventListener('click', () => {
    if (video.paused) {
      video.play();
    }
    else { video.pause(); }
  });

  video.addEventListener('click', () => {
    if (video.paused) {
      playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
      video.play();
    }
    else {
      playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>'
      video.pause();
    }
  });

  // חזרה/קדימה 10 שניות
  back10Btn.addEventListener('click', () => { video.currentTime = Math.max(0, video.currentTime - 10); });
  forward10Btn.addEventListener('click', () => { video.currentTime = Math.min(video.duration || 0, video.currentTime + 10); });

  // עדכון סטטוס של tqdm
  video.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(video.duration);
    seekBar.max = video.duration || 0;
  });

  video.addEventListener('timeupdate', () => {
    if (!seekDrag) seekBar.value = video.currentTime;
    currentTimeEl.textContent = formatTime(video.currentTime);
  });

  // סרגל חיפוש (seek)
  seekBar.addEventListener('input', (e) => {
    currentTimeEl.textContent = formatTime(e.target.value);
  });
  seekBar.addEventListener('change', (e) => {
    video.currentTime = parseFloat(e.target.value);
  });
  seekBar.addEventListener('mousedown', () => seekDrag = true);
  seekBar.addEventListener('mouseup', () => seekDrag = false);

  // כפתור מסך מלא
  fullscreenBtn.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) { console.warn('Fullscreen error', err); }
  });

  // כפתור פרק הבא
  nextBtn.addEventListener('click', () => {
    const seasonIndex = contentData.episodes.filter(ep => ep.seasonNumber === season)
      .findIndex(ep => ep.episodeNumber === episode + 1);
    if (seasonIndex === -1) {
      season += 1;
      episode = 1;
    }
    else episode += 1
    loadEpisode(contentData.episodes, season, episode, 0, true);
    seasonNumberDrawer.textContent = 'עונה ' + season
    renderEpisodes();
  });

  // סיום הפרק — עוברים אוטומטית לפרק הבא
  video.addEventListener('ended', () => {
    const seasonIndex = contentData.episodes.filter(ep => ep.seasonNumber === season)
      .findIndex(ep => ep.episodeNumber === episode + 1);
    if (seasonIndex === -1) {
      season += 1;
      episode = 1;
    }
    else episode += 1
    loadEpisode(contentData.episodes, season, episode, 0, true);
    renderEpisodes();
  });

  document.getElementById("close-icon").addEventListener("click", e => {
    toggleDrawer(false);
  });

  seasonNumberDrawer.textContent = 'עונה ' + season

  function highlightActiveEpisode() {
    const items = episodesList.querySelectorAll('.episode');
    items.forEach((it, idx) => {
      it.classList.toggle('active', idx === currentIndex);
    });
  }

  function toggleDrawer(show) {
    drawer.classList.toggle('open', !!show);
    drawer.setAttribute('aria-hidden', !show);
    if (show) renderEpisodes();
  }

  openListBtn.addEventListener('click', () => {
    toggleDrawer(!drawer.classList.contains('open'));
  });

  /* ---- קיצורי מקלדת יעילים ---- */
  document.addEventListener('keydown', (e) => {
    // F - fullscreen, Space - play/pause, ArrowLeft/Right - jump 10s
    if (e.code === 'Space') {
      e.preventDefault();
      if (video.paused) video.play(); else video.pause();
    } else if (e.code === 'ArrowLeft') {
      video.currentTime = Math.max(0, video.currentTime - 10);
    } else if (e.code === 'ArrowRight') {
      video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
    } else if (e.key.toLowerCase() === 'f') {
      fullscreenBtn.click();
    }
  });

  function movieMode() {
    document.getElementById('openListBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('subtitle').style.display = 'none';
  }

  document.getElementById('backBtn').addEventListener('click' , () => {
    window.location.href = '/media-content/' + contentData._id;
  });

});