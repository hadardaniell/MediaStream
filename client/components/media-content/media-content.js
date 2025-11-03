let activeSeason = 1;
let contentData = null;
let similarContentData = null;
let isLiked = false;
let activeProfileId = localStorage.getItem('activeProfileId');
let activeWatchData = null;

// add catch for all fetches

document.addEventListener("DOMContentLoaded", async () => {
  const path = window.location.pathname; // לדוגמה: "/media-content/123"

  // מפריד לפי '/' ומקבל את הפרמטר האחרון
  const mediaId = path.split('/').pop();

  if (!mediaId) {
    console.error("Media ID is missing from the URL");
    return;
  }

  await fetch('http://localhost:3000/api/content/' + mediaId + '?include=episodes').then(
    res => res.json()).then(data => {
      contentData = data;
    }).catch(err => {
    });

  await fetch('http://localhost:3000/api/content?genre=' + contentData.genres.join(',')).then(
    res => res.json()).then(data => {
      similarContentData = data.filter(content => content._id != contentData._id).slice(0, 5);
    }).catch(err => {
    });

  await fetch('http://localhost:3000/api/likes?profileId=' +
    activeProfileId + '&contentId=' +
    contentData._id).then(
      res => res.json()).then(data => {
        isLiked = data.length > 0;
      }).catch(err => {
      });

  await fetch('http://localhost:3000/api/watches/' +
    activeProfileId + '/' + contentData._id).then(
      res => res.json()).then(data => {
        activeWatchData = data;
      }).catch(err => {
      });


  renderContent(contentData);
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

  const detailsWrapper = document.createElement("div");
  detailsWrapper.className = "details-wrapper";
  info.appendChild(detailsWrapper);

  const title = document.createElement("h1");
  title.textContent = content.name;
  detailsWrapper.appendChild(title);

  const infoBar = document.createElement("div");
  infoBar.className = "info-bar";
  detailsWrapper.appendChild(infoBar);

  const year = document.createElement("b");
  year.textContent = content.year;
  infoBar.appendChild(year);

  const rating = document.createElement("b");
  rating.innerHTML = ` &middot ${content.rating}`;
  infoBar.appendChild(rating);

  const description = document.createElement("p");
  description.textContent = content.description;
  detailsWrapper.appendChild(description);

  const cast = document.createElement("div");
  cast.className = "info-bar";
  detailsWrapper.appendChild(cast);

  const castHeader = document.createElement("b");
  castHeader.textContent = "שחקנים: ";
  cast.appendChild(castHeader);

  content.cast.forEach(actor => {
    const actorLink = document.createElement("span");
    actorLink.textContent = actor.name;
    actorLink.style.marginLeft = "0.7em";
    actorLink.className = "actor-link clickable hovered";
    actorLink.addEventListener("click", () => {
      window.open(actor.wikipedia, "_blank");
    });

    cast.appendChild(actorLink);
  })

  detailsWrapper.appendChild(cast);

  const actions = document.createElement("div");
  actions.className = "action-buttons";
  info.appendChild(actions);

  const actionsWrapper = document.createElement("div");
  actionsWrapper.className = "actions-wrapper";
  actions.appendChild(actionsWrapper);

  const watchBtn = document.createElement("button");
  watchBtn.className = "watch-btn";
  watchBtn.addEventListener("click", () => {
    window.location.href = '/player/' + content._id;
  });
  if (activeWatchData && activeWatchData.status == 'in_progress') {
    switch (content.type) {
      case 'series':
        watchBtn.textContent = 'המשך צפייה ' + 'S' + activeWatchData.seasonNumber + ' E' + activeWatchData.episodeNumber;
        break;
      case 'movie':
        watchBtn.textContent = 'המשך צפייה';
        break;
    }
  }
  else if (activeWatchData && activeWatchData.status == 'completed') {
    watchBtn.textContent = "צפייה מחדש";
  }
  else {
    watchBtn.textContent = "צפו כעת";
  }
  actionsWrapper.appendChild(watchBtn);

  const likeBtn = document.createElement("button");
  likeBtn.className = isLiked ? "like-btn liked" : "like-btn";
  likeBtn.addEventListener("click", async () => {
    if (!isLiked) {
      await fetch('http://localhost:3000/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contentId: content._id, profileId: activeProfileId })
      });
      likeBtn.classList.add("liked");
      isLiked = true;
    }
    else {
      await fetch('http://localhost:3000/api/likes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contentId: content._id, profileId: activeProfileId })
      });

      likeBtn.classList.remove("liked");
      isLiked = false;
    }
  });
  actionsWrapper.appendChild(likeBtn);

  const likeIcon = document.createElement("i");
  likeIcon.className = "bi bi-hand-thumbs-up";
  likeBtn.appendChild(likeIcon);

      const startBtn = document.createElement("button");
  startBtn.className = 'start-btn';
  startBtn.addEventListener("click", () => {
    window.location.href = '/player/' + content._id + '?startFromBeginning=true';
  });
  actions.appendChild(startBtn);

  const startText = document.createElement("span");
  startText.textContent = 'צפייה מהתחלה ';
  startText.className = 'start-text';
  startBtn.appendChild(startText);

  const startIcon = document.createElement("i");
  startIcon.className = "bi bi-arrow-clockwise";
  startBtn.appendChild(startIcon);

  const poster = document.createElement("img");
  poster.className = "poster";
  poster.src = content.photo;
  contentDetails.appendChild(poster);

  const extraContentContainer = document.createElement("div");
  extraContentContainer.className = "extra-content-container";
  container.appendChild(extraContentContainer);

  const mediaNav = document.createElement("div");
  mediaNav.className = "media-nav";
  extraContentContainer.appendChild(mediaNav);

  if (content.episodes && content.episodes.length > 0) {
    const episodesBtn = document.createElement("h2")
    episodesBtn.id = "episodes-btn";
    episodesBtn.className = "clickable";
    episodesBtn.textContent = "פרקים";
    episodesBtn.addEventListener("click", () => {
      document.getElementById('episodes-nav').scrollIntoView({
        behavior: 'smooth'
      });
    });
    mediaNav.appendChild(episodesBtn);

    const seasonsNav = document.createElement("nav");
    seasonsNav.id = "episodes-nav";
    seasonsNav.className = "navbar navbar-light navbar-container";
    extraContentContainer.appendChild(seasonsNav);

    const seasonsNumbers = [...new Set(content.episodes.map((ep) => ep.seasonNumber))];

    const seasonsList = document.createElement("ul");
    seasonsList.className = "navbar-nav";
    seasonsNav.appendChild(seasonsList);

    seasonsNumbers.forEach((seasonNum) => {
      const seasonItem = document.createElement("li");
      seasonItem.className = "nav-item item";

      const seasonHeader = document.createElement("h3");
      seasonHeader.textContent = `עונה ${seasonNum}`;
      if (activeSeason === seasonNum) {
        seasonHeader.classList.add("active");
      }

      seasonItem.addEventListener("click", () => {
        activeSeason = seasonNum;

        seasonsList.querySelectorAll("h3").forEach(h => h.classList.remove("active"));
        seasonHeader.classList.add("active");

        const episodesPerSeason = content.episodes.filter(ep => ep.seasonNumber === seasonNum);

        const oldList = extraContentContainer.querySelector(".episode-list");
        const oldSimilar = document.getElementById('similar-content-section');
        if (oldList) oldList.remove();
        if (oldSimilar) oldSimilar.remove();

        extraContentContainer.appendChild(createEpisodesSection(episodesPerSeason));
        extraContentContainer.appendChild(createSimilarContentSection(similarContentData));
      });

      seasonItem.appendChild(seasonHeader);
      seasonsList.appendChild(seasonItem);
    });
    const defaultSeasonEpisodes = content.episodes.filter(ep => ep.seasonNumber === activeSeason);
    extraContentContainer.appendChild(createEpisodesSection(defaultSeasonEpisodes));
    const similarContentBtn = document.createElement("h2")
    similarContentBtn.id = "similar-content-btn";
    similarContentBtn.className = "clickable";
    similarContentBtn.textContent = "תכנים דומים";
    similarContentBtn.addEventListener("click", () => {
      document.getElementById('similar-content-section').scrollIntoView({
        behavior: 'smooth'
      });
    });
    mediaNav.appendChild(similarContentBtn);

  }
  extraContentContainer.appendChild(createSimilarContentSection(similarContentData));
}

