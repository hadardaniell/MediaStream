let activeSeason = 1;
let contentData = null;
let similarContentData = null;
let isLiked = false;
let activeProfileId = localStorage.getItem('activeProfileId');
let activeWatchData = null;

document.addEventListener("DOMContentLoaded", async () => {
  const path = window.location.pathname;

  const mediaId = path.split('/').pop();

  if (!mediaId) {
    window.location.href = '/feed?profile=' + activeProfileId;
    return;
  }

  try {
    await fetch('http://localhost:3000/api/content/' + mediaId + '?include=episodes').then(
      res => res.json()).then(data => {
        contentData = data;
      });

    await fetch('http://localhost:3000/api/content?genre=' + contentData.genres.join(',')).then(
      res => res.json()).then(data => {
        similarContentData = data.filter(content => content._id != contentData._id).slice(0, 5);
      });

    await fetch('http://localhost:3000/api/likes?profileId=' +
      activeProfileId + '&contentId=' +
      contentData._id).then(
        res => res.json()).then(data => {
          isLiked = data.length > 0;
        });

    await fetch('http://localhost:3000/api/watches/' +
      activeProfileId + '/' + contentData._id).then(
        res => res.json()).then(data => {
          activeWatchData = data;
        });
    renderContent(contentData);
  }
  catch {
    if (res.status === 404) activeWatchData = null;
  }
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
  let url = '/player/' + content._id;

  if (activeWatchData && activeWatchData.status == 'in_progress') {
    switch (content.type) {
      case 'series': {
        watchBtn.textContent = 'המשך צפייה ' + 'S' + activeWatchData.seasonNumber + ' E' + activeWatchData.episodeNumber;
        url += `?season=${activeWatchData.seasonNumber}&episode=${activeWatchData.episodeNumber}&progressSeconds=${activeWatchData.progressSeconds}`;
        break;
      }
      case 'movie': {
        if (activeWatchData && activeWatchData.status == 'in_progress') {
          watchBtn.textContent = 'המשך צפייה';
          url += '?progressSeconds=' + activeWatchData.progressSeconds;
        }
        break;
      }
    }
  }
  else if (activeWatchData && activeWatchData.status == 'completed') {
    watchBtn.textContent = "צפייה מחדש";
    url += '?startFromBeginning=true'
  }
  else {
    watchBtn.textContent = "צפו כעת";
    url += '?startFromBeginning=true'
  }

  watchBtn.addEventListener("click", () => {
    window.location.href = url;
  });
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
  likeIcon.className = "bi bi-hand-thumbs-up like-icon";
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

  if (activeWatchData && activeWatchData.status == 'completed') {
    startBtn.style.display = 'none';
  }

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

  const hr = document.createElement("hr");
  hr.className = "soft-divider";
  extraContentContainer.appendChild(hr);

  if (content.episodes && content.episodes.length > 0) {
    const episodesBtn = document.createElement("h2")
    episodesBtn.id = "episodes-btn";
    episodesBtn.className = "clickable hover-link";
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
    similarContentBtn.className = "clickable hover-link";
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
    photo.src = contentData.photo;
    photo.className = 'episode-img';
    episodeItem.appendChild(photo);
    episodeItem.addEventListener("click", () => {
      window.location.href = "/player/" + contentData._id + "?season=" + ep.seasonNumber + "&episode=" + ep.episodeNumber
    })

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
    similarItem.addEventListener("click", () => {
      window.location.href = "/media-content/" + item._id
    })

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

document.querySelector(".close-icon").addEventListener("click", () => {
  window.location.href = '/feed?profile=' + activeProfileId;
});