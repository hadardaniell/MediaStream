const MAX_PROFILES = 5;
const container = document.getElementById('profilesContainer');
const addBtn = document.getElementById('addProfileBtn'); 

function loadProfiles() {
  const data = localStorage.getItem('profiles');
  return data ? JSON.parse(data) : [];
}

function renderProfiles() {
  const profiles = loadProfiles();
  container.innerHTML = ''; 

  // build profile
  profiles.forEach(profile => {
    const div = document.createElement('div');
    div.className = 'profile';

    div.innerHTML = `
      <img class="profile-img" src="${profile.img}" alt="profile">
      <span class="profile-name">${profile.name}</span>
      <i class="bi bi-pencil edit-btn" style="font-size: 1.1rem; margin-top: 0.4em; cursor: pointer;"></i>
    `;

    div.querySelector('.profile-img').addEventListener('click', () => {
      localStorage.setItem('selectedProfileId', profile.id);
      localStorage.setItem('selectedProfileName', profile.name);
      window.location.href = '../watch/watch.html';
    });

    div.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.setItem('editProfileId', profile.id);
      window.location.href = '../edit-profile/edit-profile.html';
    });

    container.appendChild(div);
  });

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
    window.location.href = '../edit-profile/edit-profile.html';
  });

  if (profiles.length < MAX_PROFILES) {
    container.appendChild(addDiv);
  }
}

renderProfiles();


function goTo(page) {
  switch (page) {
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
