// // example
// const userData = {
//   email: "hadass.alon@example.com",
//   username: "הדס אלון"
// };

// document.getElementById("email").textContent = userData.email;
// document.getElementById("username").textContent = userData.username;

// document.getElementById("logoutBtn").addEventListener("click", () => {
//   alert("התנתקת בהצלחה!");
//   window.location.href = "../login/login.html";
// });

// function goTo(page) {
//   switch (page) {
//     case "manage-account":
//       window.location.href = "/manage-account";
//       break;
//     case "manage-profiles":
//       window.location.href = "/manage-profiles";
//       break;
//     case "statistics":
//       window.location.href = "/statistics";
//       break;
//   }
// }

async function loadUserData() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/me", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) throw new Error("Failed to fetch user data");

    const userData = await res.json();

    if (!userData) {
      window.location.href = "../login/login.html";
      return;
    }

    document.getElementById("email").textContent = userData.email;
    document.getElementById("username").textContent = userData.name; 
  } catch (err) {
    console.error(err);
    alert("לא ניתן לטעון את פרטי המשתמש");
  }
}

loadUserData();

document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    const res = await fetch("http://localhost:3000/api/auth/logout", {
      method: "POST",
      credentials: "include"
    });

    if (!res.ok) throw new Error("Logout failed");

    alert("התנתקת בהצלחה!");
    window.location.href = "/login";
  } catch (err) {
    console.error(err);
    alert("אירעה שגיאה בהתנתקות");
  }
});

function goTo(page) {
  switch (page) {
    case "manage-account":
      window.location.href = "/manage-account";
      break;
    case "manage-profiles":
      window.location.href = "/manage-profiles";
      break;
    case "statistics":
      window.location.href = "/statistics";
      break;
  }
}
