import Navigation from "../components/navigation/navigation.js";
import router from "../router.js";
import GenericView from "./GenericView.js";

export default class OrdersView extends GenericView {
    constructor () {
        super();

        this.offset = 0;
        this.continue = true;

        this.view = document.createElement('div');
        this.view.classList.add('view');

        this.view.append(new Navigation());

        this.container = document.createElement('div');
        this.container.classList.add('container', 'orders-view-container');
        this.view.append(this.container);

        this.tableContainer = document.createElement('div');
        this.tableContainer.classList.add('orders-view-table-container');
        this.container.append(this.tableContainer);

        this.table = document.createElement('table');
        this.table.classList.add('orders-view-table');
        this.tableContainer.append(this.table);

        this.head = document.createElement('thead');
        this.table.append(this.head);

        this.head.innerHTML = `
            <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Factura</th>
                <th>Estado</th>
            </tr>
        `;

        this.body = document.createElement('tbody');
        this.table.append(this.body);

        this.buttonsContainer = document.createElement('div');
        this.buttonsContainer.classList.add('orders-view-buttons-container');
        this.container.append(this.buttonsContainer);

        this.buttonPrevious = document.createElement('button');
        this.buttonPrevious.classList.add('orders-view-button');
        this.buttonPrevious.textContent = 'Anterior';
        this.buttonPrevious.type = 'button';
        this.buttonsContainer.append(this.buttonPrevious);

        this.buttonNext = document.createElement('button');
        this.buttonNext.classList.add('orders-view-button');
        this.buttonNext.textContent = 'Siguiente';
        this.buttonNext.type = 'button';
        this.buttonsContainer.append(this.buttonNext);

        this.buttonPrevious.addEventListener('click', (event) => {
            event.preventDefault();
            this.previous();
        });

        this.buttonNext.addEventListener('click', (event) => {
            event.preventDefault();
            this.next();
        });
    };

    async init () {
        this.app.innerHTML = '';
        this.app.append(this.view);

        this.clear_table();

        const orders = await this.fetch_orders();
        this.draw_orders(orders);
    };

    async fetch_orders () {
        try {
            const request = await fetch('/api/orders?offset='+this.offset, { method: "GET" });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            return response.data;
        } catch (error) {
            console.error(error);  
        };
    };

    clear_table () {
        this.body.innerHTML = '';
    };

    draw_orders (orders) {
        for (const order of orders) {
            const row = document.createElement('tr');

            row.classList.add('orders-view-row');

            const date = new Date(order.created_at);

            date.getDate();

            row.innerHTML = `
                <td>${order.number}</td>
                <td>${order.customer ? order.customer.name : 'SIN ASIGNAR'}</td>
                <td>${order.type === 'major' ? "MAYORISTA" : "MINORISTA"}</td>
                <td>${order.total_price / 100}</td>
                <td>${date.toLocaleDateString()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}</td>
                <td>
                    <a href="/api/orders/receipt/${order.id}">Descargar Factura</a>
                </td>
                <td>${order.status}</td>
            `;

            this.body.append(row);
        };
    };

    async previous () {
        if (this.offset <= 0) return;

        this.offset -= 20;
        this.continue = true;

        const orders = await this.fetch_orders();
        
        this.clear_table();
        this.draw_orders(orders);
    };

    async next () {
        if (!this.continue) return;

        this.offset += 20;

        const orders = await this.fetch_orders();

        if (!orders || orders.length <= 0) {
            this.continue = false;
            this.offset -= 20;
            return;
        };

        this.clear_table();
        this.draw_orders(orders);
    };
};