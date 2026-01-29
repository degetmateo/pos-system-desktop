import Navigation from "../components/navigation/navigation.js";
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

        this.detailsContainer = document.createElement('div');
        this.detailsContainer.classList.add('order-view-details-container');
        this.container.append(this.detailsContainer);

        this.orderNumber = document.createElement('span');
        this.orderNumber.classList.add('order-view-order-number');
        this.orderNumber.textContent = 'Orden #5173';
        this.detailsContainer.append(this.orderNumber);

        this.orderAmount = document.createElement('span');
        this.orderAmount.classList.add('order-view-order-amount');
        this.orderAmount.textContent = '$9758';
        this.detailsContainer.append(this.orderAmount);

        this.orderType = document.createElement('span');
        this.orderType.classList.add('order-view-detail', 'order-view-order-type');
        this.orderType.textContent = 'Mayorista';
        this.detailsContainer.append(this.orderType);

        this.orderDate = document.createElement('span');
        this.orderDate.classList.add('order-view-detail', 'order-view-order-date');
        this.orderDate.textContent = '27/1/2026';
        this.detailsContainer.append(this.orderDate);

        this.orderStatus = document.createElement('span');
        this.orderStatus.textContent = 'Estado: Pendiente';
        this.detailsContainer.append(this.orderStatus);

        this.customerContainer = document.createElement('div');
        this.customerContainer.classList.add('order-view-customer-container');
        this.detailsContainer.append(this.customerContainer);

        this.customerTitle = document.createElement('div');
        this.customerTitle.classList.add('order-view-customer-title');
        this.customerTitle.innerHTML = `
            <span>Datos del Cliente</span>
        `;
        this.customerContainer.append(this.customerTitle);

        this.customerName = document.createElement('span');
        this.customerName.textContent = 'Nombre: Mateo';
        this.customerContainer.append(this.customerName);

        this.customerCuil = document.createElement('span');
        this.customerCuil.textContent = 'CUIL: 20446190211';
        this.customerContainer.append(this.customerCuil);

        this.customerEmail = document.createElement('span');
        this.customerEmail.textContent = 'Correo: degetmateo@gmail.com';
        this.customerContainer.append(this.customerEmail);

        this.customerPhone = document.createElement('span');
        this.customerPhone.textContent = 'Teléfono: 1130926776';
        this.customerContainer.append(this.customerPhone);

        this.itemsContainer = document.createElement('div');
        this.itemsContainer.classList.add('order-view-items-container');
        this.container.append(this.itemsContainer);

        this.table = document.createElement('table');
        this.table.classList.add('order-view-items-table');
        this.itemsContainer.append(this.table);

        this.tableHead = document.createElement('thead');
        this.tableHead.innerHTML = `
            <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Precio p/Unidad</th>
                <th>Subtotal</th>
            </tr>
        `;
        this.table.append(this.tableHead);

        this.tableBody = document.createElement('tbody');
        this.table.append(this.tableBody);

        this.buttonDownload = document.createElement('a');
        this.buttonDownload.textContent = 'Descargar';
        this.detailsContainer.append(this.buttonDownload);
    };

    async init (data) {
        this.app.innerHTML = '';
        this.app.append(this.view);

        const order = await this.fetch_order(data.id);

        this.buttonDownload.href = '/api/orders/receipt/'+order.id;
    };

    async fetch_order (id) {
        try {
            const request = await fetch('/api/orders?id='+id, { method: "GET" });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            return response.data[0];
        } catch (error) {
            console.error(error);
        };
    };
};