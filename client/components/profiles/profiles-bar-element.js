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

    await this.initLogic();
    this.dispatchEvent(new CustomEvent('component-ready', { bubbles: true }));
  }

  async initLogic() {
    const MaxProfiles = 5;
    const userId = localStorage.getItem("userId");
    const activeProfileId = localStorage.getItem('activeProfileId');
    if (!userId) {
      window.location.href = "../login";
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/profiles?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch profiles');

      const allProfiles = await res.json();
      const container = this.shadowRoot.getElementById('profiles-container');

      container.innerHTML = allProfiles.map(profile => `
      <div class="profile" data-id="${profile._id}">
        <img src="${profile.photo}" class="${activeProfileId == profile._id ? 'profile-img active-profile' : 'profile-img'}" 
        class="profile-img" id="${profile._id}">
        <div class="active-check"></div>
        <span class="profile-name">${profile.name}</span>
      </div>
    `).join('');

      if (allProfiles.length < 5) {
        const addContainer = document.createElement('div');
        addContainer.className = 'add-container';
        addContainer.innerHTML = `
      <div class="add-tab">
        <i class="bi bi-plus add-icon"></i>
      </div>
      <span>הוספה</span>
      `;
        container.appendChild(addContainer);
      }

      container.querySelectorAll('.input').forEach(input => {
        input.addEventListener('change', async (e) => {
          const newName = e.target.value.trim();
          const profileId = e.target.closest('.profile').dataset.id;

          if (!newName) return; // לא שולחים אם ריק

          try {
            const response = await fetch(`http://localhost:3000/api/profiles/${profileId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: newName })
            });
            if (!response.ok) throw new Error('Failed to update name');
            console.log('Name updated successfully');
          } catch (err) {
            console.error(err);
            alert('שגיאה בעדכון השם');
          }
        });
      });



      // מוסיפים מאזינים אחרי שהכנסנו את ה־HTML
      const profiles = this.shadowRoot.querySelectorAll('.profile-img');
      profiles.forEach(profile => {
        profile.addEventListener('click', () => {
          const id = profile.id;
          localStorage.setItem('activeProfileId', id);
          window.location.href = `/feed?profile=${encodeURIComponent(id)}`;
        });
      });

      const addBtn = this.shadowRoot.querySelector('.add-container');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          // מעבר לעמוד עריכת פרופיל
          localStorage.setItem('returnPage', window.location.pathname);
          window.location.href = '/edit-profile';
        });
      }

    } catch (err) {
      console.error("Error loading profiles:", err);
    }
  }

}

customElements.define('media-stream-profiles-bar', ProfilesBar);
