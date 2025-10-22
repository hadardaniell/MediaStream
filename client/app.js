// const routes = [
//   { path: '/login', file: '/login.html' },
//   { path: '/profiles', file: '/profiles.html' },
//   { path: '/feed', file: '/feed.html' },
// ];

// async function loadComponent(route, params = {}) {
//   // נתיב תקין ביחס ל־public
//   const res = await fetch('/components'+ route.path + route.file); 
//   if (!res.ok) {
//     console.error('Failed to load', route.file);
//     return;
//   }
//   const html = await res.text();
//   document.getElementById('app').innerHTML = html;

//   if (typeof window.initComponent === 'function') {
//     window.initComponent(params);
//     window.initComponent = null;
//   }
// }
