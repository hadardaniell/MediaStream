class Navbar extends HTMLElement {

    async connectedCallback() {
        const html = await fetch('client/components/navbar/navbar.html').then(res => res.text());
        const css = await fetch('client/components/navbar/navbar.css').then(res => res.text());

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
      <style>${css}</style>
      ${html}
    `;

        this.initLogic();
    }

    async initLogic() {
        this.shadowRoot.querySelector('.add-media-btn').style.display = 'none';
        let userData = null;
        await fetch("http://localhost:3000/api/auth/me", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        }).then(res => res.json()).then(data => {
            userData = data;
            userData.roles == 'admin' ?
                this.shadowRoot.querySelector('.add-media-btn').style.display = 'flex' :
                this.shadowRoot.querySelector('.add-media-btn').style.display = 'none';
        }
        ).catch(err => {
            console.error('Error fetching user data:', err);
        });

        const searchBtn = this.shadowRoot.querySelector('#search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                window.location.href = '/search';
            });
        }

        const logout = this.shadowRoot.querySelector('#logout-btn');
        if (logout) {
            logout.addEventListener('click', async () => {
                await fetch("http://localhost:3000/api/auth/logout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                }).then(res => {
                    if (!res.ok) throw new Error("Logout failed");
                    localStorage.removeItem("isAuthenticated");
                    localStorage.removeItem("userRole");
                    localStorage.removeItem("userEmail");
                    window.location.href = '/login';
                });
            });
        }

        const addMediaBtn = this.shadowRoot.querySelector('.add-media-btn');
        if (addMediaBtn) {
            addMediaBtn.addEventListener('click', () => {
                window.location.href = '/add-media';
            });
        }

        const dropdownToggle = this.shadowRoot.querySelector('.dropdown-toggle');
        const dropdownMenu = this.shadowRoot.querySelector('.dropdown-menu');

        dropdownToggle.addEventListener('click', (e) => {
            e.preventDefault();
            dropdownMenu.classList.toggle('show');
        });
    }
}

customElements.define('media-stream-navbar', Navbar);