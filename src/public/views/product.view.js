import AppHeader from "../components/header.js";
import Navigation from "../components/navigation/navigation.js";
import PopupConfirm from "../components/popup-confirm/popup-confirm.js";
import alertsManager from "../modules/alerts.manager.js";
import router from "../router.js";
import GenericView from "./GenericView.js";
import productViewTemplate from "./templates/product.view.template.js";

export default class ProductView extends GenericView {
    constructor () {
        super();
        this.meta = null;
        this.timeout = null;

        this.view = document.createElement('div');
        this.view.classList.add('view', 'product-view');
        this.view.append(new Navigation());
        this.container = document.createElement('div');
        this.container.classList.add('product-view-container');
        this.view.append(this.container);
        this.header = new AppHeader();
        this.container.append(this.header);
        this.content = document.createElement('div');
        this.content.classList.add('content', 'product-view-content');
        this.content.innerHTML = productViewTemplate;
        this.container.append(this.content);

        this.container.addEventListener('click', async (event) => {
            if (event.target.matches('#product-view-basic-info-button-update')) {
                this.submit();
            };

            if (event.target.matches('#product-view-basic-info-button-delete')) {
                const storage = JSON.parse(localStorage.getItem('product'));

                new PopupConfirm({
                    message: '¿Estás seguro de que querés eliminar este producto?',
                    onConfirm: async () => {
                        try {
                            const request = await fetch(`/api/products/${storage.id}`, { method: "DELETE" });
                            const response = await request.json();
                            if (!request.ok) throw new Error(response.error.message);
                            router.goBack();
                        } catch (error) {
                            console.error(error);  
                            alertsManager.createAlert(error.message, true);
                        };
                    },  
                    onCancel: () => {
                        console.log('CANCELADO');
                    }
                });
            };
        });

        this.storageName = 'product';

        this.container.addEventListener('change', (event) => {
            const storage = this.getStorage();
            
            if (event.target.matches('#product-view-basic-info-input-barcode')) {
                storage.barcode = event.target.value;
                this.setStorage(storage);
                this.draw();
            };

            if (event.target.matches('#product-view-basic-info-input-name')) {
                storage.name = event.target.value;
                this.setStorage(storage);
                this.draw();
            };

            if (event.target.matches('#product-view-basic-info-input-majorprice')) {
                storage.majorprice = Number(event.target.value) * 100;
                this.setStorage(storage);
                this.draw();
            };

            if (event.target.matches('#product-view-basic-info-input-minorprice')) {
                storage.minorprice = Number(event.target.value) * 100;
                this.setStorage(storage);
                this.draw();
            };

            if (event.target.matches('#product-view-basic-info-input-provider')) {
                storage.provider_id = event.target.value;
                this.setStorage(storage);
                this.draw();
            };

            if (event.target.matches('.input-minorprice-condition')) {
                for (let i = 1; i <= 4; i++) {
                    const inputCondition = document.querySelector(`#products-create-input-condition-${i}`);
                    const inputPrice = document.querySelector(`#products-create-input-minorprice-${i}`);
                    
                    let conditionValue = 0;
                    let priceValue = 0;

                    if (!inputCondition.value || inputCondition.value <= 0) {
                        inputCondition.value = '';
                    } else {
                        conditionValue = Number(inputCondition.value);
                    };
                    if (!inputPrice.value || inputPrice.value <= 0) {
                        inputPrice.value = '';
                    } else {
                        priceValue = Number(inputPrice.value);
                    };

                    storage[`minor_price_condition_${i}`] = conditionValue;
                    storage[`minor_price_value_${i}`] = priceValue * 100; 
                };

                this.setStorage(storage);
                this.draw();
            };

            if (event.target.matches('.input-minorprice-value')) {
                for (let i = 1; i <= 4; i++) {
                    const inputCondition = document.querySelector(`#products-create-input-condition-${i}`);
                    const inputPrice = document.querySelector(`#products-create-input-minorprice-${i}`);
                    
                    let conditionValue = 0;
                    let priceValue = 0;

                    if (!inputCondition.value || inputCondition.value <= 0) {
                        inputCondition.value = '';
                    } else {
                        conditionValue = Number(inputCondition.value);
                    };
                    if (!inputPrice.value || inputPrice.value <= 0) {
                        inputPrice.value = '';
                    } else {
                        priceValue = Number(inputPrice.value);
                    };

                    storage[`minor_price_condition_${i}`] = conditionValue;
                    storage[`minor_price_value_${i}`] = priceValue * 100; 
                };
                
                this.setStorage(storage);
                this.draw();
            };
        });
    };

