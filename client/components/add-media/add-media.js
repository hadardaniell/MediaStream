let newMedia = null;

document.addEventListener('DOMContentLoaded', () => {
    let cast = [];
    let episodes = [];

    // הוספת שחקן
    document.getElementById("addActor").onclick = () => {
        const name = document.getElementById("actorName").value.trim();
        const wiki = document.getElementById("actorWiki").value.trim();
        if (!name) return alert("נא להזין שם שחקן");

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
            li.className = "list-group-item d-flex justify-content-between align-items-center actor-item";
            li.innerHTML = `
                <div>${c.name} ${c.wikipedia ? `<a href="${c.wikipedia}" target="_blank"> - ויקיפדיה </a>` : ""}</div>
                <button class="btn btn-sm btn-outline-danger btn-delete">×</button>
            `;
            li.querySelector("button").addEventListener('click', () => {
                cast.splice(i, 1);
                renderCast();
                updateActorRequired();
            });
            li.classList.add('fade-in');
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

    // Dropdown Genres
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

            // שדות פרקים לא חובה ומושבתים
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

        if (!episodeNumber || !seasonNumber || !videoFile) return alert("נא למלא את כל פרטי הפרק");

        episodes.push({ episodeNumber, seasonNumber, shortDescription, video: videoFile });

        // איפוס שדות
        episodeNumberField.value = "";
        seasonNumberField.value = "";
        document.getElementById("shortDescription").value = "";
        episodeVideoField.value = "";

        renderEpisodes();
        updateEpisodeRequired();
    };

    function renderEpisodes() {
        const list = document.getElementById("episodesList");
        list.innerHTML = "";
        episodes.forEach((ep, i) => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
                <div><b>עונה ${ep.seasonNumber}, פרק ${ep.episodeNumber}:</b> ${ep.shortDescription}</div>
                <button class="btn btn-sm btn-outline-danger btn-delete">×</button>
            `;
            li.querySelector("button").addEventListener("click", () => {
                episodes.splice(i, 1);
                renderEpisodes();
                updateEpisodeRequired();
            });
            list.appendChild(li);
        });
    }

    const form = document.getElementById("contentForm");
    form.addEventListener('submit', e => {
        e.preventDefault();

        // const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        // successModal.show();

        // בדיקה שדות genres
        const checkedGenres = document.querySelectorAll(".dropdown-menu input[type='checkbox']:checked");
        const dropdown = document.querySelector(".btn-genres");
        if (checkedGenres.length === 0) {
            dropdown.classList.add("is-invalid");
        } else {
            dropdown.classList.remove("is-invalid");
        }

        // עדכון שדות שחקנים
        updateActorRequired();

        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        buildJSON();
    });

    async function buildJSON() {
        const type = typeSelect.value;
        const name = document.getElementById("name").value;

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
            photo: '/client/assets/posters/' + document.getElementById("photoFile").files[0]?.name,
            video: type === 'movie' ? '/client/assets/movies/' + document.getElementById("videoFile").files[0]?.name
                : null,
            director: {
                name: document.getElementById("directorName").value,
                wikipedia: document.getElementById("directorWiki").value,
            },
            cast,
        };

        const data = type === 'series' ? { content, episodes: episodesValue } : content;

        const mediaPhotoFile = document.getElementById("photoFile").files[0];

        // document.getElementById("output").textContent = JSON.stringify(data, null, 2);

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
            // newMedia = result;
            console.log("נשלח בהצלחה:", result);
            alert("התוכן נוסף בהצלחה!");
            return result;
        } catch (err) {
            console.error("שגיאה בשליחה:", err);
            alert("שגיאה בשליחה לשרת");
            return null;
        }
    }

    async function upload(file, type = 'poster' | 'movie') {
        await fetch('http://localhost:3000/api/uploads/poster', {
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

document.getElementById('addAnotherContent').addEventListener('click', () => {
    window.location.href = '/add-media'
})

document.getElementById('toMediaContent').addEventListener('click', () => {
    window.location.href = '/media-content/' + newMedia._id //to check
})
