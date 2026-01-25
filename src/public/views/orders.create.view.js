import Navigation from "../components/navigation/navigation.js";
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

        this.formContainer = document.createElement('div');
        this.formContainer.classList.add('orders-create-form-container');
        this.container.append(this.formContainer);

        this.form = document.createElement('form');
        this.form.classList.add('orders-create-form');
        this.formContainer.append(this.form);

        this.selectType = document.createElement('select');
        this.form.append(this.selectType);

        this.selectType.innerHTML = `
            <option value="major">Mayorista</option>
            <option value="minor">Minorista</option>
        `;

        this.selectCustomer = document.createElement('select');
        this.form.append(this.selectCustomer);

        this.selectCustomer.innerHTML = `
            <option value="none">Sin asignar</option>
        `;

        this.barcode = document.createElement('input');
        this.barcode.type = 'text';
        this.barcode.placeholder = 'Código de Barras';
        this.form.append(this.barcode);

        this.priceContainer = document.createElement('div');
        this.priceContainer.classList.add('orders-create-price-container');
        this.form.append(this.priceContainer);

        this.price = document.createElement('span');
        this.price.classList.add('orders-create-price');
        this.price.innerHTML = `
            <span>$</span>
            <span>0</span>
        `;
        this.priceContainer.append(this.price);

        this.buttons = document.createElement('div');
        this.buttons.classList.add('orders-create-buttons');
        this.form.append(this.buttons);

        this.button = document.createElement('button');
        this.button.classList.add('orders-create-button', 'orders-create-button-create');
        this.button.type = 'button';
        this.button.textContent = 'Crear Orden';
        this.buttons.append(this.button);

        this.buttonCancel = document.createElement('button');
        this.buttonCancel.classList.add('orders-create-button', 'orders-create-button-reset');
        this.buttonCancel.type = 'button';
        this.buttonCancel.textContent = 'Reiniciar';
        this.buttons.append(this.buttonCancel);

        this.message = document.createElement('span');
        this.message.hidden = true;
        this.form.append(this.message);

        this.light = document.createElement('div');
        this.light.classList.add('orders-create-light');
        this.form.append(this.light);

        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
        });

        this.button.addEventListener('click', (event) => {
            event.preventDefault();
            this.submit();
        });

        this.buttonCancel.addEventListener('click', (event) => {
            event.preventDefault();
            this.reset();
        });

        this.barcode.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.fetch_product();
            };
        });

        this.selectType.addEventListener('change', (event) => {
            event.preventDefault();
            this.calculate_price();
            this.draw_products();
        });

        this.total = 0;
        this.products = [];

        this.productsContainer = document.createElement('div');
        this.productsContainer.classList.add('orders-create-products-container');
        this.container.append(this.productsContainer);

        this.table = document.createElement('table');
        this.table.classList.add('orders-create-products-table');
        this.productsContainer.append(this.table);

        this.table.innerHTML = `
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Precio p/Unidad</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    <th>Acciones</th>
                </tr>
            </thead>
        `;

        this.tbody = document.createElement('tbody');
        this.table.append(this.tbody);


        this.timeout = null;
    };

    async init () {
        this.app.innerHTML = '';
        this.app.append(this.view);
        this.barcode.focus();
        localStorage.setItem('items', JSON.stringify([]));
        this.clear();
        this.fetch_customers();
    };

    async fetch_customers () {
        try {
            const request = await fetch('/api/customers', { method: "GET" });
            const response = await request.json();

            if (!request.ok) throw new Error();

            const customers = response.data;

            for (const customer of customers) {
                this.selectCustomer.innerHTML += `
                    <option value="${customer.id}">${customer.name}</option>
                `;
            };
        } catch (error) {
            console.error(error);
        };
    };

    clear () {
        this.barcode.value = '';
        this.selectCustomer.innerHTML = `
            <option value="none">Sin asignar</option>
        `;
    };

    async fetch_product () {
        try {
            const barcode = this.barcode.value;

            if (!barcode || barcode === '') return;

            this.barcode.value = '';

            const request = await fetch("/api/products?barcode="+barcode, {
                method: "GET"
            });

            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);

            const product = response.data[0];

            let flag = false;
            for (let i = 0; i < this.products.length; i++) {
                if (this.products[i].id === product.id) {
                    flag = true;
                    this.products[i].name = product.name;
                    this.products[i].barcode = product.barcode;
                    this.products[i].quantity += 1;
                    this.products[i].price_major = product.price_major;
                    this.products[i].price_minor = product.price_minor;
                    break;
                };
            };

            if (!flag) {
                this.products.push({
                    id: product.id,
                    barcode: product.barcode,
                    name: product.name,
                    quantity: 1,
                    price_major: product.price_major,
                    price_minor: product.price_minor
                });
            };

            this.calculate_price();
            this.barcode.focus();
            this.draw_products();

            this.light.classList.remove('orders-create-light-error');
            this.light.classList.add('orders-create-light-success');
        } catch (error) {
            console.error(error);
            this.light.classList.remove('orders-create-light-success');
            this.light.classList.add('orders-create-light-error');
        };
    };

    calculate_price () {
        const type = this.selectType.value;
        let price = 0;

        for (const product of this.products) {
            if (type === 'major') {
                price += product.price_major * product.quantity;
            } else if (type === 'minor') {
                price += product.price_minor * product.quantity;
            };
        };

        this.total = price;

        this.price.innerHTML = `
            <span>$</span>
            <span>${price / 100}</span>
        `;
    };

    draw_products () {
        this.tbody.innerHTML = '';
        
        for (let i = 0; i < this.products.length; i++) {
            const row = document.createElement('tr');

            const cBarcode = document.createElement('td');
            const cName = document.createElement('td');
            const cPrice = document.createElement('td');
            const cQuantity = document.createElement('td');
            const cSubtotal = document.createElement('td');
            const cActions = document.createElement('td');

            const price = (this.selectType.value === 'major' ? this.products[i].price_major : this.products[i].price_minor);

            cBarcode.textContent = this.products[i].barcode;
            cName.textContent = this.products[i].name;
            cPrice.textContent = (price/100);
            cSubtotal.textContent = (this.products[i].quantity * price)/100;
            
            const input = document.createElement('input');
            input.type = 'number';
            input.value = this.products[i].quantity;
            input.min = 1;
            cQuantity.append(input);

            input.addEventListener('change', (event) => {
                event.preventDefault();
                let value = input.value;
                if (!value || value <= 0) {
                    input.value = 1;
                    value = 1;
                }

                this.products[i].quantity = value;
                this.calculate_price();
                this.draw_products();
            });

            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = 'Eliminar';
            cActions.append(button);

            button.addEventListener('click', (event) => {
                event.preventDefault();
                this.products = this.products.filter((p) => p.id !== this.products[i].id);
                this.calculate_price();
                this.draw_products();
            });

            row.append(cBarcode);
            row.append(cName);
            row.append(cPrice);
            row.append(cQuantity);
            row.append(cSubtotal);
            row.append(cActions);

            this.tbody.prepend(row);
        };
    };

    async submit () {
        try {
            const request = await fetch('/api/orders', {
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    customer_id: this.selectCustomer.value,
                    type: this.selectType.value,
                    items: this.products.map((p) => ({
                        id: p.id,
                        quantity: p.quantity
                    }))
                })
            });

            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);

            this.reset();
            this.barcode.focus();
            this.show_message("Orden creada correctamente.", false);
        } catch (error) {
            console.error(error);
            this.show_message(error.message, true);
        };
    };

    reset () {
        this.products = [];
        this.tbody.innerHTML = '';
        this.form.reset();
        this.calculate_price();
        this.total = 0;
    };
 
    show_message (text, error = false) {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        };

        this.message.hidden = false;
        this.message.textContent = text;

        if (error) {
            this.message.classList.remove('message-success');
            this.message.classList.add('message-error');
        } else {
            this.message.classList.remove('message-error');
            this.message.classList.add('message-success');
        };

        this.timeout = setTimeout(() => {
            this.message.hidden = true;
            this.timeout = null;
        }, 6000);
    };
};