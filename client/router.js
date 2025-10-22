// async function navigateTo(path) {
//   history.pushState({}, '', path);
//   await loadPage(path);
// }

// async function loadPage(path) {
//   try {
//     const res = await fetch(path);
//     const html = await res.text();
//     const container = document.getElementById('app');
//     container.innerHTML = html;
//   } catch (err) {
//     console.error('שגיאה בטעינת העמוד:', err);
//   }
// }

// window.addEventListener('popstate', () => {
//   loadPage(window.location.pathname);
// });

// document.addEventListener('DOMContentLoaded', () => {
//   loadPage(window.location.pathname);
// });
