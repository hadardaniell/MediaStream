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
    await this.initLogic();
    this.dispatchEvent(new CustomEvent('component-ready', { bubbles: true }));
  }

  // initLogic() {
  //   let allProfiles = [];
  //   // document.addEventListener("DOMContentLoaded", async () => {
  //     const userId = localStorage.getItem("userId");
  //     if (!userId) {
  //       // window.location.href = "../login";
  //       // return;
  //     }

  //     const allProfiles = await fetch("http://localhost:3000/api/profiles?userId=" + userId, {
  //       method: "GET",
  //       headers: { "Content-Type": "application/json" },
  //     })
  //       .then(res => allProfiles = res.json())
  //       .catch(() => []);

  //     document.getElementById('profiles-container').innerHTML = allProfiles.map((profile) => {
  //       return `<div class="profile">
  //       <img src="${photo}" class="profile-img">
  //       <input type="text" class="form-control input" value="${profile.name}">
  //     </div>`;
  //     });

  //   // });
  //   // כל פרופיל הוא div עם class "profile"
  //   const profiles = this.shadowRoot.querySelectorAll('.profile');
  //   profiles.forEach(profile => {
  //     profile.addEventListener('click', () => {
  //       // אפשר לקחת את שם המשתמש מה־input שבתוך הפרופיל
  //       const nameInput = profile.querySelector('input');
  //       const profileName = nameInput ? nameInput.value : '';

  //       // ניווט ל־feed עם פרמטרים
  //       // history.pushState({}, '', `/feed?profile=${encodeURIComponent(profileName)}`);
  //       // loadPage('/feed');
  //       // navigateTo(`/feed?profile=${encodeURIComponent(profileName)}`);

  //       window.location.href = `/feed`;
  //     });
  //   });

  //   // לחיצה על כפתור ההוספה
  //   const addBtn = this.shadowRoot.querySelector('.add-container');
  //   if (addBtn) {
  //     addBtn.addEventListener('click', () => {
  //       alert('כאן נוסיף פרופיל חדש 😎');
  //     });
  //   }
  // }

  async initLogic() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      // window.location.href = "../login";
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/profiles?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch profiles');

      const allProfiles = await res.json();
      const container = this.shadowRoot.getElementById('profiles-container');

      // ממלאים את הפרופילים
      container.innerHTML = allProfiles.map(profile => `
      <div class="profile" data-id="${profile._id}">
        <img src="${profile.photo || 'client/assets/profiles-photos/mini.png'}" 
        class="profile-img" id="${profile._id}">
        <input type="text" class="form-control input" value="${profile.name}">
      </div>
    `).join('');

      const addContainer = document.createElement('div');
      addContainer.className = 'add-container';
      addContainer.innerHTML = `
      <div class="add-tab">
        <i class="bi bi-plus add-icon"></i>
      </div>
      <span>הוספה</span>
      `;
      container.appendChild(addContainer);

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
          alert('כאן נוסיף פרופיל חדש');
        });
      }
    } catch (err) {
      console.error("Error loading profiles:", err);
    }
  }

}

customElements.define('media-stream-profiles-bar', ProfilesBar);
