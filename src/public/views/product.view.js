import Navigation from "../components/navigation/navigation.js";
import ProductCard from "../components/product.card.js";
import GenericView from "./GenericView.js";

export default class ProductView extends GenericView {
    constructor () {
        super();

        this.timeout = null;

        this.view = document.createElement('div');
        this.view.classList.add('view', 'product-view');
        this.view.append(new Navigation());
        this.container = document.createElement('div');
        this.container.classList.add('product-view-container');
        this.view.append(this.container);

        this.container.innerHTML = `
            <div class="product-view-info-container">
                <img id="product-view-image" class="product-view-image" />

                <div class="product-view-detail-container product-view-barcode-container">
                    <span class="product-view-detail-title product-view-barcode-title">Código de Barras</span>
                    <input 
                        type="text" 
                        id="product-view-barcode-input" 
                        class="product-view-input product-view-barcode-input"
                        placeholder="Código de Barras"
                    />
                </div>
                <div class="product-view-detail-container product-view-name-container">
                    <span class="product-view-detail-title product-view-name-title">Nombre del Producto</span>
                    <input 
                        type="text" 
                        id="product-view-name-input" 
                        class="product-view-input product-view-name-input"
                        placeholder="Nombre del Producto"
                    />
                </div>
                <div class="product-view-detail-container product-view-stock-container">
                    <span class="product-view-detail-title product-view-stock-title">Stock</span>
                    <input 
                        type="number"
                        min="0" 
                        id="product-view-stock-input" 
                        class="product-view-input product-view-stock-input"
                        placeholder="Stock"
                    />
                </div>
                <div class="product-view-detail-container">
                    <button
                        type="button"
                        id="product-view-button-save"
                        class="product-view-button"
                    >Guardar Cambios</button>
                </div>
            </div>

            <div class="product-view-extra-container">
                <div class="product-view-prices-container">
                    <div class="product-view-detail-container product-view-price-major-container">
                        <span class="product-view-detail-title product-view-price-major-title">Precio Mayorista</span>
                        <input 
                            type="number"
                            min="0" 
                            id="product-view-price-major-input" 
                            class="product-view-input product-view-price-major-input"
                            placeholder="Precio Mayorista"
                        />
                    </div>
                    <div class="product-view-detail-container product-view-price-minor-container">
                        <span class="product-view-detail-title product-view-price-minor-title">Precio Minorista</span>
                        <input 
                            type="number"
                            min="0" 
                            id="product-view-price-minor-input" 
                            class="product-view-input product-view-price-minor-input"
                            placeholder="Precio Minorista"
                        />
                    </div>
                </div>

                <div class="product-view-minor-prices-container">
                    <button 
                        type="button" 
                        id="product-view-minor-prices-button-create"
                        class="product-view-button product-view-minor-prices-button product-view-minor-prices-button-create"
                    >Agregar Precio Minorista</button>

                    <span class="product-view-minor-prices-title">Condición / Precio Nuevo</span>

                    <div id="product-view-minor-prices" class="product-view-minor-prices"></div>
                </div>

                <input
                    type="file"
                    accept="image/*"
                    id="product-view-image-input"
                    class="product-view-input product-view-image-input"
                />
            </div>

            <div id="product-view-message-container" class="product-view-message-container"></div>
        `;

        this.container.addEventListener('click', async (event) => {
            const storage = JSON.parse(localStorage.getItem('product'));

            if (event.target.matches('#product-view-image-button')) {
                document.querySelector('#product-view-image-input').click();
            };

            if (event.target.matches('#product-view-minor-prices-button-create')) {
                try {
                    const request = await fetch('/api/info/uuid', { method: "GET" });
                    const response = await request.json();
                    const id = response.data;

                    storage.minor_prices.push({
                        id: id,
                        condition_value: 0,
                        price_value: 0
                    });
                    localStorage.setItem('product', JSON.stringify(storage));
                    this.draw();
                } catch (error) {
                    console.error(error);
                    this.show_message(error.message, true);
                };
            };

            if (event.target.matches('.product-view-minor-price-button-delete')) {
                const id = event.target.getAttribute('id');
                storage.minor_prices = storage.minor_prices.filter((price) => price.id !== id);
                localStorage.setItem('product', JSON.stringify(storage));
                this.draw();
            };

            if (event.target.matches('#product-view-button-save')) {
                this.submit();
            };
        });

        this.container.addEventListener('change', (event) => {
            const storage = JSON.parse(localStorage.getItem('product'));
            
            if (event.target.matches('#product-view-barcode-input')) {
                storage.barcode = event.target.value;
                localStorage.setItem('product', JSON.stringify(storage));
                this.draw();
            };

            if (event.target.matches('#product-view-name-input')) {
                storage.name = event.target.value;
                localStorage.setItem('product', JSON.stringify(storage));
                this.draw();
            };

            if (event.target.matches('#product-view-stock-input')) {
                storage.stock = Number(event.target.value);
                localStorage.setItem('product', JSON.stringify(storage));
                this.draw();
            };

            if (event.target.matches('#product-view-price-major-input')) {
                storage.price_major = Number(event.target.value * 100);
                localStorage.setItem('product', JSON.stringify(storage));
                this.draw();
            };

            if (event.target.matches('#product-view-price-minor-input')) {
                storage.price_minor = Number(event.target.value * 100);
                localStorage.setItem('product', JSON.stringify(storage));
                this.draw();
            };

            if (event.target.matches('.product-view-minor-price-condition-input')) {
                const id = event.target.getAttribute('id');
                for (let i = 0; i < storage.minor_prices.length; i++) {
                    if (storage.minor_prices[i].id === id) {
                        storage.minor_prices[i].condition_value = Number(event.target.value);
                    };
                };
                localStorage.setItem('product', JSON.stringify(storage));
                this.draw();
            };

            if (event.target.matches('.product-view-minor-price-price-input')) {
                const id = event.target.getAttribute('id');
                for (let i = 0; i < storage.minor_prices.length; i++) {
                    if (storage.minor_prices[i].id === id) {
                        storage.minor_prices[i].price_value = Number(event.target.value * 100);
                    };
                };
                localStorage.setItem('product', JSON.stringify(storage));
                this.draw();
            };
        });
    };

