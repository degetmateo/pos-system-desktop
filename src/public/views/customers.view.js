import Navigation from "../components/navigation/navigation.js";
import router from "../router.js";
import GenericView from "./GenericView.js";

export default class CustomersView extends GenericView {
    constructor () {
        super();
        this.view = document.createElement('view');
        this.view.classList.add('view');

        this.view.append(new Navigation());

        this.container = document.createElement('div');
        this.container.classList.add('container', 'customers-view-container');
        this.view.append(this.container);

        this.container.innerHTML = `
            <div 
                class="customers-view-filters-container"
            >
                <input
                    type="text"
                    placeholder="Filtrar por Nombre"
                    id="customers-view-name-filter"
                    class="customers-view-name-filter"
                />
            </div>

            <div
                class="customers-view-table-container"
            >
                <table
                    id="customers-view-table"
                    class="customers-view-table"
                >
                    <thead class="customers-view-table-head">
                        <tr class="customers-view-table-head-row">
                            <th>NOMBRE</th>
                            <th>CUIL/CUIT</th>
                            <th>CORREO ELECTRÓNICO</th>
                            <th>TELÉFONO</th>
                            <th>TIPO</th>
                        </tr>
                    </thead>
                    <tbody
                        id="customers-view-table-body"
                    >
                    
                    </tbody>
                </table>
            </div>

            <div
                class="customers-view-buttons-container"
            >
                <button
                    type="button"
                    id="customers-view-button-previous"
                    class="customers-view-button customers-view-button-previous"
                >Anterior</button>

                <button
                    type="button"
                    id="customers-view-button-next"
                    class="customers-view-button customers-view-button-next"
                >Siguiente</button>
            </div>
        `;

        this.offset = 0;
        this.continue = true;

        this.container.addEventListener('click', async (event) => {
            if (event.target.matches('#customers-view-button-previous')) {
                if (this.offset <= 0) return;

                this.offset -= 20;
                this.continue = true;

                const customers = await this.fetch_customers();
                this.draw_customers(customers);
            };

            if (event.target.matches('#customers-view-button-next')) {
                if (!this.continue) return;
                this.offset += 20;

                const customers = await this.fetch_customers();

                if (customers.length <= 0) {
                    this.continue = false;
                    this.offset -= 20;
                    return;
                };

                this.draw_customers(customers);
            };

            if (event.target.matches('.customers-view-table-row-td')) {
                const customer_id = event.target.getAttribute('id');
                if (this.to) {
                    switch (this.to) {
                        case 'order':
                            router.navigateTo('/new-order?customer_id='+customer_id);
                            return;
                    };
                } else {
                    router.navigateTo('/customers/'+customer_id);
                    return;
                };
            };
        });

        this.container.addEventListener('keypress', async (event) => {
            if (event.target.matches('#customers-view-name-filter')) {
                const value = event.target.value;
                const customers = await this.fetch_customers(value);
                this.draw_customers(customers);
            };
        });
    };

    async init (url) {
        this.app.innerHTML = '';
        this.app.append(this.view);
        
        this.to = null;
        this.clear()

        if (url.params) {
            if (url.params.to) this.to = url.params.to;
        };

        const customers = await this.fetch_customers();
        this.draw_customers(customers);
    };

    clear () {
        document.querySelector('#customers-view-table-body').innerHTML = '';
    };

    async fetch_customers (name) {
        try {
            const request = await fetch(`/api/customers?name=${name || ''}&offset=${this.offset}`, { method: "GET" });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            return response.data;
        } catch (error) {
            console.error(error);
            return [];  
        };
    };

    draw_customers (customers) {
        document.querySelector('#customers-view-table-body').innerHTML = '';

        for (const customer of customers) {
            let type = customer.default_order_type;

            if (type) {
                type === 'major' ? type = 'MAYORISTA' : type = 'MINORISTA';
            } else {
                type = 'SIN ASIGNAR';
            };

            document.querySelector('#customers-view-table-body').innerHTML += `
                <tr 
                    class="customers-view-table-row"
                >
                    <td id="${customer.id}" class="customers-view-table-row-td">${customer.name || ''}</td>
                    <td id="${customer.id}" class="customers-view-table-row-td">${customer.cuil||''}</td>
                    <td id="${customer.id}" class="customers-view-table-row-td">${customer.email||''}</td>
                    <td id="${customer.id}" class="customers-view-table-row-td">${customer.phone||''}</td>
                    <td id="${customer.id}" class="customers-view-table-row-td">${type}</td>
                </tr>
            `;
        };
    };
};