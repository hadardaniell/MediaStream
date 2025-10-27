// example
const userData = {
  email: "hadass.alon@example.com",
  username: "הדס אלון"
};

document.getElementById("email").textContent = userData.email;
document.getElementById("username").textContent = userData.username;

document.getElementById("logoutBtn").addEventListener("click", () => {
  alert("התנתקת בהצלחה!");
  window.location.href = "../login/login.html";
});

function goTo(page) {
  switch (page) {
    case "manage-account":
      window.location.href = "../manage-account/manage-account.html";
      break;
    case "manage-profiles":
      window.location.href = "../manage-profiles/manage-profiles.html";
      break;
    case "statistics":
      window.location.href = "../statistics/statistics.html";
      break;
  }
}
