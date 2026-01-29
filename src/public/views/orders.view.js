import Navigation from "../components/navigation/navigation.js";
import GenericView from "./GenericView.js";

export default class OrdersView extends GenericView {
    constructor () {
        super();

        this.view = document.createElement('div');
        this.view.classList.add('view');
        this.view.append(new Navigation());

        this.container = document.createElement('div');
        this.container.classList.add('container', 'orders-view-container');
        this.view.append(this.container);

        this.container.innerHTML = `
            <div 
                class="orders-view-table-container"
                style="
                    flex: 1;
                    width: 100%;
                    overflow-y: scroll;
                    height: calc(100vh - 80px);
                "
            >
                <table class="orders-view-table">
                    <thead>
                        <tr class="orders-view-table-head-row">
                            <th>NOMBRE</th>
                            <th>CLIENTE</th>
                            <th>TIPO</th>
                            <th>MONTO</th>
                            <th>FECHA</th>
                            <th>FACTURA</th>
                            <th>ESTADO</th>
                        </tr>
                    </thead>
                    <tbody id="orders-view-table-body"></tbody>
                </table>
            </div>

            <div class="orders-view-buttons-container">
                <button
                    type="button"
                    id="orders-view-button-previous"
                    class="orders-view-button"
                >Anterior</button>
                <button
                    type="button"
                    id="orders-view-button-next"
                    class="orders-view-button"
                >Siguiente</button>
            </div>
        `;

        this.container.addEventListener('click', (event) => {
            if (event.target.matches('#orders-view-button-previous')) {
                this.previous();
            };

            if (event.target.matches('#orders-view-button-next')) {
                this.next();
            };
        });

        this.offset = 0;
        this.continue = true;
    };

    async init () {
        this.app.innerHTML = '';
        this.app.append(this.view);
        this.draw_orders(await this.fetch_orders());
    };

    async fetch_orders () {
        try {
            const request = await fetch('/api/orders?offset='+this.offset, { method: "GET" });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            return response.data;
        } catch (error) {
            console.error(error);
            return [];
        };
    };

    clear () {
        document.querySelector('#orders-view-table-body').innerHTML = '';
    };

    draw_orders (orders) {
        this.clear();
        for (const order of orders) {
            const date = new Date(order.created_at);
            document.querySelector('#orders-view-table-body').innerHTML += `
                <tr>
                    <td id="${order.id}" class="order-view-table-row-td">${order.number}</td>
                    <td id="${order.id}" class="order-view-table-row-td">${order.customer ? order.customer.name : 'SIN ASIGNAR'}</td>
                    <td id="${order.id}" class="order-view-table-row-td">${order.type === 'major' ? "MAYORISTA" : "MINORISTA"}</td>
                    <td id="${order.id}" class="order-view-table-row-td">${order.total_price / 100}</td>
                    <td id="${order.id}" class="order-view-table-row-td">${date.toLocaleDateString()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}</td>
                    <td id="${order.id}" class="order-view-table-row-td">
                        <a href="/api/orders/receipt/${order.id}">Descargar Factura</a>
                    </td>
                    <td id="${order.id}" class="order-view-table-row-td">${order.status.toUpperCase()}</td>
                </tr>
            `;
        };
    };

    async previous () {
        if (this.offset <= 0) return;

        this.offset -= 20;
        this.continue = true;

        const orders = await this.fetch_orders();
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

        this.draw_orders(orders);
    };
};