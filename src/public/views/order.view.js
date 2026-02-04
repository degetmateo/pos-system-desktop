import Navigation from "../components/navigation/navigation.js";
import payments from "../static/payments.js";
import GenericView from "./GenericView.js";

export default class OrderView extends GenericView {
    constructor () {
        super();
        this.view = document.createElement('div');
        this.view.classList.add('view');
        this.view.append(new Navigation());
        this.container = document.createElement('div');
        this.container.classList.add('container', 'order-view-container');
        this.view.append(this.container);

        this.container.innerHTML = `
            <div class="order-view-details-container">
                <div class="order-view-info-container">
                    <span id="order-view-number"></span>
                    <span id="order-view-type"></span>
                    <span id="order-view-amount"></span>
                    <span id="order-view-advancement"></span>
                    <span id="order-view-final-amount"></span>
                    <span id="order-view-payment"></span>
                </div>
                <div class="order-view-customer-container">
                    <span id="order-view-customer-name"></span>
                    <span id="order-view-customer-cuil"></span>
                    <span id="order-view-customer-email"></span>
                    <span id="order-view-customer-phone"></span>
                    <span id="order-view-customer-address"></span>
                </div>
                <div class="order-view-buttons-container">
                    <a class="order-view-button" id="order-view-button-download">DESCARGAR</a>
                    <a class="order-view-button" target="_blank" id="order-view-button-print">IMPRIMIR</a>
                </div>
            </div>
            <div class="order-view-table-container">
                <table class="order-view-table">
                    <thead>
                        <tr>
                            <th>NOMBRE</th>
                            <th>CANTIDAD</th>
                            <th>PRECIO</th>
                            <th>SUBTOTAL</th>
                            <th>DESCUENTO</th>
                        </tr>
                    </thead>
                    <tbody id="order-view-table-body"></tbody>
                </table>
            </div>
        `;
    };

    async init (data) {
        this.app.innerHTML = '';
        this.app.append(this.view);
        const order = await this.fetch_order(data.id);
        this.draw(order);
    };

    async fetch_order (id) {
        try {
            const request = await fetch('/api/orders?id='+id, { method: "GET" });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            return response.data[0];
        } catch (error) {
            console.error(error);
            return null;
        };
    };

    draw (order) {
        const orderNumber = document.querySelector('#order-view-number');
        const orderType = document.querySelector('#order-view-type');
        const orderAmount = document.querySelector('#order-view-amount');
        const orderAdvancement = document.querySelector('#order-view-advancement');
        const orderFinalAmount = document.querySelector('#order-view-final-amount');
        const orderPayment = document.querySelector('#order-view-payment');

        orderNumber.innerHTML = `ÓRDEN <b>N° ${Number(order.number)}</b>`;
        orderType.innerHTML = `TIPO: <b>${order.type === 'major' ? 'MAYORISTA' : 'MINORISTA'}</b>`;
        orderAmount.innerHTML = `MONTO TOTAL: <b>$${(Number(order.total_price)/100).toLocaleString({ baseName:'es-ES' })}</b>`;
        orderAdvancement.innerHTML = `ADELANTO: <b>$${(Number(order.advancement)/100).toLocaleString({ baseName:'es-ES' })}</b>`;
        orderFinalAmount.innerHTML = `MONTO FINAL: <b>$${((Number(order.total_price) - Number(order.advancement)) / 100).toLocaleString({ baseName:'es-ES' })}</b>`;
        orderPayment.innerHTML = `MÉTODO DE PAGO: <b>${order.payment_method ? payments[order.payment_method] : 'SIN ASIGNAR'}</b>`;

        const customerName = document.querySelector('#order-view-customer-name');
        const customerCuil = document.querySelector('#order-view-customer-cuil');
        const customerEmail = document.querySelector('#order-view-customer-email');
        const customerPhone = document.querySelector('#order-view-customer-phone');
        const customerAddress = document.querySelector('#order-view-customer-address');

        if (order.customer) {
            customerName.innerHTML = `CLIENTE: <b>${order.customer.name || 'Desconocido'}</b>`;
            customerCuil.innerHTML = `CUIL/CUIT: <b>${order.customer.cuil || 'Desconocido'}</b>`;
            customerEmail.innerHTML = `EMAIL: <b>${order.customer.email || 'Desconocido'}</b>`;
            customerPhone.innerHTML = `TELÉFONO: <b>${order.customer.phone || 'Desconocido'}</b>`;
            customerAddress.innerHTML = `DIRECCIÓN: <b>${order.customer.address || 'Desconocido'}</b>`;
        };

        const buttonDownload = document.querySelector('#order-view-button-download');
        const buttonPrint = document.querySelector('#order-view-button-print');

        buttonDownload.href = `/api/orders/receipt/${order.id}?action=save`;
        buttonPrint.href = `/api/orders/receipt/${order.id}?action=print`;

        const table = document.querySelector('#order-view-table-body');
        table.innerHTML = '';

        for (const item of order.items) {
            const discount = order.discounts.find((d) => d.product_id === item.product_id);

            if (discount) {
                table.innerHTML += `
                    <tr>
                        <td>${item.product_name}</td>
                        <td>${item.quantity}</td>
                        <td>${(Number(item.price)/100).toLocaleString({ baseName:'es-ES' })}</td>
                        <td>${(Number(discount.discount_price * item.quantity)/100).toLocaleString({baseName:'es-ES'})}</td>
                        <td>${discount ? 'SÍ' : 'NO'}</td>
                    </tr>
                `;
            } else {
                table.innerHTML += `
                    <tr>
                        <td>${item.product_name}</td>
                        <td>${item.quantity}</td>
                        <td>${(Number(item.price)/100).toLocaleString({ baseName:'es-ES' })}</td>
                        <td>${(Number(item.price * item.quantity)/100).toLocaleString({baseName:'es-ES'})}</td>
                        <td>${discount ? 'SÍ' : 'NO'}</td>
                    </tr>
                `;
            };
        };
    };
};