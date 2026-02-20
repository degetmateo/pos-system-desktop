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

        this.container.innerHTML = productsCreateTemplate;

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

            if (event.target.matches('#products-create-input-stock')) {
                storage.stock = Number(event.target.value);
                localStorage.setItem('new-product', JSON.stringify(storage)); 
            };

            if (event.target.matches('#products-create-input-condition-1')) {
                storage.minor_price_condition_1 = Number(event.target.value);
                localStorage.setItem('new-product', JSON.stringify(storage)); 
            };

            if (event.target.matches('#products-create-input-condition-2')) {
                storage.minor_price_condition_2 = Number(event.target.value);
                localStorage.setItem('new-product', JSON.stringify(storage)); 
            };

            if (event.target.matches('#products-create-input-condition-3')) {
                storage.minor_price_condition_3 = Number(event.target.value);
                localStorage.setItem('new-product', JSON.stringify(storage)); 
            };

            if (event.target.matches('#products-create-input-condition-4')) {
                storage.minor_price_condition_4 = Number(event.target.value);
                localStorage.setItem('new-product', JSON.stringify(storage)); 
            };

            if (event.target.matches('#products-create-input-minorprice-1')) {
                storage.minor_price_value_1 = Number(event.target.value);
                localStorage.setItem('new-product', JSON.stringify(storage));
            };

            if (event.target.matches('#products-create-input-minorprice-2')) {
                storage.minor_price_value_2 = Number(event.target.value);
                localStorage.setItem('new-product', JSON.stringify(storage));
            };

            if (event.target.matches('#products-create-input-minorprice-3')) {
                storage.minor_price_value_3 = Number(event.target.value);
                localStorage.setItem('new-product', JSON.stringify(storage));
            };

            if (event.target.matches('#products-create-input-minorprice-4')) {
                storage.minor_price_value_4 = Number(event.target.value);
                localStorage.setItem('new-product', JSON.stringify(storage));
            };

            if (event.target.matches('#products-create-select-provider')) {
                if (event.target.value == 'null' || event.target.value == null) {
                    event.target.value = null;
                };
                storage.provider_id = event.target.value;
                localStorage.setItem('new-product', JSON.stringify(storage));
            };

            if (event.target.matches('#products-create-input-cost')) {
                storage.cost = Number(event.target.value);
                localStorage.setItem('new-product', JSON.stringify(storage));
            };

            if (event.target.matches('#products-create-input-image')) {
                document.querySelector('#products-create-button-image').textContent = event.target.files[0].name;
            };
        });

        this.container.addEventListener('click', async (event) => {
            const storage = JSON.parse(localStorage.getItem('new-product'));
            
            if (event.target.matches('#products-create-button-barcode')) {
                document.querySelector('#products-create-input-barcode').value = 'INTERNAL_BARCODE';
                storage.barcode = 'INTERNAL_BARCODE';
                localStorage.setItem('new-product', JSON.stringify(storage));
                document.querySelector('#products-create-input-name').focus();
            };
            
            if (event.target.matches('#products-create-button-image')) {
                document.querySelector('#products-create-input-image').click();
            };

            if (event.target.matches('#products-create-button-reset')) {
                this.reset_storage();
                this.draw();
            };

            if (event.target.matches('#products-create-button-provider')) {
                try {
                    const name = document.querySelector('#products-create-input-provider').value;
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
                    document.querySelector('#products-create-input-provider').value = '';
                    alertsManager.createAlert('Proveedor creado correctamente.', false);
                } catch (error) {
                    console.error(error);
                    alertsManager.createAlert(error.message, true);
                };
            };

            if (event.target.matches('#products-create-button-submit')) {
                this.submit();
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

        const providers = await this.fetch_providers();
        providers.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
        this.draw_providers(providers);
        this.draw();
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

        document.querySelector('#products-create-input-image').value = null;
        document.querySelector('#products-create-button-image').textContent = 'Seleccionar Imagen';
    };

    draw () {
        const storage = JSON.parse(localStorage.getItem('new-product'));

        const barcode = document.querySelector('#products-create-input-barcode');
        const name = document.querySelector('#products-create-input-name');
        const majorPrice = document.querySelector('#products-create-input-majorprice');
        const minorPrice = document.querySelector('#products-create-input-minorprice');
        const stock = document.querySelector('#products-create-input-stock');
        // const cost = document.querySelector('#products-create-input-cost');
        const provider = document.querySelector('#products-create-select-provider');

        const minorPriceCondition1 = document.querySelector('#products-create-input-condition-1');
        const minorPriceCondition2 = document.querySelector('#products-create-input-condition-2');
        const minorPriceCondition3 = document.querySelector('#products-create-input-condition-3');
        const minorPriceCondition4 = document.querySelector('#products-create-input-condition-4');

        const minorPriceValue1 = document.querySelector('#products-create-input-minorprice-1');
        const minorPriceValue2 = document.querySelector('#products-create-input-minorprice-2');
        const minorPriceValue3 = document.querySelector('#products-create-input-minorprice-3');
        const minorPriceValue4 = document.querySelector('#products-create-input-minorprice-4');

        barcode.value = storage.barcode;
        name.value = storage.name;
        majorPrice.value = storage.major_price;
        minorPrice.value = storage.minor_price;
        stock.value = storage.stock;
        // cost.value = storage.cost;
        provider.value = storage.provider_id;

        minorPriceCondition1.value = storage.minor_price_condition_1;
        minorPriceCondition2.value = storage.minor_price_condition_2;
        minorPriceCondition3.value = storage.minor_price_condition_3;
        minorPriceCondition4.value = storage.minor_price_condition_4;

        minorPriceValue1.value = storage.minor_price_value_1;
        minorPriceValue2.value = storage.minor_price_value_2;
        minorPriceValue3.value = storage.minor_price_value_3;
        minorPriceValue4.value = storage.minor_price_value_4;
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
        const selector = document.querySelector('#products-create-select-provider');

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
            const image = document.querySelector('#products-create-input-image').files[0];

            const data = new FormData();
            data.append('data', localStorage.getItem('new-product'));
            data.append('image', image);

            const request = await fetch('/api/products', {
                method: "POST",
                body: data
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