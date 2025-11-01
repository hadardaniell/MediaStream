document.addEventListener('DOMContentLoaded', () => {
    // מערך ז׳אנרים וcast
    const cast = [];

    // Cast
    //   const castList = document.getElementById("castList");

    //   document.getElementById("addCast")?.addEventListener('click', () => {
    //     const name = document.getElementById("actorName").value.trim();
    //     const wiki = document.getElementById("actorWiki").value.trim();
    //     if (!name) return;

    //     cast.push({ name, wikipedia: wiki });
    //     document.getElementById("actorName").value = "";
    //     document.getElementById("actorWiki").value = "";
    //     renderCast();
    //   });

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
        <div>${c.name} ${c.wikipedia ? `<a href="${c.wikipedia}" target="_blank">ויקיפדיה</a>` : ""}</div>
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


    // Submit form - Build JSON
    const form = document.getElementById("contentForm");
    form.addEventListener('submit', e => {
        e.preventDefault(); // מונע refresh


        const selectedGenres = Array.from(
            document.querySelectorAll(".dropdown-menu input:checked")
        ).map((el) => el.value);

        buildJSON();
    });

    function buildJSON() {
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
            cast
        };

        document.getElementById("output").textContent = JSON.stringify(data, null, 2);

        fetch("http://localhost:3000/api/content", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(res => {
            if (!res.ok) throw new Error("שגיאה בבקשה");
            return res.json();
        })
        .then(result => {
            console.log("נשלח בהצלחה:", result);
            alert("✅ התוכן נוסף בהצלחה!");
        })
        .catch(err => {
            console.error("שגיאה בשליחה:", err);
            alert("❌ שגיאה בשליחה לשרת");
        });
    }
});
