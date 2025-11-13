document.addEventListener("DOMContentLoaded", async () => {
  const profileName = document.getElementById('profileName');
  const profileImg = document.getElementById('profileImg');
  const avatarOptions = document.querySelectorAll('.avatar-option');
  const saveBtn = document.getElementById('saveBtn');
  const deleteBtn = document.getElementById('deleteBtn');

  const infoModalEl = document.getElementById('infoModal');
  const infoModalBody = document.getElementById('infoModalBody');
  const infoModalOkBtn = document.getElementById('infoModalOkBtn');
  const confirmDeleteModalEl = document.getElementById('confirmDeleteModal');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  const infoModal = new bootstrap.Modal(infoModalEl);
  const confirmDeleteModal = new bootstrap.Modal(confirmDeleteModalEl);

  const showMessage = (text, callback = null) => {
    infoModalBody.textContent = text;
    infoModal.show();
    infoModalOkBtn.onclick = () => {
      infoModal.hide();
      if (callback) callback();
    };
  };

  const userId = localStorage.getItem("userId");
  if (!userId) {
    showMessage('משתמש לא מחובר', () => window.location.href = '/login');
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
    console.error('שגיאה בטעינת פרופילים');
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

  saveBtn.addEventListener('click', async () => {
    const name = profileName.value.trim();
    const photo = profileImg.getAttribute('src');
    if (!name) return showMessage('לא ניתן להשאיר שם ריק');

    try {
      let payload;
      let res;
      let successMessage = '';

      if (activeProfileId) {
        payload = { name, photo };
        res = await fetch(`/api/profiles/${activeProfileId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        successMessage = `!הפרופיל "${name}" נערך בהצלחה`;
      } else {
        payload = { name, photo, userId };
        res = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        successMessage = `!הפרופיל "${name}" נוצר בהצלחה`;
      }

      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        showMessage('שגיאה בשמירה');
        return;
      }

      showMessage(successMessage, () => window.history.back());

    } catch (err) {
      showMessage('שגיאה: ' + err.message);
    }
  });

  deleteBtn.addEventListener('click', () => {
    if (!activeProfileId) return showMessage('אין פרופיל למחיקה');
    confirmDeleteModal.show();
  });

  confirmDeleteBtn.addEventListener('click', async () => {
    confirmDeleteModal.hide();
    try {
      const res = await fetch(`/api/profiles/${activeProfileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה במחיקה');

      showMessage('!הפרופיל נמחק בהצלחה', () => {
        window.history.back();
      });
    } catch (err) {
      showMessage('שגיאה במחיקה: ' + err.message);
    }
  });
});