    async init (url) {
        this.app.innerHTML = '';
        this.app.append(this.view);

        document.querySelector('#product-view-image-input').value = null;

        const product = await this.fetch_product(url.data.id);
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
            this.show_message(error.message, true);
            return null;  
        };
    };

    draw () {
        const storage = JSON.parse(localStorage.getItem('product'));
        if (!storage) return;
        document.querySelector('#product-view-image').src = '/api/products/image/'+storage.id+`?t=${new Date().getTime()}`;
        document.querySelector('#product-view-image').addEventListener('error', () => {
            document.querySelector('#product-view-image').src = '/public/assets/interrogation_mark.png';
        });
        document.querySelector('#product-view-barcode-input').value = storage.barcode;
        document.querySelector('#product-view-name-input').value = storage.name;
        document.querySelector('#product-view-stock-input').value = storage.stock;
        document.querySelector('#product-view-price-major-input').value = storage.price_major / 100;
        document.querySelector('#product-view-price-minor-input').value = storage.price_minor / 100;

        document.querySelector('#product-view-minor-prices').innerHTML = '';
        for (const minor_price of storage.minor_prices) {
            document.querySelector('#product-view-minor-prices').innerHTML += `
                <div class="product-view-minor-price-container">
                    <input 
                        type="number"
                        min="0"
                        id="${minor_price.id}" 
                        class="product-view-minor-price-input product-view-minor-price-condition-input"
                        placeholder="Condición"
                        value="${minor_price.condition_value}"
                    />
                    <input 
                        type="number"
                        min="0"
                        id="${minor_price.id}" 
                        class="product-view-minor-price-input product-view-minor-price-price-input"
                        placeholder="Nuevo Precio"
                        value="${minor_price.price_value / 100}"
                    />
                    <button
                        type="button"
                        id="${minor_price.id}"
                        class="product-view-minor-price-button-delete"
                    >Eliminar</button>
                </div>
            `;
        };
    };

    show_message (message, error = false) {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        };

        document.querySelector('#product-view-message-container').innerHTML = `
            <span 
                class="product-view-message ${error ? "product-view-message-error" : "product-view-message-success"}"
            >${message}</span>
        `;

        this.timeout = setTimeout(() => {
            document.querySelector('#product-view-message-container').innerHTML = '';
            this.timeout = null;
        }, 6000);
    };

    async submit () {
        try {
            const storage = JSON.parse(localStorage.getItem('product'));

            const data = new FormData();
            data.append('data', JSON.stringify(storage));
            data.append('image', document.querySelector('#product-view-image-input').files[0]);

            const request = await fetch('/api/products/update/'+storage.id, {
                method: "POST",
                body: data
            });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            this.show_message("Producto actualizado correctamente.", false);
            this.draw();
        } catch (error) {
            console.error(error);
            this.show_message(error.message, true);  
        };
    };
};