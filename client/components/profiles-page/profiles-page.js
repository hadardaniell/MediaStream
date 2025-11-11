document.querySelectorAll('.profiles-container .profile').forEach((el, idx) => {
  const id = String(idx + 1);
  const name = el.querySelector('.input')?.value?.trim() || `פרופיל ${id}`;

  // make the whole tile clickable
  el.style.cursor = 'pointer';

  el.addEventListener('click', () => {
    localStorage.setItem('selectedProfileId', id);
    localStorage.setItem('selectedProfileName', name);
    window.location.href = '../watch/watch.html';
  });
});