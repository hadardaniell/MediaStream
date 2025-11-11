let userData = null;

const activeProfileId = localStorage.getItem('activeProfileId');

async function loadUserData() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/me", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) throw new Error("Failed to fetch user data");

    userData = await res.json();


    if (!userData) {
      window.location.href = "/login";
      return;
    }


    if (userData.roles === "admin") {
      document.getElementById('admin').style.display = 'flex';
    }

    document.getElementById("email").textContent = userData.email;
    // document.getElementById("username").textContent = userData.name;
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

    window.location.href = "/login";
  } catch (err) {
    console.error(err);
  }
});

function goTo(page) {
  switch (page) {
    case "feed":
      window.location.href = "/feed?profileId=" + activeProfileId;
      break;
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
