// profiles/profiles.js
document.querySelectorAll('.profiles-container .profile').forEach((el, idx) => {
  const id = String(idx + 1);
  const name = el.querySelector('.input')?.value?.trim() || `פרופיל ${id}`;

  // make the whole tile clickable
  el.style.cursor = 'pointer';

  el.addEventListener('click', () => {
    localStorage.setItem('selectedProfileId', id);
    localStorage.setItem('selectedProfileName', name);
    // go to the watch page
    window.location.href = '../watch/watch.html';
  });
});

// (Optional) handle the "add" tab if you want later
// document.querySelector('.add-tab')?.addEventListener('click', () => { ... });
