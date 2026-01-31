import Navigation from "../components/navigation/navigation.js";
import audioManager from "../modules/audio.manager.js";
import router from "../router.js";
import GenericView from "./GenericView.js";

export default class OrdersCreateView extends GenericView {
    constructor () {
        super();

        this.view = document.createElement('div');
        this.view.classList.add('view');

        this.view.append(new Navigation());

        this.container = document.createElement('div');
        this.container.classList.add('container', 'orders-create-container');
        this.view.append(this.container);

        this.container.innerHTML = `
            <div class="order-create-container-r1">
                <div class="order-create-container-c1">
                    <div class="order-create-info-container">
                        <select id="order-create-type" class="order-create-type">
                            <option value="major">MAYORISTA</option>
                            <option value="minor">MINORISTA</option>
                        </select>

                        <div class="order-create-customer-container">
                            <div 
                                id="order-create-customer" 
                                class="order-create-customer"
                            >CLIENTE SIN ASIGNAR</div>
                            <button id="order-create-customer-button" class="order-create-customer-button">
                                Buscar Cliente
                            </button>
                            <button 
                                id="order-create-button-customer-delete" 
                                class="order-create-customer-button"
                            >Eliminar Cliente</button>
                        </div>

                        <div class="order-create-payment-container">
                            <span class="order-create-payment-title">
                                Metodo de Pago
                            </span>
                            <select id="order-create-payment-method" class="order-create-payment-method">
                                <option value=null>Sin Asignar</option>
                                <option value="cash">Efectivo</option>
                                <option value="transfer">Transferencia</option>
                                <option value="card">Tarjeta</option>
                                <option value="current_account">Cuenta Corriente</option>
                            </select>
                        </div>
                    </div>
                    <div class="order-create-inputs-container">
                        <input 
                            type="text" 
                            placeholder="Código de Barras" 
                            id="order-create-input-barcode"
                            class="order-create-input-barcode" 
                        />
                        <button 
                            type="button" 
                            id="order-create-button-product-search"
                            class="order-create-button-product-search"
                        >Producto Manual</button>
                    </div>
                    <div class="order-create-total-container">
                        <span
                            id="order-create-total"
                            class="order-create-total"
                        >$0</span>
                    </div>

                    <div class="order-create-buttons-container">
                        <button
                            type="button"
                            id="order-create-button-create"
                            class="order-create-button order-create-button-create"
                        >Crear Orden</button>
                        <button
                            type="button"
                            id="order-create-button-reset"
                            class="order-create-button order-create-button-reset"
                        >Reiniciar</button>
                        <a
                            id="order-create-button-print"
                            class="order-create-button-print" 
                            target="_blank"
                        >Imprimir Última</a>
                    </div>
                </div>
                <div class="order-create-container-c2">
                    <table class="order-create-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Precio</th>
                                <th>Cantidad</th>
                                <th>Subtotal</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody
                            id="order-create-table-body"
                        ></tbody>
                    </table>
                </div>
            </div>
            <div id="order-create-container-r2" class="order-create-container-r2">
                <div
                    id="order-create-discounts-container"
                    class="order-create-discounts-container"
                ></div>

                <div
                    id="order-create-message-container"
                    class="order-create-message-container"
                ></div>
            </div>
        `;

        this.container.addEventListener('change', (event) => {
            if (event.target.matches('#order-create-type')) {
                const storage = JSON.parse(localStorage.getItem('order'));
                storage.type = document.querySelector('#order-create-type').value;
                localStorage.setItem('order', JSON.stringify(storage));

                this.check_discounts();
                this.draw();
            };

            if (event.target.matches('#order-create-payment-method')) {
                const storage = JSON.parse(localStorage.getItem('order'));
                storage.payment_method = document.querySelector('#order-create-payment-method').value;
                localStorage.setItem('order', JSON.stringify(storage));
            };

            if (event.target.matches('.order-create-input-quantity')) {
                const product_id = event.target.getAttribute('id');
                const value = event.target.value;

                const storage = JSON.parse(localStorage.getItem('order'));
                const index = storage.items.findIndex((p) => p.id === product_id);
                storage.items[index].quantity = Number(value);

                localStorage.setItem('order', JSON.stringify(storage));

                this.check_discounts();
                this.draw();
            };
        });

        this.container.addEventListener('click', async (event) => {
            if (event.target.matches('#order-create-button-customer-delete')) {
                const storage = JSON.parse(localStorage.getItem('order'));
                storage.customer = null;
                localStorage.setItem('order', JSON.stringify(storage));
                this.draw();
            };

            if (event.target.matches('#order-create-customer-button')) {
                router.navigateTo('/customers?to=order');
            };

            if (event.target.matches('#order-create-button-product-search')) {
                router.navigateTo('/products?to=order');
            };

            if (event.target.matches('#order-create-button-create')) {
                try {
                    const request = await fetch('/api/orders', {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: localStorage.getItem('order')
                    });
                    const response = await request.json();
                    if (!request.ok) throw new Error(response.error.message);

                    localStorage.setItem('last-order-id', response.data);

                    this.reset();
                    this.show_message("Orden creada correctamente.", false);
                } catch (error) {
                    console.error(error);
                    this.show_message(error.message, true);
                };
            };

            if (event.target.matches('#order-create-button-reset')) {
                this.reset();
            };

            if (event.target.matches('.order-create-button-delete')) {
                const id = event.target.getAttribute('id');
                const storage = JSON.parse(localStorage.getItem('order'));

                storage.items = storage.items.filter((p) => p.id !== id);
                storage.discounts = storage.discounts.filter((d) => d.product_id !== id);

                localStorage.setItem('order', JSON.stringify(storage));

                this.check_discounts();
                this.draw();
            };
        });

        this.container.addEventListener('keydown', async (event) => {
            if (event.target.matches('#order-create-input-barcode')) {                
                if (event.key === 'Enter') {
                    try {
                        const barcode = document.querySelector('#order-create-input-barcode').value;
                        if (!barcode || !barcode.trim()) return;

                        document.querySelector('#order-create-input-barcode').value = '';

                        const request = await fetch("/api/products?barcode="+barcode, {
                            method: "GET"
                        });

                        const response = await request.json();
                        if (!request.ok) throw new Error(response.error.message);

                        const product = response.data[0];
                        const storage = JSON.parse(localStorage.getItem('order'));
                        const index = storage.items.findIndex((p) => p.id === product.id);

                        if (index >= 0) {
                            storage.items[index].quantity += 1;
                        } else {
                            storage.items.push({
                                id: product.id,
                                quantity: 1,
                                price: 0,
                                data: product
                            });
                        };

                        localStorage.setItem('order', JSON.stringify(storage));
                        this.check_discounts();
                        this.draw();
                        audioManager.play('success');
                    } catch (error) {
                        console.error(error);
                        audioManager.play('error');
                    };
                };
            };
        });
    };