createEpisodesSection = (episodes) => {
  const episodeList = document.createElement("div");
  episodeList.className = "episode-list";

  episodes.forEach(ep => {
    const episodeItem = document.createElement("div");
    episodeItem.className = "episode clickable";
    episodeItem.dataset.id = ep.id;

    const photo = document.createElement("img");
    photo.src = ep.photo;
    photo.className = 'episode-img';
    // photo.src = '/client/assets/beauty-and-the-beast-poster.jpg';
    episodeItem.appendChild(photo);

    const episodeInfo = document.createElement("div");
    episodeInfo.className = "episode-info";
    episodeItem.appendChild(episodeInfo);

    const episodeTitle = document.createElement("h2");
    episodeTitle.textContent = ep.shortDescription;
    episodeInfo.appendChild(episodeTitle);

    const episodeDescription = document.createElement("span");
    episodeDescription.textContent = 'S' + ep.seasonNumber + ' E' + ep.episodeNumber;
    episodeInfo.appendChild(episodeDescription);

    episodeList.appendChild(episodeItem);
  });

  return episodeList;
};

createSimilarContentSection = (similarContents) => {
  const similarContent = document.createElement("div");
  similarContent.className = "similar-content";
  similarContent.id = "similar-content-section";

  const similarContentHeader = document.createElement("h2");
  similarContentHeader.textContent = "תכנים דומים";
  similarContent.appendChild(similarContentHeader);

  const similarList = document.createElement("div");
  similarList.className = "similar-list";
  similarContent.appendChild(similarList);

  similarContentData.forEach(item => {
    const similarItem = document.createElement("div");
    similarItem.className = "similar-item clickable";
    similarItem.dataset.id = item._id;

    const similarImg = document.createElement("img");
    similarImg.className = "similar-img";
    similarImg.src = item.photo;
    similarItem.appendChild(similarImg);

    const similarTitle = document.createElement("h3");
    similarTitle.textContent = item.name;
    similarItem.appendChild(similarTitle);

    similarList.appendChild(similarItem);
  });

  return similarContent;
}

// document.querySelectorAll('.similar-item').forEach(item => {
//   item.addEventListener('click', () => {
//     const id = item.dataset.id; // לוקח את הערך מ-data-id
//     window.location.href = `/media-content/${id}`; // עובר ל-URL הרצוי
//   });
// });