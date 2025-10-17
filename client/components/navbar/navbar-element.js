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

    initLogic() {
        const searchBtn = this.shadowRoot.querySelector('#search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                window.location.href = '/search';
            });
        }

        const logout = this.shadowRoot.querySelector('#logout-btn');
        if (logout) {
            logout.addEventListener('click', () => {
                window.location.href = '/login';
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