    getStorage () {
        return JSON.parse(localStorage.getItem(this.storageName));
    };

    setStorage (data) {
        localStorage.setItem(this.storageName, JSON.stringify(data));
    };

    async init (meta) {
        this.meta = meta;
        this.app.innerHTML = '';
        this.app.append(this.view);

        const providers = await this.fetch_providers();
        providers.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
        this.draw_providers(providers);

        const product = await this.fetch_product(this.meta.data.id);
        this.header.setTitle(product.name);

        if (!product.minor_prices) product.minor_prices = [];
        product.minor_prices = product.minor_prices.sort((a, b) => a.condition_value - b.condition_value);

        for (let i = 0; i < product.minor_prices.length; i++) {
            if (product.minor_prices[i]) {
                product[`minor_price_condition_${i + 1}`] = product.minor_prices[i].condition_value;
                product[`minor_price_value_${i + 1}`] = product.minor_prices[i].price_value;
            };
        };

        localStorage.setItem('product', JSON.stringify(product));
        this.draw();
    };

    async fetch_product (id) {
        try {
            const request = await fetch(`/api/products?id=${id}`, { method: "GET" });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            return response.data[0];
        } catch (error) {
            console.error(error);
            alertsManager.createAlert(error.message, true);
            return null;  
        };
    };

    async fetch_providers () {
        try {
            const request = await fetch('/api/providers', { method: "GET" });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            return response.data;
        } catch (error) {
            console.error(error);
            return [];  
        };
    };

    draw_providers (providers) {
        const select = document.querySelector('#product-view-basic-info-input-provider');
        select.innerHTML = '';
        select.innerHTML = `
            <option value="">SIN ASIGNAR</option>
        `;
        for (const provider of providers) {
            select.innerHTML += `
                <option value="${provider.id}">${provider.name}</option>
            `;
        };
    };

    setBarcode (barcode) {
        document.querySelector('#product-view-basic-info-input-barcode').value = barcode || '';
    };

    setName (name) {
        document.querySelector('#product-view-basic-info-input-name').value = name || '';
    };

    setMajorPrice (majorprice) {
        document.querySelector('#product-view-basic-info-input-majorprice').value = majorprice / 100;
    };

    setMinorPrice (minorprice) {
        document.querySelector('#product-view-basic-info-input-minorprice').value = minorprice / 100;
    };

    setProvider (providerId) {
        document.querySelector('#product-view-basic-info-input-provider').value = providerId || '';
    };

    setDiscountPrice (number, condition, price) {
        if (number < 1) return;
        if (number > 4) return;
        document.querySelector(`#products-create-input-condition-${number}`).value = condition;
        document.querySelector(`#products-create-input-minorprice-${number}`).value = price;
    };

    draw () {
        const storage = JSON.parse(localStorage.getItem('product'));
        if (!storage) return;

        this.setBarcode(storage.barcode);
        this.setName(storage.name);
        this.setMajorPrice(storage.price_major);
        this.setMinorPrice(storage.price_minor);
        this.setProvider(storage.provider_id || '');

        for (let i = 1; i <= 4; i++) {
            const cond = storage[`minor_price_condition_${i}`];
            const price = storage[`minor_price_value_${i}`];

            cond ?
                this.setDiscountPrice(i, cond, price / 100) :
                this.setDiscountPrice(i, '', '');
        };
    };

    async submit () {
        try {
            const request = await fetch('/api/products/update/'+this.meta.data.id, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: localStorage.getItem('product')
            });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            alertsManager.createAlert("Producto actualizado.", false);
            this.setStorage(response.data);
            this.draw();
        } catch (error) {
            console.error(error);
            alertsManager.createAlert(error.message, true);
        };
    };
};