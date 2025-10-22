document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const mediaId = params.get("id");

  if (!mediaId) {
    console.error("Media ID is missing from the URL");
    return;
  }

//   try {
//     // שלב 2: פנייה לשרת כדי להביא את פרטי המדיה
//     const response = await fetch(`/api/content/${mediaId}`);
//     if (!response.ok) throw new Error("Failed to fetch content");

//     const content = await response.json();

//     // שלב 3: הצגת הפרטים על המסך
//     renderContent(content);

//   } catch (err) {
//     console.error("Error loading content:", err);
//   }
});

// פונקציה שמציגה את פרטי התוכן
function renderContent(content) {
  const container = document.getElementById("content-details");
  container.innerHTML = `
    <h1>${content.title}</h1>
    <p>${content.description}</p>
    <p><strong>שנת יציאה:</strong> ${content.releaseYear}</p>
    <p><strong>דירוג:</strong> ${content.rating}</p>
    <button id="play-btn">▶️ ${content.lastWatched ? 'המשך צפייה' : 'הפעל'}</button>
    <button id="restart-btn">↩️ מההתחלה</button>
    <button id="like-btn" class="${content.liked ? 'liked' : ''}">❤️ אהבתי</button>
    <h3>שחקנים:</h3>
    <ul>
      ${content.actors.map(actor => 
        `<li><a href="https://he.wikipedia.org/wiki/${encodeURIComponent(actor)}" target="_blank">${actor}</a></li>`
      ).join('')}
    </ul>
  `;
}
