const profileId = Number(localStorage.getItem('editProfileId'));

const profileName = document.getElementById('profileName');
const profileImg = document.getElementById('profileImg');
const avatarOptions = document.querySelectorAll('.avatar-option');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');

let profile = null;

async function loadProfile() {
    if (!profileId) return; // new profile

    try {
        const res = await fetch(`/api/profiles/${profileId}`, {
            credentials: 'include', 
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Profile not found');
        profile = data;
        profileName.value = profile.name;
        profileImg.src = profile.photo;

        avatarOptions.forEach(img => {
            if (img.src.includes(profile.photo.split('/').pop())) img.classList.add('selected');
        });
    } catch (err) {
        alert('שגיאה בטעינת הפרופיל: ' + err.message);
        window.location.href = '/manage-profiles';
    }
}

avatarOptions.forEach(img => {
    img.addEventListener('click', () => {
        profileImg.src = img.src;
        avatarOptions.forEach(i => i.classList.remove('selected'));
        img.classList.add('selected');
    });
});

saveBtn.addEventListener('click', async () => {
    const name = profileName.value.trim();
    if (!name) return alert('לא ניתן להשאיר שם ריק.');

    const payload = { name, photo: profileImg.src };

    try {
        let res;
        if (profileId) {
            res = await fetch(`/api/profiles/${profileId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include', 
            });
        } else {
            res = await fetch(`/api/profiles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            });
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'שגיאה');

        alert(`הפרופיל "${data.name}" נשמר בהצלחה!`);
        window.location.href = '/manage-profiles';
    } catch (err) {
        alert('שגיאה בשמירה: ' + err.message);
    }
});

deleteBtn.addEventListener('click', async () => {
    if (!profileId) return;
    if (!confirm(`בטוח שאת רוצה למחוק את הפרופיל "${profile?.name || ''}"?`)) return;

    try {
        const res = await fetch(`/api/profiles/${profileId}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'שגיאה במחיקה');

        alert('הפרופיל נמחק בהצלחה!');
        window.location.href = '/manage-profiles';
    } catch (err) {
        alert('שגיאה במחיקה: ' + err.message);
    }
});

loadProfile();
