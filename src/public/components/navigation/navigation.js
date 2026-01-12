import router from "../../router.js";

export default class Navigation extends HTMLElement {
    constructor () {
        super();
        this.classList.add('navigation');

        this.buttonHome = document.createElement('button');
        this.buttonTest = document.createElement('button');
        this.buttonDatabase = document.createElement('button');

        this.buttonHome.textContent = "Inicio";
        this.buttonTest.textContent = "Escáner";
        this.buttonDatabase.textContent = 'DB';

        this.buttonHome.classList.add('navigation-button');
        this.buttonTest.classList.add('navigation-button');
        this.buttonDatabase.classList.add('navigation-button');

        this.buttonHome.addEventListener('click', () => {
            router.navigateTo('/');
        });

        this.buttonTest.addEventListener('click', () => {
            router.navigateTo('/scanner');
        });

        this.buttonDatabase.addEventListener('click', () => {
            router.navigateTo('/database');
        });

        this.append(this.buttonHome);
        // this.append(this.buttonTest);
        // this.append(this.buttonDatabase);
    };
};

customElements.define('app-navigation', Navigation);