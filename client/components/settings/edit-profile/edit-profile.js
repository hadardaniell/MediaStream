document.addEventListener("DOMContentLoaded", async () => {
  const profileName = document.getElementById('profileName');
  const profileImg = document.getElementById('profileImg');
  const avatarOptions = document.querySelectorAll('.avatar-option');
  const saveBtn = document.getElementById('saveBtn');
  const deleteBtn = document.getElementById('deleteBtn');

  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert('משתמש לא מחובר');
    window.location.href = '/login';
    return;
  }

  const editProfileId = localStorage.getItem('editProfileId');
  let activeProfile = null;
  let activeProfileId = null;

  let userProfiles = [];
  try {
    const res = await fetch(`/api/profiles?userId=${userId}`, { credentials: 'include' });
    if (res.ok) userProfiles = await res.json();
  } catch (err) {
    console.error('שגיאה בטעינת פרופילים:', err);
  }

  if (editProfileId) {
    activeProfile = userProfiles.find(p => p._id === editProfileId);
  }

  if (activeProfile) {
    profileName.value = activeProfile.name;
    profileImg.src = activeProfile.photo;
    activeProfileId = activeProfile._id;
  } else {
    profileName.value = '';
    profileImg.src = '/client/assets/mini.png';
  }

  avatarOptions.forEach(img => {
    const relativePath = img.getAttribute('src');
    img.classList.toggle('selected', activeProfile && activeProfile.photo === relativePath);

    img.onclick = () => {
      profileImg.src = relativePath;
      avatarOptions.forEach(i => i.classList.remove('selected'));
      img.classList.add('selected');
    };
  });

  // שמירה
  saveBtn.addEventListener('click', async () => {
    const name = profileName.value.trim();
    const photo = profileImg.getAttribute('src');
    if (!name) return alert('לא ניתן להשאיר שם ריק.');

    let payload;
    let res;
    let successMessage = '';

    try {
      if (activeProfileId) {
        payload = { name, photo };
        res = await fetch(`/api/profiles/${activeProfileId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
      } else {
        payload = { name, photo, userId };
        res = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
      }

      let data = {};
      try { data = await res.json(); } catch (e) {}

      if (!res.ok) throw new Error(data.error || 'שגיאה בשמירה');
      window.history.back();

    } catch (err) {
      alert('שגיאה: ' + err.message);
    }
  });

  // מחיקה
  deleteBtn.addEventListener('click', async () => {
    if (!activeProfileId) return alert('אין פרופיל למחיקה.');
    if (!confirm('בטוח שברצונך למחוק את הפרופיל?')) return;

    try {
      const res = await fetch(`/api/profiles/${activeProfileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      let data = {};
      try { data = await res.json(); } catch (e) {}

      if (!res.ok) throw new Error(data.error || 'שגיאה במחיקה');

      alert('הפרופיל נמחק בהצלחה!');
      window.location.href = '/manage-profiles';

    } catch (err) {
      alert('שגיאה במחיקה: ' + err.message);
    }
  });
});
