import AppHeader from "../components/header.js";
import Navigation from "../components/navigation/navigation.js";
import alertsManager from "../modules/alerts.manager.js";
import router from "../router.js";
import GenericView from "./generic.view.js";
import pageViewStyle from "./styles/page.view.style.js";
import pageViewTemplate from "./templates/page.view.template.js";

export default class PageView extends GenericView {
    constructor () {
        super();
        this.view = document.createElement('view');
        this.view.classList.add('view');
        this.view.append(new Navigation());
        this.container = document.createElement('div');
        this.container.classList.add('container', 'page-view-container');
        this.view.append(this.container);
        this.header = new AppHeader('PÁGINA');
        this.container.append(this.header);
        this.content = document.createElement('div');
        this.content.classList.add('page-view-content');
        this.content.innerHTML = pageViewTemplate()+pageViewStyle();
        this.container.append(this.content);

        this.content.addEventListener('submit', (event) => {
            event.preventDefault();
            this.submit();
        });

        this.content.addEventListener('click', async (event) => {
            if (event.target.matches('#page-view-button')) {
                event.preventDefault();
                this.submit();
            };
        });
    };

    async submit () {
        try {
            const email = this.getInputEmail().value;
            const password = this.getInputPassword().value;
            if (!email || !password) throw new Error('Tenés que completar los campos.');

            const req = await fetch('/api/authentication', {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            const res = await req.json();
            if (!req.ok) throw new Error(res.error.message);
            localStorage.setItem('token', res.data);
        } catch (error) {
            console.error(error);
            alertsManager.createAlert(error.message, true);   
        };
    };

    getInputEmail () {
        return document.querySelector('#page-view-input-email');
    };

    getInputPassword () {
        return document.querySelector('#page-view-input-password');
    };

    getButton () {
        return document.querySelector('#page-view-button');
    };

    async init (meta) {
        if (this.isLogged()) return router.navigateTo('/page/manage');

        this.meta = meta;
        this.app.innerHTML = '';
        this.app.append(this.view); 
    };

    isLogged () {
        const token = localStorage.getItem('token');
        return token ? true : false;
    };
};