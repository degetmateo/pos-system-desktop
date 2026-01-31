import Navigation from "../components/navigation/navigation.js";
import GenericView from "./GenericView.js";

export default class ListsView extends GenericView {
    constructor () {
        super();
        this.view = document.createElement('div');
        this.view.classList.add('view');
        this.view.append(new Navigation());
        this.container = document.createElement('div');
        this.container.classList.add('container', 'lists-view-container');
        this.view.append(this.container);

        this.container.innerHTML = `
            <input type="file" accept=".xlsx, .xls" id="internal-list-input" hidden="true" style="display:none;" />

            <div class="lists-view-buttons-container">
                <button
                    id="lists-view-download-internal-list-button"
                    class="lists-view-button"
                    type="button"
                >EXPORTAR LISTA INTERNA</button>

                <button
                    id="lists-view-import-internal-list-button"
                    class="lists-view-button"
                    type="button"
                >IMPORTAR LISTA INTERNA</button>

                <button
                    id="lists-view-download-customers-list-button"
                    class="lists-view-button"
                    type="button"
                >EXPORTAR LISTA PARA CLIENTES</button>
            </div>
        `;

        this.container.addEventListener('click', async (event) => {
            if (event.target.matches('#lists-view-download-internal-list-button')) {
                try {
                    const request = await fetch('/api/lists/products-internal', { method: "GET" });
                    const blob = await request.blob();

                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');

                    a.href = url;
                    a.download = `rd_lista_interna_${new Date().getTime()}.xlsx`;
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
                    a.download = `LIBRERIA_RUBEN_DARIO.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error(error);  
                };
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
                    console.log('Datos de planilla procesados.');
                } catch (error) {
                    console.error(error);  
                };
            };
        });
    };

    async init () {
        this.app.innerHTML = '';
        this.app.append(this.view);
    };
};