document.addEventListener('DOMContentLoaded', () => {
  // מערך ז׳אנרים וcast
  const cast = [];

  // Cast
  const castList = document.getElementById("castList");

  document.getElementById("addCast")?.addEventListener('click', () => {
    const name = document.getElementById("actorName").value.trim();
    const wiki = document.getElementById("actorWiki").value.trim();
    if (!name) return;

    cast.push({ name, wikipedia: wiki });
    document.getElementById("actorName").value = "";
    document.getElementById("actorWiki").value = "";
    renderCast();
  });

  function renderCast() {
    castList.innerHTML = "";
    cast.forEach((c, i) => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <div>${c.name} ${c.wikipedia ? `(<a href="${c.wikipedia}" target="_blank">ויקיפדיה</a>)` : ""}</div>
        <button class="btn btn-sm btn-outline-danger">×</button>
      `;
      li.querySelector("button").addEventListener('click', () => {
        cast.splice(i, 1);
        renderCast();
      });
      castList.appendChild(li);
    });
  }

  // Dropdown Genres
  document.querySelectorAll('.dropdown-menu input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('click', e => e.stopPropagation()); // למנוע סגירה
  });

  function getSelectedGenres() {
    return Array.from(document.querySelectorAll('.dropdown-menu input[type="checkbox"]:checked'))
      .map(c => c.value);
  }

  // Submit form - Build JSON
  const form = document.getElementById("contentForm");
  form.addEventListener('submit', e => {
    e.preventDefault(); // מונע refresh
    buildJSON();
  });

  function buildJSON() {
    const data = {
      name: document.getElementById("name").value,
      type: document.getElementById("type").value,
      year: Number(document.getElementById("year").value),
      photo: document.getElementById("photo").value,
      genres: getSelectedGenres(),
      description: document.getElementById("description").value,
      rating: Number(document.getElementById("rating").value),
      director: {
        name: document.getElementById("directorName").value,
        wikipedia: document.getElementById("directorWiki").value,
      },
      cast
    };

    document.getElementById("output").textContent = JSON.stringify(data, null, 2);
  }
});
