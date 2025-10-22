document.addEventListener("DOMContentLoaded", async () => {
  const path = window.location.pathname; // לדוגמה: "/media-content/123"

  // מפריד לפי '/' ומקבל את הפרמטר האחרון
  const mediaId = path.split('/').pop();

  if (!mediaId) {
    // console.error("Media ID is missing from the URL");
    // return;
  }

  const mockContent = {
    id: mediaId,
    title: "היפה והחיה",
    description: "הסרט הכי טוב בפעררר.",
    releaseYear: 1991,
    likes: 150,
    rank: 4.8,
    actors: [
      { name: "לין סינקלייר",
        wikiURL: "https://he.wikipedia.org/wiki/%D7%A8%D7%95%D7%91%D7%99_%D7%95%D7%99%D7%9C%D7%99%D7%90%D7%9E%D7%A1"
      },
      { name: "רובין ויליאמס",
        wikiURL: "https://he.wikipedia.org/wiki/%D7%A8%D7%95%D7%91%D7%99_%D7%95%D7%99%D7%9C%D7%99%D7%90%D7%9E%D7%A1"
       },
      { name: "ג'ולי אנדרוז",
        wikiURL: "https://he.wikipedia.org/wiki/%D7%A8%D7%95%D7%91%D7%99_%D7%95%D7%99%D7%9C%D7%99%D7%90%D7%9E%D7%A1"
       }
    ],
    lastWatched: null,
    liked: false
  }

  // renderContent(mockContent);

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
    <p><strong>לייקים:</strong> ${content.likes}</p>
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
