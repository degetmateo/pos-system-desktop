import router from "../router.js";

export default class AppHeader extends HTMLElement {
    constructor (title) {
        super();
        this.classList.add('app-header');
        this.innerHTML = `
            <div id="app-header-button" class="app-header-button">
                <span class="app-header-button-text">◀</span>
            </div>

            <div class="app-header-title-container">
                <span id="app-header-title" class="app-header-title">${title}</span>
            </div>
        `;

        this.addEventListener('click', (event) => {
            if (event.target.matches('.app-header-button')) {
                return router.goBack();
            };

            if (event.target.matches('.app-header-button-text')) {
                return router.goBack();
            };
        });
    };

    setTitle (title) {
        document.querySelector('#app-header-title').textContent = title;
    };
};

customElements.define('app-header', AppHeader);