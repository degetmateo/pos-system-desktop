import AppHeader from "../components/header.js";
import Navigation from "../components/navigation/navigation.js";
import alertsManager from "../modules/alerts.manager.js";
import GenericView from "./GenericView.js";
import productsCreateTemplate from "./templates/products.create.template.js";

export default class ProductsCreateView extends GenericView {
    constructor () {
        super();
        this.view = document.createElement('div');
        this.view.classList.add('view');
        this.view.append(new Navigation());
        
        this.container = document.createElement('div');
        this.container.classList.add('container', 'products-create-container');
        this.view.append(this.container);

        this.header = new AppHeader('NUEVO PRODUCTO');
        this.container.append(this.header);

        this.content = document.createElement('div');
        this.content.classList.add('products-create-content');
        this.content.innerHTML = productsCreateTemplate;
        this.container.append(this.content);

        this.container.addEventListener('change', (event) => {
            const storage = JSON.parse(localStorage.getItem('new-product'));

            if (event.target.matches('#products-create-input-barcode')) {
                storage.barcode = event.target.value;
                localStorage.setItem('new-product', JSON.stringify(storage));
            };

            if (event.target.matches('#products-create-input-name')) {
                storage.name = event.target.value;
                localStorage.setItem('new-product', JSON.stringify(storage));
            };

            if (event.target.matches('#products-create-input-majorprice')) {
                storage.major_price = Number(event.target.value);
                localStorage.setItem('new-product', JSON.stringify(storage));
            };

            if (event.target.matches('#products-create-input-minorprice')) {
                storage.minor_price = Number(event.target.value);
                localStorage.setItem('new-product', JSON.stringify(storage));
            };

            if (event.target.matches('#products-create-input-provider')) {
                storage.provider_id = event.target.value;
                localStorage.setItem('new-product', JSON.stringify(storage));
            };

            for (let i = 1; i <= 4; i++) {
                if (event.target.matches(`#products-create-input-condition-${i}`)) {
                    storage[`minor_price_condition_${i}`] = Number(event.target.value);
                    localStorage.setItem('new-product', JSON.stringify(storage));
                };

                if (event.target.matches(`#products-create-input-minorprice-${i}`)) {
                    storage[`minor_price_value_${i}`] = Number(event.target.value);
                    localStorage.setItem('new-product', JSON.stringify(storage));
                };
            };
        });

        this.container.addEventListener('click', async (event) => {
            const storage = JSON.parse(localStorage.getItem('new-product'));
            
            if (event.target.matches('#products-create-button-internal-barcode')) {
                document.querySelector('#products-create-input-barcode').value = 'INTERNAL_BARCODE';
                storage.barcode = 'INTERNAL_BARCODE';
                localStorage.setItem('new-product', JSON.stringify(storage));
                document.querySelector('#products-create-input-name').focus();
            };

            if (event.target.matches('#products-create-button-reset')) {
                this.reset_storage();
                this.draw();
            };

            if (event.target.matches('#products-create-button-create')) {
                this.submit();
            };

            if (event.target.matches('#products-create-button-new-provider')) {
                try {
                    const name = document.querySelector('#products-create-input-new-provider').value;
                    if (!name || !name.trim()) return;

                    const request = await fetch('/api/providers', {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: name
                        })
                    });
                    const response = await request.json();
                    if (!request.ok) throw new Error(response.error.message);
                    
                    const providers = await this.fetch_providers();
                    this.draw_providers(providers);
                    document.querySelector('#products-create-input-new-provider').value = '';
                    alertsManager.createAlert('Proveedor creado correctamente.', false);
                } catch (error) {
                    console.error(error);
                    alertsManager.createAlert(error.message, true);
                };
            };
        });

        this.container.addEventListener('keypress', (event) => {
            if (event.target.matches('#products-create-input-barcode')) {
                if (event.key === 'Enter') {
                    document.querySelector('#products-create-input-name').focus();
                };
            };
        });
    };

    async init () {
        this.app.innerHTML = '';
        this.app.append(this.view);
        if (!localStorage.getItem('new-product')) {
            this.reset_storage();
        };
        this.buildInputs();
        const providers = await this.fetch_providers();
        providers.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
        this.draw_providers(providers);
        this.draw();
    };

    buildInputs () {
        this.inputBarcode = document.querySelector('#products-create-input-barcode');
        this.inputName = document.querySelector('#products-create-input-name');
        this.inputMajorPrice = document.querySelector('#products-create-input-majorprice');
        this.inputMinorPrice = document.querySelector('#products-create-input-minorprice');
        this.inputProvider = document.querySelector('#products-create-input-provider');
        this.buildMinorPriceInput(1);
        this.buildMinorPriceInput(2);
        this.buildMinorPriceInput(3);
        this.buildMinorPriceInput(4);
    };

    buildMinorPriceInput (number) {
        this[`inputMinorPriceCondition${number}`] = document.querySelector(`#products-create-input-condition-${number}`);
        this[`inputMinorPriceValue${number}`] = document.querySelector(`#products-create-input-minorprice-${number}`);
    };

    reset_storage () {
        localStorage.setItem('new-product', JSON.stringify({
            barcode: null,
            name: null,
            major_price: null,
            minor_price: null,
            stock: null,
            provider_id: "",
            cost: null,

            minor_price_condition_1: null,
            minor_price_condition_2: null,
            minor_price_condition_3: null,
            minor_price_condition_4: null,

            minor_price_value_1: null,
            minor_price_value_2: null,
            minor_price_value_3: null,
            minor_price_value_4: null
        }));
    };

    draw () {
        const storage = JSON.parse(localStorage.getItem('new-product'));

        this.inputBarcode.value = storage.barcode;
        this.inputName.value = storage.name;
        this.inputMajorPrice.value = storage.major_price;
        this.inputMinorPrice.value = storage.minor_price;
        this.inputProvider.value = storage.provider_id;

        this.inputMinorPriceCondition1.value = storage.minor_price_condition_1;
        this.inputMinorPriceCondition2.value = storage.minor_price_condition_2;
        this.inputMinorPriceCondition3.value = storage.minor_price_condition_3;
        this.inputMinorPriceCondition4.value = storage.minor_price_condition_4;

        this.inputMinorPriceValue1.value = storage.minor_price_value_1;
        this.inputMinorPriceValue2.value = storage.minor_price_value_2;
        this.inputMinorPriceValue3.value = storage.minor_price_value_3;
        this.inputMinorPriceValue4.value = storage.minor_price_value_4;
    };

    async fetch_providers () {
        try {
            const request = await fetch('/api/providers', { method: "GET" });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            return response.data;
        } catch (error) {
            console.error(error);
            alertsManager.createAlert('Ocurrió un error al cargar los proveedores.', true);
            return [];
        };
    };

    draw_providers (providers) {
        const selector = document.querySelector('#products-create-input-provider');

        selector.innerHTML = `
            <option value="">SIN ASIGNAR</option>
        `;

        for (const provider of providers) {
            selector.innerHTML += `
                <option value="${provider.id}">${provider.name}</option>
            `;
        };
    };

    async submit () {
        try {
            const request = await fetch('/api/products', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: localStorage.getItem('new-product')
            });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            alertsManager.createAlert('Producto creado correctamente.', false);
            document.querySelector('#products-create-input-barcode').focus();
            this.reset_storage();
            this.draw();
        } catch (error) {
            console.error(error);
            alertsManager.createAlert(error.message, true);
        };
    };
};