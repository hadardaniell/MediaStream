document.addEventListener('DOMContentLoaded', () => {
    let cast = [];
    let episodes = [];
    let checkedGenres = false;

    // form.addEventListener('submit', e => {
    //     e.preventDefault();

    //     if (!form.checkValidity()) {
    //         form.classList.add('was-validated');
    //         return; // לא שולח אם לא תקין
    //     }

    //     buildJSON();
    // });

    document.getElementById("addActor").onclick = () => {
        const name = document.getElementById("actorName").value.trim();
        const wiki = document.getElementById("actorWiki").value.trim();
        if (!name) return alert("נא להזין שם שחקן");

        cast.push({ name, wikipedia: wiki || "" });
        document.getElementById("actorName").value = "";
        document.getElementById("actorWiki").value = "";
        renderCast();
    };

    function renderCast() {
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
            });
            castList.appendChild(li);
        });
    }

    // Dropdown Genres
    document.querySelectorAll('.dropdown-menu').forEach(cb => {
        cb.addEventListener('click', e => e.stopPropagation());
    });

    function getSelectedGenres() {
        return Array.from(document.querySelectorAll('.dropdown-menu input[type="checkbox"]:checked'))
            .map(c => c.value);
    }



    const typeSelect = document.getElementById("type");
    const episodesSection = document.getElementById("episodesSection");

    typeSelect.addEventListener("change", () => {
        if (typeSelect.value === "series") {
            episodesSection.style.display = "block";
        } else {
            episodesSection.style.display = "none";
            episodes.length = 0; // מנקה את המערך אם זה לא סדרה
            renderEpisodes();
        }
    });


    // Submit form - Build JSON
    const form = document.getElementById("contentForm");
    form.addEventListener('submit', e => {
        e.preventDefault(); // מונע refresh

        // const checkedGenres = document.querySelectorAll(
        //     ".dropdown-menu input[type='checkbox']:checked"
        // );

        // const dropdown = document.querySelector(".btn-genres");
        // if (checkedGenres.length === 0) {
        //     dropdown.classList.add("is-invalid");
        // } else {
        //     dropdown.classList.remove("is-invalid");
        // }

        // if (!form.checkValidity()) {
        //     form.classList.add('was-validated');
        //     return; // לא שולח אם לא תקין
        // }


        const selectedGenres = Array.from(
            document.querySelectorAll(".dropdown-menu input:checked")
        ).map((el) => el.value);

        buildJSON();
    });

    document.getElementById("addEpisode").onclick = () => {
        const episodeNumber = Number(document.getElementById("episodeNumber").value);
        const seasonNumber = Number(document.getElementById("seasonNumber").value);
        const shortDescription = document.getElementById("shortDescription").value.trim();
        const videoFile = document.getElementById("episodeVideo").files[0];

        if (!episodeNumber || !seasonNumber || !videoFile) return alert("נא למלא את כל פרטי הפרק");

        const episode = {
            episodeNumber,
            seasonNumber,
            shortDescription,
            video: '/videos/' + videoFile.name
        };

        episodes.push(episode);

        // איפוס שדות
        document.getElementById("episodeNumber").value = "";
        document.getElementById("seasonNumber").value = "";
        document.getElementById("shortDescription").value = "";
        document.getElementById("episodeVideo").value = "";

        renderEpisodes();
    };

    function renderEpisodes() {
        const list = document.getElementById("episodesList");
        list.innerHTML = "";
        episodes.forEach((ep, i) => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
        <div>
          <b>עונה ${ep.seasonNumber}, פרק ${ep.episodeNumber}:</b> ${ep.shortDescription}
        </div>
        <button class="btn btn-sm btn-outline-danger btn-delete">×</button>
      `;
            li.querySelector("button").addEventListener("click", () => {
                episodes.splice(i, 1);
                renderEpisodes();
            });
            list.appendChild(li);
        });
    }

    async function buildJSON() {
        const data = {
            name: document.getElementById("name").value,
            type: document.getElementById("type").value,
            year: Number(document.getElementById("year").value),
            genres: getSelectedGenres(),
            description: document.getElementById("description").value,
            rating: Number(document.getElementById("rating").value),
            photo: '/client/assets/posters' + document.getElementById("photoFile").files[0]?.name,
            video: '/client/assets/movies' + document.getElementById("videoFile").files[0]?.name,
            director: {
                name: document.getElementById("directorName").value,
                wikipedia: document.getElementById("directorWiki").value,
            },
            cast,
            // episodes: document.getElementById("type").value === "series" ? episodes : []
        };

        document.getElementById("output").textContent = JSON.stringify(data, null, 2);

        // await fetch("http://localhost:3000/api/content", {
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/json"
        //     },
        //     body: JSON.stringify(data)
        // })
        //     .then(res => {
        //         if (!res.ok) throw new Error("שגיאה בבקשה");
        //         return res.json();
        //     })
        //     .then(result => {
        //         console.log("נשלח בהצלחה:", result);
        //         alert(" התוכן נוסף בהצלחה!");
        //     })
        //     .catch(err => {
        //         console.error("שגיאה בשליחה:", err);
        //         alert("שגיאה בשליחה לשרת");
        //     });


        const formData = new FormData();
        formData.append('', document.getElementById("photoFile").files[0]);

        const fileInput = document.getElementById("photoFile"); // input[type="file"]
        // const file = fileInput.files[0];

        // const arrayBuffer = await file.arrayBuffer(); // המרה ל־binary

        await fetch('http://localhost:3000/api/uploads/poster', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'X-Filename': document.getElementById("photoFile").files[0].name
            },
            body: document.getElementById("photoFile").files[0]
        })
            .then(res => res.json())
            .then(data => console.log('Uploaded:', data))
            .catch(err => console.error(err));
    }
});

document.getElementById("disney-logo-btn").addEventListener("click", () => {
    window.location.href = "/feed?profileId=" + localStorage.getItem("activeProfileId");
});
