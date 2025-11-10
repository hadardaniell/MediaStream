const activeProfileId = localStorage.getItem('activeProfileId');

document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("loader");
  const container = document.getElementById("container");

  if (!Boolean(localStorage.getItem("isAuthenticated"))) {
    window.location.href = "/login";
    return;
  }

  try {
    // מחכים שה־custom elements יטענו
    await Promise.all([
      waitForComponentReady('media-stream-navbar'),
      waitForComponentReady('media-stream-profiles-bar')
    ]);

    // Fetch תוכן
    const response = await fetch(`http://localhost:3000/api/content/profile/${activeProfileId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    const allContent = await response.json().catch(() => []);

    // Render תוכן
    renderSection("continue-watching", getContinueWatching(allContent));
    renderSection("recommended", getRecommendations(allContent));
    renderSection("popular", getPopular(allContent));
    renderNewByGenre(allContent);

  } catch (err) {
    console.error(err);
    // במקרה של שגיאה, עדיין מוסירים את הלודר
    loader.style.display = "none";
    container.style.display = "flex";
  }
  finally{
    loader.style.display = "none";
    container.style.display = "flex";
  }
});

// פונקציה שמחכה עד ש־custom element נטען
function waitForComponentReady(selector) {
  return new Promise(resolve => {
    const el = document.querySelector(selector);
    if (!el) return resolve();

    // אם כבר מוכן
    if (el.shadowRoot && el.shadowRoot.children.length > 0) return resolve();

    el.addEventListener('component-ready', () => resolve(), { once: true });
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


document.getElementById('.card')


// --- פונקציות כלליות ---
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSection(containerId, data) {
  if (!data || data.length === 0) return;

  const container = document.getElementById(containerId);
  container.innerHTML = "";

  // עטיפה חיצונית
  const section = document.createElement("div");
  section.className = "section-container";

  const carousel = document.createElement("div");
  carousel.className = "carousel";

  data.forEach((item) => carousel.appendChild(createCard(item)));

  // חצים
  const leftArrow = document.createElement("button");
  leftArrow.className = "nav-arrow right";
  leftArrow.innerHTML = "&#10094;";
  leftArrow.onclick = () => {
    carousel.scrollBy({ left: -240, behavior: "smooth" });
  };

  const rightArrow = document.createElement("button");
  rightArrow.className = "nav-arrow left";
  rightArrow.innerHTML = "&#10095;";
  rightArrow.onclick = () => {
    carousel.scrollBy({ left: 240, behavior: "smooth" });
  };

  section.appendChild(leftArrow);
  section.appendChild(rightArrow);
  section.appendChild(carousel);
  container.appendChild(section);

  setupCarouselArrows(`#${containerId} .section-container`);
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

/* --- Mock logic --- */

// המשך צפייה (לשימוש בעתיד עם API אמיתי)
function getContinueWatching(all) {
  const continueWatchingData = all.filter((content) => content.watch.status === "in_progress").slice(0, 6);
  if (continueWatchingData.length === 0) {
    document.getElementById("continue-watching-container").style.display = "none";
    return [];
  }
  return continueWatchingData;
}

// המלצות לפי דירוג
function getRecommendations(all) {
  const likedData = all.filter((x) => x.hasLike);
  if (likedData.length === 0) {
    return all.slice(0, 6);
  }
  const favGenres = all.filter((x) => x.hasLike).map(likedContent => likedContent.genres).flat();

  const freqMap = favGenres.reduce((acc, genre) => {
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});

  const sortedByFrequency = [...favGenres].sort((a, b) => {
    const diff = freqMap[b] - freqMap[a];
    if (diff !== 0) return diff;
    return a.localeCompare(b, 'he'); // במקרה של שוויון — לפי אלפבית
  });
  const recommended = all.filter((content) => {
    return content.hasLike === false && content.genres.some(g => sortedByFrequency.includes(g));
  }).slice(0, 6);
  return recommended;
}

// פופולריים
function getPopular(all) {
  return all.sort((a, b) => b.rating - a.rating).slice(0, 6);
}

// חדשים לפי ז'אנר
function renderNewByGenre(all) {
  const container = document.getElementById("newByGenre");
  container.innerHTML = "";

  const genreMap = {};
  all.forEach((item) => {
    item.genres.forEach((g) => {
      if (!genreMap[g]) genreMap[g] = [];
      genreMap[g].push(item);
    });
  });

  for (const [genre, items] of Object.entries(genreMap)) {
    const section = document.createElement("div");
    section.className = "mb-4";
    section.innerHTML = `<h2 class="section-title">${Genre[genre]}</h2>`;
    const row = document.createElement("div");
    row.className = "row g-3";
    items
      .sort((a, b) => b.year - a.year)
      .slice(0, 10)
      .forEach((i) => row.appendChild(createCard(i)));
    section.appendChild(row);
    container.appendChild(section);
  }
}


function setupCarouselArrows(sectionSelector) {
  const section = document.querySelector(sectionSelector);
  if (!section) return;

  const carousel = section.querySelector(".carousel");
  const leftArrow = section.querySelector(".nav-arrow.left");
  const rightArrow = section.querySelector(".nav-arrow.right");

  function checkOverflow() {
    const hasOverflow = carousel.scrollWidth > carousel.clientWidth;
    leftArrow.style.display = hasOverflow ? "block" : "none";
    rightArrow.style.display = hasOverflow ? "block" : "none";
  }

  // בדיקה בהתחלה
  checkOverflow();

  // בדיקה מחדש כשמשנים גודל חלון
  window.addEventListener("resize", checkOverflow);

  // לחצנים לגלילה
  leftArrow.addEventListener("click", () => {
    carousel.scrollBy({ left: -carousel.clientWidth / 1.5, behavior: "smooth" });
  });

  rightArrow.addEventListener("click", () => {
    carousel.scrollBy({ left: carousel.clientWidth / 1.5, behavior: "smooth" });
  });
}