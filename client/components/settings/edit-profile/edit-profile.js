let profiles = JSON.parse(localStorage.getItem('profiles')) || [];
let profileId = Number(localStorage.getItem('editProfileId'));

let profile;
if (profileId) {
    profile = profiles.find(p => p.id === profileId);
    if (!profile) {
        alert('פרופיל לא נמצא!');
        window.location.href = '../manage-profiles/manage-profiles.html';
    }
} else {
    // new profile
    profile = { id: Date.now(), name: '', img: '../assets/mini.png' };
}

const profileName = document.getElementById('profileName');
const profileImg = document.getElementById('profileImg');
const avatarOptions = document.querySelectorAll('.avatar-option');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');

profileName.value = profile.name;
profileImg.src = profile.img;

avatarOptions.forEach(img => {
    if (img.src.includes(profile.img.split('/').pop())) img.classList.add('selected');

    img.addEventListener('click', () => {
        profileImg.src = img.src;
        avatarOptions.forEach(i => i.classList.remove('selected'));
        img.classList.add('selected');
    });
});

saveBtn.addEventListener('click', () => {
    const name = profileName.value.trim();
    const existingNames = profiles
        .filter(p => p.id !== profile.id)
        .map(p => p.name.trim());

    if (!name) {
        alert('לא ניתן להשאיר שם ריק.');
        return;
    }

    if (existingNames.includes(name)) {
        alert('שם זה כבר קיים. אנא בחרי שם אחר.');
        return;
    }

    profile.name = name;
    profile.img = profileImg.src;

    if (!profileId) {
        profiles.push(profile);
    }

    localStorage.setItem('profiles', JSON.stringify(profiles));
    alert(`הפרופיל "${profile.name}" נשמר בהצלחה!`);
    window.location.href = '../manage-profiles/manage-profiles.html';
});

deleteBtn.addEventListener('click', () => {
    if (profileId && confirm(`בטוח שאת רוצה למחוק את הפרופיל "${profile.name}"?`)) {
        profiles = profiles.filter(p => p.id !== profileId);
        localStorage.setItem('profiles', JSON.stringify(profiles));
        window.location.href = '../manage-profiles/manage-profiles.html';
    }
});
