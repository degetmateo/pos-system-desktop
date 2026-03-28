import Navigation from "../components/navigation/navigation.js";
import alertsManager from "../modules/alerts.manager.js";
import GenericView from "./GenericView.js";
import optionsViewTemplate from "./templates/options.view.template.js";

export default class OptionsView extends GenericView {
    constructor () {
        super();
        this.view = document.createElement('div');
        this.view.classList.add('view', 'options-view');
        this.view.append(new Navigation());
        this.container = document.createElement('div');
        this.container.classList.add('container', 'options-view-container');
        this.view.append(this.container);
        this.container.innerHTML = optionsViewTemplate;

        this.container.addEventListener('click', async (event) => {
            if (event.target.matches('#lists-view-download-internal-list-button')) {
                try {
                    const request = await fetch('/api/lists/products-internal', { method: "GET" });
                    const blob = await request.blob();

                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    
                    a.href = url;
                    a.download = `LISTA_INTERNA_RD_${new Date().getTime()}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error(error);  
                };
            };

            if (event.target.matches('#lists-view-import-internal-list-button')) {
                document.querySelector('#internal-list-input').click();
            };

            if (event.target.matches('#lists-view-download-customers-list-button')) {
                try {
                    const request = await fetch('/api/lists/products-customers', { method: "GET" });
                    const blob = await request.blob();

                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');

                    a.href = url;
                    a.download = `LISTA_DE_PRECIOS_RUBEN_DARIO.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error(error);  
                };
            };

            if (event.target.matches('#options-view-export-db-button')) {
                document.getElementById('options-view-export-db-a').click();
            };
        });

        this.container.addEventListener('change', async (event) => {
            if (event.target.matches('#internal-list-input')) {
                try {
                    const data = new FormData();
                    data.append('excel', event.target.files[0]);
                    const request = await fetch('/api/lists/products-internal', {
                        method: "POST",
                        body: data
                    });
                    const response = await request.json();
                    if (!request.ok) throw new Error(response.error.message);
                    alertsManager.createAlert('Datos procesados correctamente.', false);
                } catch (error) {
                    console.error(error);
                    alertsManager.createAlert(error.message, true);
                };
            };
        });
    };

    async init (meta) {
        this.app.innerHTML = '';
        this.app.append(this.view);
    };
};