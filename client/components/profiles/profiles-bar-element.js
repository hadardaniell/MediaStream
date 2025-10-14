class ProfilesBar extends HTMLElement {
  static get observedAttributes() {
    return ['width']
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'width') {
      // מגדירים את ה-CSS variable על האלמנט עצמו
      this.style.setProperty('--profile-width', newValue);
    }
  }

  async connectedCallback() {
    // טוען את ה-HTML
    const html = await fetch('client/components/profiles/profiles.html').then(res => res.text());
    // טוען את ה-CSS
    const css = await fetch('client/components/profiles/profiles.css').then(res => res.text());

    // this.attachShadow({ mode: 'open' });

    const width = this.getAttribute('width');
    if (width) {
      this.style.setProperty('--profile-width', width);
    }

    this.shadowRoot.innerHTML = `
      <style>${css}</style>
      ${html}
    `;
  }
}

customElements.define('media-stream-profiles-bar', ProfilesBar);