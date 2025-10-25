document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // always stop native submit

    if (!form.checkValidity()) {
      form.classList.add("was-validated"); // show errors
      return; // <-- do NOT continue to redirect
    }

    // valid → mark auth and go to Feed
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem('userRole', 'admin');
    window.location.href = '/profiles';
  });
});
