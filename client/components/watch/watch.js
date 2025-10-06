// watch/watch.js
(function () {
  const name = localStorage.getItem('selectedProfileName');
  const id = localStorage.getItem('selectedProfileId');

  if (!name || !id) {
    // no profile chosen → go back to profiles
    window.location.href = '../profiles/profiles.html';
    return;
  }

  document.getElementById('greeting').textContent = `שלום, ${name}`;

  document.getElementById('logoutBtn').addEventListener('click', () => {
    // clear and go back to login
    localStorage.clear();
    window.location.href = '../login/login.html';
  });
})();
