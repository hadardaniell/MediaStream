//  let profiles = JSON.parse(localStorage.getItem('profiles')) || [];
// // let profiles = await fetch("http://localhost:3000/api/profiles", {
// //   credentials: "include",
// // }).then(res => res.json());
// let profileId = Number(localStorage.getItem('editProfileId'));

// let profile;
// if (profileId) {
//     profile = profiles.find(p => p.id === profileId);
//     if (!profile) {
//         alert('פרופיל לא נמצא!');
//         window.location.href = '/manage-profiles';
//     }
// } else {
//     // new profile
//     profile = { id: Date.now(), name: '', img: '/client/assets/mini.png' };
// }

// const profileName = document.getElementById('profileName');
// const profileImg = document.getElementById('profileImg');
// const avatarOptions = document.querySelectorAll('.avatar-option');
// const saveBtn = document.getElementById('saveBtn');
// const deleteBtn = document.getElementById('deleteBtn');

// profileName.value = profile.name;
// profileImg.src = profile.img;

// avatarOptions.forEach(img => {
//     if (img.src.includes(profile.img.split('/').pop())) img.classList.add('selected');

//     img.addEventListener('click', () => {
//         profileImg.src = img.src;
//         avatarOptions.forEach(i => i.classList.remove('selected'));
//         img.classList.add('selected');
//     });
// });

// saveBtn.addEventListener('click', () => {
//     const name = profileName.value.trim();
//     const existingNames = profiles
//         .filter(p => p.id !== profile.id)
//         .map(p => p.name.trim());

//     if (!name) {
//         alert('לא ניתן להשאיר שם ריק.');
//         return;
//     }

//     if (existingNames.includes(name)) {
//         alert('שם זה כבר קיים. אנא בחרי שם אחר.');
//         return;
//     }

//     profile.name = name;
//     profile.img = profileImg.src;

//     if (!profileId) {
//         profiles.push(profile);
//     }

//      localStorage.setItem('profiles', JSON.stringify(profiles));
//     // await fetch("http://localhost:3000/api/profiles", {
//     // method: "POST",
//     // headers: { "Content-Type": "application/json" },
//     // credentials: "include",
//     // body: JSON.stringify(profile),
//     // });

//     alert(`הפרופיל "${profile.name}" נשמר בהצלחה!`);
//     window.location.href = '/manage-profiles';
// });

// //need to chage
// deleteBtn.addEventListener('click', () => {
//     if (profileId && confirm(`בטוח שאת רוצה למחוק את הפרופיל "${profile.name}"?`)) {
//         profiles = profiles.filter(p => p.id !== profileId);
//         localStorage.setItem('profiles', JSON.stringify(profiles));
//         window.location.href = '/manage-profiles';
//     }
// });


// edit-profile.js

const profileId = localStorage.getItem('editProfileId'); // נשמר ב-manage-profiles
let profile = null;

const profileName = document.getElementById('profileName');
const profileImg = document.getElementById('profileImg');
const avatarOptions = document.querySelectorAll('.avatar-option');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');

// טעינת פרופיל מה־DB
async function loadProfile() {
    if (!profileId) {
        // פרופיל חדש
        profile = { name: '', photo: '/client/assets/mini.png' };
        renderProfile();
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/api/profiles/${profileId}`, {
            method: "GET",
            credentials: "include",
        });

        if (!res.ok) throw new Error("Profile not found");
        profile = await res.json();
        renderProfile();
    } catch (err) {
        console.error(err);
        alert("לא ניתן לטעון את הפרופיל");
        window.location.href = '/manage-profiles';
    }
}

// הצגת הפרופיל במסך
function renderProfile() {
    profileName.value = profile.name || '';
    profileImg.src = profile.photo || '/client/assets/mini.png';

    avatarOptions.forEach(img => {
        img.classList.toggle('selected', img.src.includes(profile.photo.split('/').pop()));

        img.addEventListener('click', () => {
            profileImg.src = img.src;
            avatarOptions.forEach(i => i.classList.remove('selected'));
            img.classList.add('selected');
        });
    });
}

// שמירת פרופיל ב־DB
saveBtn.addEventListener('click', async () => {
    const name = profileName.value.trim();
    if (!name) {
        alert('לא ניתן להשאיר שם ריק.');
        return;
    }

    profile.name = name;
    profile.photo = profileImg.src;

    try {
        let res;
        if (profileId) {
            // עדכון קיים
            res = await fetch(`http://localhost:3000/api/profiles/${profileId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(profile),
            });
        } else {
            // יצירת פרופיל חדש
            res = await fetch("http://localhost:3000/api/profiles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(profile),
            });
        }

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "שגיאה בשמירת הפרופיל");
        }

        alert(`הפרופיל "${profile.name}" נשמר בהצלחה!`);
        window.location.href = '/manage-profiles';
    } catch (err) {
        console.error(err);
        alert(`שגיאה בשמירת הפרופיל: ${err.message}`);
    }
});

// מחיקת פרופיל מה־DB
deleteBtn.addEventListener('click', async () => {
    if (!profileId) return;
    if (!confirm(`בטוח שאת רוצה למחוק את הפרופיל "${profile.name}"?`)) return;

    try {
        const res = await fetch(`http://localhost:3000/api/profiles/${profileId}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) throw new Error("שגיאה במחיקת הפרופיל");

        alert(`הפרופיל "${profile.name}" נמחק בהצלחה!`);
        window.location.href = '/manage-profiles';
    } catch (err) {
        console.error(err);
        alert(`שגיאה במחיקת הפרופיל: ${err.message}`);
    }
});

// קריאה ראשונית
loadProfile();
