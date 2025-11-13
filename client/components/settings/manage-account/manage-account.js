document.addEventListener("DOMContentLoaded", () => {
  const infoModalEl = document.getElementById('infoModal');
  const infoModalBody = document.getElementById('infoModalBody');
  const infoModalOkBtn = document.getElementById('infoModalOkBtn');
  const infoModal = new bootstrap.Modal(infoModalEl);

  function showMessage(text, callback = null) {
    infoModalBody.textContent = text;
    infoModal.show();
    infoModalOkBtn.onclick = () => {
      infoModal.hide();
      if (callback) callback();
    };
  }

  const activeProfileId = localStorage.getItem('activeProfileId');

  async function loadUserData() {
    try {
      const res = await fetch("http://localhost:3000/api/auth/me", {
        method: "GET",
        credentials: "include"
      });

      if (!res.ok) throw new Error("Failed to fetch user data");

      const userData = await res.json();

      if (!userData) {
        showMessage('לא ניתן לטעון את פרטי המשתמש', () => window.location.href = "/feed");
        return;
      }

      if (userData.roles === "admin") {
        document.getElementById('admin').style.display = 'flex';
      }

      document.getElementById("email").textContent = userData.email;

    } catch (err) {
      console.error(err);
      showMessage('לא ניתן לטעון את פרטי המשתמש', () => window.location.href = "/feed");
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
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userId");
      localStorage.removeItem("activeProfileId");
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      showMessage('שגיאה ביציאה מהמערכת', () => window.location.href = "/feed");
    }
  });

  window.goTo = function (page) {
    switch (page) {
      case "feed":
        window.location.href = "/feed?profile=" + activeProfileId;
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
});
