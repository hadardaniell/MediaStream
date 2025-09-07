document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");

    form.addEventListener("submit", (event) => {
        console.log('hi ')
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add("was-validated");

        localStorage.setItem("isLoggedIn", "true"); 
        window.location.href = "../feed.html"; // צריכה להוסיף פיד
    }, false);
});