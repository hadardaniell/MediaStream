let newMedia = null;
let type = '';

const isAuthenticated = localStorage.getItem('isAuthenticated');

document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated) {
        window.location.href = '/login';
    }
    let cast = [];
    let episodes = [];

    document.getElementById("addActor").onclick = () => {
        const nameInput = document.getElementById("actorName");
        const wikiInput = document.getElementById("actorWiki");
        const name = nameInput.value.trim();
        const wiki = wikiInput.value.trim();

        if (!name) {
            nameInput.classList.add("is-invalid");
            return;
        }

        if (!wiki) {
            wikiInput.classList.add("is-invalid");
            return;
        }

        wikiInput.classList.remove("is-invalid");
        nameInput.classList.remove("is-invalid");

        cast.push({ name, wikipedia: wiki || "" });
        document.getElementById("actorName").value = "";
        document.getElementById("actorWiki").value = "";
        renderCast();
        updateActorRequired();
    };

    function renderCast() {
        const castList = document.getElementById("castList");
        castList.innerHTML = "";

        cast.forEach((c, i) => {
            const li = document.createElement("li");
            li.className = "actor-item";
            li.innerHTML = `
            <div class="actor-info">
                <span class="actor-name">${c.name}</span>
                ${c.wikipedia ? `<a href="${c.wikipedia}" target="_blank" class="wiki-link">ויקיפדיה</a>` : ""}
            </div>
            <button class="btn-delete">
                <span>×</span>
            </button>
        `;

            li.querySelector(".btn-delete").addEventListener("click", () => {
                cast.splice(i, 1);
                renderCast();
                updateActorRequired();
            });

            li.classList.add("fade-in");
            castList.appendChild(li);
        });
    }


    function updateActorRequired() {
        const actorNameField = document.getElementById("actorName");
        const actorWikiField = document.getElementById("actorWiki");
        if (cast.length > 0) {
            actorNameField.removeAttribute('required');
            actorWikiField.removeAttribute('required');
        } else {
            actorNameField.setAttribute('required', '');
            actorWikiField.setAttribute('required', '');
        }
    }

    function updateEpisodeRequired() {
        const episodeNumberField = document.getElementById("episodeNumber");
        const seasonNumberField = document.getElementById("seasonNumber");
        const episodeVideoField = document.getElementById("episodeVideo");
        const shortDescriptionField = document.getElementById("shortDescription");

        if (episodes.length > 0) {
            episodeNumberField.removeAttribute('required');
            seasonNumberField.removeAttribute('required');
            episodeVideoField.removeAttribute('required');
            shortDescriptionField.removeAttribute('required');
        } else {
            episodeNumberField.setAttribute('required', '');
            seasonNumberField.setAttribute('required', '');
            episodeVideoField.setAttribute('required', '');
            episodeVideoField.setAttribute('required', '');
        }
    }

    document.querySelectorAll('.dropdown-menu').forEach(cb => cb.addEventListener('click', e => e.stopPropagation()));

    function getSelectedGenres() {
        return Array.from(document.querySelectorAll('.dropdown-menu input[type="checkbox"]:checked'))
            .map(c => c.value);
    }

    const typeSelect = document.getElementById("type");
    const episodesSection = document.getElementById("episodesSection");
    const episodeNumberField = document.getElementById("episodeNumber");
    const seasonNumberField = document.getElementById("seasonNumber");
    const episodeVideoField = document.getElementById("episodeVideo");
    const shortDescriptionField = document.getElementById("shortDescription");
    const videoField = document.getElementById("videoFile");
    const movie = document.getElementById("movie");

    typeSelect.addEventListener("change", () => {
        if (typeSelect.value === "series") {
            episodesSection.style.display = "block"

            videoField.removeAttribute('required');
            movie.style.display = "none";

            episodeNumberField.setAttribute('required', '');
            seasonNumberField.setAttribute('required', '');
            episodeVideoField.setAttribute('required', '');
            shortDescriptionField.setAttribute('required', '');

        } else {
            episodesSection.style.display = "none";
            episodes.length = 0;
            renderEpisodes();

            videoField.setAttribute('required', '');
            movie.style.display = "block";

            episodeNumberField.removeAttribute('required');
            seasonNumberField.removeAttribute('required');
            episodeVideoField.removeAttribute('required');
            shortDescriptionField.removeAttribute('required');

            episodeNumberField.value = "";
            seasonNumberField.value = "";
            episodeVideoField.value = "";
        }
    });


    document.getElementById("addEpisode").onclick = () => {
        const episodeNumber = Number(episodeNumberField.value);
        const seasonNumber = Number(seasonNumberField.value);
        const shortDescription = document.getElementById("shortDescription").value.trim();
        const videoFile = episodeVideoField.files[0];

        episodeNumberField.classList.remove("is-invalid");
        seasonNumberField.classList.remove("is-invalid");
        episodeVideoField.classList.remove("is-invalid");
        shortDescriptionField.classList.remove("is-invalid");

        let hasError = false;
        if (!episodeNumber) {
            episodeNumberField.classList.add("is-invalid");
            hasError = true;
        }
        if (!seasonNumber) {
            seasonNumberField.classList.add("is-invalid");
            hasError = true;
        }
        if (!videoFile) {
            episodeVideoField.classList.add("is-invalid");
            hasError = true;
        }
        if (!shortDescription) {
            shortDescriptionField.classList.add("is-invalid");
            hasError = true;
        }

        if (hasError) return;

        episodes.push({ episodeNumber, seasonNumber, shortDescription, video: videoFile });

        episodeNumberField.value = "";
        seasonNumberField.value = "";
        shortDescriptionField.value = "";
        episodeVideoField.value = "";

        renderEpisodes();
        updateEpisodeRequired();
    };

    function renderEpisodes() {
        const list = document.getElementById("episodesList");
        list.innerHTML = "";

        episodes.forEach((ep, i) => {
            const li = document.createElement("li");
            li.className = "episode-item";
            li.innerHTML = `
            <div class="episode-info">
                <div class="episode-title">
                    <span class="episode-number">עונה ${ep.seasonNumber}, פרק ${ep.episodeNumber}</span>
                </div>
                <p class="episode-desc">${ep.shortDescription}</p>
            </div>
            <button class="btn-delete">
                <span>×</span>
            </button>
        `;

            li.querySelector(".btn-delete").addEventListener("click", () => {
                episodes.splice(i, 1);
                renderEpisodes();
                updateEpisodeRequired();
            });

            li.classList.add("fade-in");
            list.appendChild(li);
        });
    }

    const form = document.getElementById("contentForm");
    form.addEventListener('submit', e => {
        e.preventDefault();

        const checkedGenres = document.querySelectorAll(".dropdown-menu input[type='checkbox']:checked");
        const dropdown = document.getElementById("genresDropdown");
        if (checkedGenres.length === 0) {
            dropdown.classList.add("is-invalid-genere-field");
            dropdown.classList.add("is-invalid");
        } else {
            dropdown.classList.remove("is-invalid-genere-field");
            dropdown.classList.remove("is-invalid");
        }

        updateActorRequired();

        if (!form.checkValidity() && checkedGenres.length === 0) {
            form.classList.add('was-validated');
            return;
        }

        buildJSON();
    });

    async function buildJSON() {
        type = typeSelect.value;
        const name = document.getElementById("name").value;

        const photoFile = document.getElementById("photoFile").files[0];
        const photoMatch = photoFile.name.match(/([^\\/]+)\.([^.]+)$/);

        let photoName = '';
        let videoName = '';

        if (photoMatch) {
            const [, name, ext] = photoMatch;
            photoName = safeName(name) + "." + ext.toLowerCase();
        }

        if(type != 'series'){
            const videoFile = document.getElementById("videoFile").files[0];
            const videoMatch = videoFile.name.match(/([^\\/]+)\.([^.]+)$/);
    
            if (videoMatch) {
                const [, name, ext] = videoMatch;
                videoName = safeName(name) + "." + ext.toLowerCase();
            }
        }

        const episodesValue = type === "series" ? episodes.map(ep => ({
            episodeNumber: ep.episodeNumber,
            seasonNumber: ep.seasonNumber,
            shortDescription: ep.shortDescription,
            video: '/client/assets/series/' + slugifyDir(name) + '/s' + ep.seasonNumber + 'e' + ep.episodeNumber + '.mp4'
        })) : [];

        let content = {
            name,
            type,
            year: Number(document.getElementById("year").value),
            genres: getSelectedGenres(),
            description: document.getElementById("description").value,
            photo: '/client/assets/posters/' + photoName,
            video: type === 'movie' ? '/client/assets/movies/' + videoName
                : null,
            director: {
                name: document.getElementById("directorName").value,
                wikipedia: document.getElementById("directorWiki").value,
            },
            cast,
        };

        const data = type === 'series' ? { content, episodes: episodesValue } : content;

        const mediaPhotoFile = document.getElementById("photoFile").files[0];

        const uploadedMedia = await addMedia(type, data);
        if (uploadedMedia) {
            await upload(mediaPhotoFile, 'poster');
            if (type === 'series') {
                episodesValue.forEach(ep => {
                    const episode = episodes.find(episode => ep.name === episode.name
                        && ep.seasonNumber === episode.seasonNumber
                        && ep.episodeNumber === episode.episodeNumber);
                    uploadEpisode(episode.video, name, ep.seasonNumber, ep.episodeNumber);
                })
            }
            else if (type === 'movie') {
                const movieFile = document.getElementById("videoFile").files[0];
                await upload(movieFile, 'movie');
            }
        }

        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        successModal.show();
    }

    document.getElementById("disney-logo-btn").addEventListener("click", () => {
        window.location.href = "/feed?profileId=" + localStorage.getItem("activeProfileId");
    });


    async function addMedia(type, data) {
        const requestURL = type === 'series' ? '/series-with-episodes' : '';
        try {
            const res = await fetch("http://localhost:3000/api/content" + requestURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error("שגיאה בבקשה");

            newMedia = await res.json();
            return newMedia;
        } catch (err) {
            console.error("שגיאה בשליחה:", err);
            return null;
        }
    }

    async function upload(file, type = 'poster' | 'movie') {
        await fetch('http://localhost:3000/api/uploads/' + type, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'X-Filename': file.name
            },
            body: file
        })
            .then(res => res.json())
            .then(data => console.log('Uploaded:', data))
            .catch(err => console.error(err));
    }

    async function uploadEpisode(file, seriesName, seasonNum, episodeNum) {
        await fetch('http://localhost:3000/api/uploads/episode', {
            method: 'POST',
            headers: {
                'X-Filename': file.name,
                'Content-Type': file.type || 'application/octet-stream',
                'X-Series-Name': seriesName,
                'X-Season': String(seasonNum),
                'X-Episode': String(episodeNum),
            },
            body: file,
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => console.log('Uploaded:', data))
            .catch(err => console.error(err));
    }

});

function slugifyDir(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'series';
}

function safeName(original) {
    return original.replace(/[^a-zA-Z0-9_\-]+/g, '_');
}

document.getElementById('addAnotherContent').addEventListener('click', () => {
    window.location.href = '/add-media'
})

document.getElementById('toMediaContent').addEventListener('click', () => {
    id = type === 'series' ? newMedia.content._id : newMedia._id;
    window.location.href = '/media-content/' + id; //to check
})
