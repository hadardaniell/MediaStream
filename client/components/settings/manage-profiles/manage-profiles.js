const MAX_PROFILES = 5;
const container = document.getElementById('profilesContainer');

const activeProfileId = localStorage.getItem('activeProfileId');

window.addEventListener('pageshow', event => {
  if (event.persisted) {
    window.location.reload();
  }
});

async function loadProfiles() {
  try {
    const meRes = await fetch("http://localhost:3000/api/auth/me", {
      method: "GET",
      credentials: "include"
    });
    if (!meRes.ok) throw new Error("Failed to fetch current user");
    const user = await meRes.json(); // מחזיר object עם user._id וכו'

    const res = await fetch(`http://localhost:3000/api/profiles?userId=${user._id}`, {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) throw new Error("Failed to fetch profiles");
    const profiles = await res.json();
    return profiles;
  } catch (err) {
    console.error(err);
    alert("לא ניתן לטעון את הפרופילים");
    return [];
  }
}

async function renderProfiles() {
  const profiles = await loadProfiles();
  container.innerHTML = '';

  profiles.forEach(profile => {
    const div = document.createElement('div');
    div.className = 'profile';

    div.innerHTML = `
      <img class="profile-img" src="${profile.photo}" alt="profile">
      <span class="profile-name">${profile.name}</span>
      <i class="bi bi-pencil edit-btn" style="font-size: 1.1rem; margin-top: 0.4em; cursor: pointer;"></i>
    `;

    div.querySelector('.profile-img').addEventListener('click', () => {
      localStorage.setItem('selectedProfileId', profile._id);
      localStorage.setItem('selectedProfileName', profile.name);
      window.location.href = '/watch';
    });

    div.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.setItem('editProfileId', profile._id);
      window.location.href = '/edit-profile';
    });

    container.appendChild(div);
  });

  if (profiles.length < MAX_PROFILES) {
    const addDiv = document.createElement('div');
    addDiv.className = 'profile add-profile';
    addDiv.id = 'addProfileBtn';
    addDiv.innerHTML = `
      <div class="add-tab">
        <i class="bi bi-plus add-icon" aria-hidden="true"></i>
      </div>
      <span class="profile-name">הוספה</span>
      <i class="bi bi-pencil add-edit-icon" style="font-size: 1.1rem; margin-top: 0.4em;"></i>
    `;
    addDiv.addEventListener('click', () => {
      localStorage.removeItem('editProfileId');
      window.location.href = '/edit-profile';
    });
    container.appendChild(addDiv);
  }
}

function goTo(page) {
  switch (page) {
    case "feed":
      window.location.href = "/feed?profileId=" + activeProfileId;
      break;
    case "manage-account":
      window.location.href = "/manage-account";
      break;
    case "manage-profiles":
      window.location.href = "/manage-profiles";
      break;
    case "statistics":
      window.location.href = "/statistics";
      break;
  }
}

(async () => { 
  await renderProfiles(); 
})();
