// profiles/profiles.js
// let allProfiles = [];
// document.addEventListener("DOMContentLoaded", async () => {
//   const userId = localStorage.getItem("userId");
//   if (!userId) {
//     // window.location.href = "../login";
//     // return;
//   }

//     const allProfiles = await fetch("http://localhost:3000/api/profiles?userId=" + userId, {
//     method: "GET",
//     headers: { "Content-Type": "application/json" },
//   })
//     .then(res => allProfiles = res.json())
//     .catch(() => []);

//     document.getElementById('profiles-container').innerHTML = allProfiles.map((profile) => {
//       return `<div class="profile">
//         <img src="${photo}" class="profile-img">
//         <input type="text" class="form-control input" value="${profile.name}">
//       </div>`;
//     });

// });

// document.querySelectorAll('.profiles-container .profile').forEach((el, idx) => {
//   const id = String(idx + 1);
//   const name = el.querySelector('.input')?.value?.trim() || `פרופיל ${id}`;

//   // make the whole tile clickable
//   el.style.cursor = 'pointer';

//   el.addEventListener('click', () => {
//     localStorage.setItem('selectedProfileId', id);
//     localStorage.setItem('selectedProfileName', name);
//     // go to the watch page
//     window.location.href = '../watch/watch.html';
//   });
// });

// (Optional) handle the "add" tab if you want later
// document.querySelector('.add-tab')?.addEventListener('click', () => { ... });