    reset () {
        localStorage.setItem('order', JSON.stringify({
            type: "major",
            payment_method: null,
            customer: null,
            items: [],
            discounts: []
        }));
        document.querySelector('#order-create-message-container').innerHTML = '';
        this.check_discounts();
        this.draw();
    };

    async init (url) {
        this.app.innerHTML = '';
        this.app.append(this.view);

        if (!localStorage.getItem('order')) {
            localStorage.setItem('order', JSON.stringify({
                type: "major",
                payment_method: null,
                customer: null,
                items: [],
                discounts: []
            }));
        };

        if (url.params) {
            if (url.params.product_id) {
                try {
                    const request = await fetch('/api/products?id='+url.params.product_id, { method: "GET" });
                    const response = await request.json();
                    if (!request.ok) throw new Error(response.error.message);

                    const product = response.data[0];
                    const storage = JSON.parse(localStorage.getItem('order'));
                    const index = storage.items.findIndex((p) => p.id === product.id);

                    if (index >= 0) {
                        storage.items[index].quantity += 1;
                    } else {
                        storage.items.push({
                            id: product.id,
                            quantity: 1,
                            price: 0,
                            data: product
                        });
                    };

                    localStorage.setItem('order', JSON.stringify(storage));
                    this.check_discounts();
                } catch (error) {
                    console.error(error);
                };
            };

            if (url.params.customer_id) {
                try {
                    const request = await fetch('/api/customers?id='+url.params.customer_id, { method: "GET" });
                    const response = await request.json();
                    if (!request.ok) throw new Error(response.error.message);
    
                    const customer = response.data[0];
                    const storage = JSON.parse(localStorage.getItem('order'));
    
                    storage.customer = customer;
    
                    localStorage.setItem('order', JSON.stringify(storage));
                    this.draw();
                } catch (error) {
                    console.error(error);
                };
            };
        };

        this.draw();
    };

