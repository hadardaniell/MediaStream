class ProfilesBar extends HTMLElement {
  static get observedAttributes() {
    return ['width'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'width') {
      this.style.setProperty('--profile-width', newValue);
    }
  }

  async connectedCallback() {
    const html = await fetch('client/components/profiles/profiles.html').then(res => res.text());
    const css = await fetch('client/components/profiles/profiles.css').then(res => res.text());

    const width = this.getAttribute('width');
    if (width) {
      this.style.setProperty('--profile-width', width);
    }

    this.shadowRoot.innerHTML = `
      <style>${css}</style>
      ${html}
    `;

    // אחרי שה־HTML נטען, מוסיפים האזנה ללחיצה
    this.initLogic();
  }

  initLogic() {
    // כל פרופיל הוא div עם class "profile"
    const profiles = this.shadowRoot.querySelectorAll('.profile');
    profiles.forEach(profile => {
      profile.addEventListener('click', () => {
        // אפשר לקחת את שם המשתמש מה־input שבתוך הפרופיל
        const nameInput = profile.querySelector('input');
        const profileName = nameInput ? nameInput.value : '';

        // ניווט ל־feed עם פרמטרים
        // history.pushState({}, '', `/feed?profile=${encodeURIComponent(profileName)}`);
        // loadPage('/feed');
        // navigateTo(`/feed?profile=${encodeURIComponent(profileName)}`);

        window.location.href = `/feed`;
      });
    });

    // לחיצה על כפתור ההוספה
    const addBtn = this.shadowRoot.querySelector('.add-container');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        alert('כאן נוסיף פרופיל חדש 😎');
      });
    }
  }
}

customElements.define('media-stream-profiles-bar', ProfilesBar);
