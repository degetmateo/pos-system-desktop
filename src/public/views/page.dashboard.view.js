import AppHeader from "../components/header.js";
import Navigation from "../components/navigation/navigation.js";
import alertsManager from "../modules/alerts.manager.js";
import router from "../router.js";
import GenericView from "./generic.view.js";
import dashboardViewStyle from "./styles/dashboard.view.style.js";
import dashboardViewTemplate from "./templates/dashboard.view.template.js";

export default class PageDashboard extends GenericView {
    constructor () {
        super();
        this.view = document.createElement('view');
        this.view.classList.add('view');
        this.view.append(new Navigation());
        this.container = document.createElement('div');
        this.container.classList.add('container');
        this.view.append(this.container);
        this.header = new AppHeader('Dashboard');
        this.container.append(this.header);
        this.content = document.createElement('div');
        this.content.classList.add('dashboard-content');
        this.content.innerHTML = dashboardViewTemplate()+dashboardViewStyle();
        this.container.append(this.content);

        this.content.addEventListener('click', async (event) => {
            if (event.target.matches('#dashboard-button-logout')) {
                localStorage.clear('token');
                return router.navigateTo('/page');
            };

            if (event.target.matches('#dashboard-button-synchronize')) {
                try {
                    alertsManager.createAlert('Comenzando sincronización...', false);
                    const req = await fetch('/api/page/products/synchronize', {
                        method: "POST",
                        credentials: 'include',
                        headers: { "authorization": localStorage.getItem('token') }
                    });
                    const res = await req.json();
                    if (!req.ok) throw new Error(res.error.message);
                    alertsManager.createAlert('PRODUCTOS SINCRONIZADOS.', false, false);
                } catch (error) {
                    console.error(error);
                    alertsManager.createAlert(error.message, true);
                };
            };

            if (event.target.matches('#dashboard-button-desynchronize')) {
                try {
                    alertsManager.createAlert('DESINCRONIZANDO...', false);
                    const req = await fetch('/api/page/products/desynchronize', {
                        method: "POST",
                        credentials: 'include',
                        headers: { "authorization": localStorage.getItem('token') }
                    });
                    const res = await req.json();
                    if (!req.ok) throw new Error(res.error.message);
                    alertsManager.createAlert('DESINCRONIZACION COMPLETA.', false);
                } catch (error) {
                    console.error(error);
                    alertsManager.createAlert(error.message, true);
                };
            };
        });
    };

    async init (meta) {
        if (!this.isLogged()) return router.navigateTo('/page');
        this.meta = meta;
        this.app.innerHTML = '';
        this.app.append(this.view); 
    };

    isLogged () {
        const token = localStorage.getItem('token');
        return token ? true : false;
    };
};