    check_discounts () {
        const storage = JSON.parse(localStorage.getItem('order'));

        storage.discounts = [];

        if (storage.type === 'minor') {
            for (let i = 0; i < storage.items.length; i++) {
                const quantity = storage.items[i].quantity;
                const product = storage.items[i].data;

                let minor_price_id = null;
                let minor_price_condition = 0;
                let minor_price = product.price_minor;

                const minor_prices = product.minor_prices;
                for (let j = 0; j < minor_prices.length; j++) {
                    if (quantity >= minor_prices[j].condition_value) {
                        if (minor_price_condition < minor_prices[j].condition_value) {
                            minor_price_id = minor_prices[j].id;
                            minor_price_condition = minor_prices[j].condition_value;
                            minor_price = minor_prices[j].price_value;
                        };
                    };
                };
                if (minor_price_id) {
                    storage.discounts.push({
                        id: minor_price_id,
                        product_id: product.id
                    });

                    storage.items[i].price = minor_price;
                } else {
                    storage.items[i].price = product.price_minor;
                };
            };
        } else {
            storage.discounts = [];

            for (let i = 0; i < storage.items.length; i++) {
                storage.items[i].price = storage.items[i].data.price_major;
            };
        };

        localStorage.setItem('order', JSON.stringify(storage));
    };

    draw () {
        const storage = JSON.parse(localStorage.getItem('order'));
        storage.type ?
            document.querySelector('#order-create-type').value = storage.type :
            document.querySelector('#order-create-type').value = 'major';
        document.querySelector('#order-create-payment-method').value = storage.payment_method;

        storage.customer ?
            document.querySelector('#order-create-customer').textContent = storage.customer.name :
            document.querySelector('#order-create-customer').textContent = 'CLIENTE SIN ASIGNAR';

        document.querySelector('#order-create-table-body').innerHTML = '';
        
        for (let i = storage.items.length - 1; i >= 0; i--) {
            const product = storage.items[i].data;
            const price = storage.items[i].price;
            document.querySelector('#order-create-table-body').innerHTML += `
                <tr>
                    <td>${product.barcode}</td>
                    <td>${product.name}</td>
                    <td>${price / 100}</td>
                    <td>
                        <input 
                            type="number"
                            value=${storage.items[i].quantity}
                            placeholder="Cantidad"
                            id="${product.id}"
                            class="order-create-input-quantity"
                            min="0"
                        />
                    </td>
                    <td>${(storage.items[i].quantity * price) / 100}</td>
                    <td>
                        <button
                            id="${product.id}"
                            class="order-create-button-delete"
                            type="button"
                        >Eliminar</button>
                    </td>
                </tr>
            `;
        };

        document.querySelector('#order-create-discounts-container').innerHTML = '';
        for (let i = 0; i < storage.discounts.length; i++) {
            const item = storage.items.find((p) => p.id === storage.discounts[i].product_id);
            const product = item.data;
            const minor_price = product.minor_prices.find((m) => m.id === storage.discounts[i].id);
            document.querySelector('#order-create-discounts-container').innerHTML += `
                <span>Se aplica descuento: <b>${product.name}</b> | Cantidad mayor a <b>${minor_price.condition_value}</b></span>
            `;
        };

        document.querySelector('#order-create-total').textContent = '$'+this.calculate_total().toLocaleString('es-ES');
    
        const last_order_id = localStorage.getItem('last-order-id');
        last_order_id ?
            document.querySelector('#order-create-button-print').setAttribute('href', `/api/orders/receipt/${last_order_id}?action=print`) :
            document.querySelector('#order-create-button-print').removeAttribute('href');
    };  

    calculate_total () {
        const storage = JSON.parse(localStorage.getItem('order'));
        const items = storage.items;

        let amount = 0;
        for (let i = 0; i < items.length; i++) {
            amount += items[i].price * items[i].quantity;
        };
        return amount / 100;
    };

    show_message (message, error = false) {
        document.querySelector('#order-create-message-container').innerHTML = `
            <span 
                id="order-create-message" 
                class="order-create-message ${error ? 'order-create-message-error' : 'order-create-message-success'}"
            >${message}</span>
        `;
    };
};