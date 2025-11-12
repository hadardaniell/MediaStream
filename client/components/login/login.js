let loginMode = true;
document.addEventListener("DOMContentLoaded", () => {
   localStorage.setItem("isAuthenticated", false);
  const form = document.getElementById("login-form");

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // always stop native submit

    if (!form.checkValidity()) {
      form.classList.add("was-validated"); // show errors
      return; // <-- do NOT continue to redirect
    }

    // const loginRequest = await fetch("http://localhost:3000/api/auth/login", {})
    //   .then(res => res.json())
    //   .catch(() => []);

    // valid → mark auth and go to Feed
    // localStorage.setItem("isAuthenticated", "true");
    // localStorage.setItem('userRole', 'admin');
    // window.location.href = '/profiles';
  });


  document.getElementById("signin-mode").addEventListener("click", () => {
    if (loginMode) {
      document.getElementById("main-header").textContent = "הרשמו כדי להמשיך";
      document.getElementById("login-btn").textContent = "הרשמה";
      document.getElementById("question-login").textContent = "כבר יש לכם משתמש?";
      document.getElementById("signin-mode").textContent = "להתחברות לחצו";
    }
    else {
      document.getElementById("main-header").textContent = "התחברו כדי להמשיך";
      document.getElementById("login-btn").textContent = "התחבר";
      document.getElementById("question-login").textContent = "משתמש חדש?";
      document.getElementById("signin-mode").textContent = "להרשמה לחצו";
    }
    loginMode = !loginMode;
  });

  document.getElementById('login-btn').addEventListener('click', async () => {
    if (loginMode) {
      await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: document.getElementById("email").value,
          password: document.getElementById("password").value,
        }),
      }).then( async res => {
        if(res.status === 401) {
          $('#errorModalBody').text("אימייל או סיסמה שגויים");
          $('#errorModal').modal('show');
          return;
        }
        if (!res.ok) throw new Error("התחברות נכשלה");
        const data = await res.json();
        localStorage.setItem("isAuthenticated", true);
        localStorage.setItem('userRole', 'user');
        localStorage.setItem('userEmail', document.getElementById("email").value);
        localStorage.setItem('userId', data._id);
        window.location.href = '/profiles';
        return res.json();
      })
    }
    else {
      await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: document.getElementById("email").value,
          password: document.getElementById("password").value,
        }),
      }).then(res => {
        if (!res.ok) throw new Error("ההרשמה נכשלה");
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem('userRole', 'user');
        localStorage.setItem('userEmail', document.getElementById("email").value);
        window.location.href = '/profiles';
        return res.json();
      }
      );
    }
  })

});

