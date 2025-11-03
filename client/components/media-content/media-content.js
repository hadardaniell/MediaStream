document.addEventListener("DOMContentLoaded", async () => {
  const path = window.location.pathname; // לדוגמה: "/media-content/123"

  // מפריד לפי '/' ומקבל את הפרמטר האחרון
  const mediaId = path.split('/').pop();

  if (!mediaId) {
    console.error("Media ID is missing from the URL");
    return;
  }

  fetch('http://localhost:3000/api/content/' + mediaId).then(res => res.json()).then(data => {
    renderContent(data);
  }).catch(err => {
    console.error("Error fetching media content:", err);
  });

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
  const container = document.getElementById("content-container");
  const contentDetails = document.createElement("div");
  contentDetails.className = "content-details";
  container.appendChild(contentDetails);

  const info = document.createElement("div");
  info.className = "info";
  contentDetails.appendChild(info);

  const title = document.createElement("h1");
  title.textContent = content.name;
  info.appendChild(title);

  const infoBar = document.createElement("div");
  infoBar.className = "info-bar";
  info.appendChild(infoBar);

  const year = document.createElement("b");
  year.textContent = content.year;
  infoBar.appendChild(year);

  const rating = document.createElement("b");
  rating.innerHTML = ` &middot ${content.rating}`;
  infoBar.appendChild(rating);

  const description = document.createElement("p");
  description.textContent = content.description;
  info.appendChild(description);

  const cast = document.createElement("div");
  cast.className = "info-bar";
  info.appendChild(cast);

  const castHeader = document.createElement("b");
  castHeader.textContent = "שחקנים: ";
  cast.appendChild(castHeader);

  content.cast.forEach(actor => {
    const actorLink = document.createElement("span");
    actorLink.textContent = actor.name;
    actorLink.className = "actor-link";
    actorLink.addEventListener("click", () => {
      window.open(actor.wikipedia, "_blank");
    });

    cast.appendChild(actorLink);
  })

  info.appendChild(cast);

  const actions = document.createElement("div");
  actions.className = "action-buttons";
  contentDetails.appendChild(actions);

  const watchBtn = document.createElement("button");
  watchBtn.className = "watch-btn";
  watchBtn.textContent = "צפו כעת";
  actions.appendChild(watchBtn);

  const likeBtn = document.createElement("button");
  likeBtn.className = "like-btn";
  actions.appendChild(likeBtn);

  const likeIcon = document.createElement("i");
  likeIcon.className = "bi bi-hand-thumbs-up";
  likeBtn.appendChild(likeIcon);

  const poster = document.createElement("img");
  poster.className = "poster";
  container.appendChild(poster);
}

document.getElementById('similar-content-btn').addEventListener('click', () => {
  document.getElementById('similar-content-section').scrollIntoView({
    behavior: 'smooth'
  });
});

document.getElementById('episodes-btn').addEventListener('click', () => {
  document.getElementById('episodes-nav').scrollIntoView({
    behavior: 'smooth'
  });
});

document.querySelectorAll('.similar-item').forEach(item => {
  item.addEventListener('click', () => {
    const id = item.dataset.id; // לוקח את הערך מ-data-id
    window.location.href = `/media-content/${id}`; // עובר ל-URL הרצוי
  });
});