import Navigation from "../components/navigation/navigation.js";
import audioManager from "../modules/audio.manager.js";
import router from "../router.js";
import GenericView from "./GenericView.js";

export default class ProductsView extends GenericView {
    constructor () {
        super();
        this.view = document.createElement('div');
        this.view.classList.add('view', 'products-view');

        this.view.append(new Navigation());

        this.container = document.createElement('div');
        this.container.classList.add('products-view-container');
        this.view.append(this.container);

        this.container.innerHTML = `
            <div class="products-view-filters-container">
                <input 
                    type="text" 
                    placeholder="Filtrar por Nombre" 
                    id="products-view-name-input"
                    class="products-view-input products-view-name-input"
                />

                <input
                    type="text"
                    placeholder="Código de Barras"
                    id="products-view-barcode-input"
                    class="products-view-input products-view-barcode-input"
                />

                <select id="products-view-select" class="products-view-select">
                    <option value=null>NO ORDENAR</option>
                    <option value="abc">ORDENAR ALFABÉTICAMENTE</option>
                </select>
            </div>

            <div class="products-view-table-container">
                <table class="products-view-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Stock</th>
                            <th>Precio Mayorista</th>
                            <th>Precio Minorista</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody id="products-view-table-body">
                    
                    </tbody>
                </table>
            </div>

            <div
                class="products-view-buttons-container"
            >
                <button
                    type="button"
                    id="products-view-button-previous"
                    class="products-view-button"
                >Anterior</button>

                <button
                    type="button"
                    id="products-view-button-next"
                    class="products-view-button"
                >Siguiente</button>
            </div>
        `;

        this.container.addEventListener('click', (event) => {
            if (event.target.matches('#products-view-button-previous')) {
                this.previous();
            };

            if (event.target.matches('#products-view-button-next')) {
                this.next();
            };

            if (event.target.matches('.products-view-table-row-data')) {
                if (this.to) {
                    switch (this.to) {
                        case 'order':
                            router.navigateTo('/new-order?product_id='+event.target.getAttribute('id'));
                        break;
                    };
                } else {
                    router.navigateTo('/products/'+event.target.getAttribute('id'));
                };
            };
        });

        this.container.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
                if (event.target.matches('#products-view-name-input')) {
                    const name = event.target.value;
                    const products = await this.fetch_products(name);
                    this.draw_products(products);
                };
    
                if (event.target.matches('#products-view-barcode-input')) {
                    try {
                        const barcode = event.target.value;
                        const request = await fetch(`/api/products?barcode=${barcode}`, { method: "GET" });
                        const response = await request.json();
                        if(!request.ok) throw new Error(response.error.message);
                        audioManager.play('success');
                        event.target.value = '';
                        router.navigateTo('/products/'+response.data[0].id);
                    } catch (error) {
                        console.error(error);
                        audioManager.play('error');
                    };
                };
            };
        });

        this.container.addEventListener('change', async (event) => {
            if (event.target.matches('#products-view-select')) {
                const storage = JSON.parse(localStorage.getItem('products-view'));
                const selector = document.querySelector('#products-view-select');
                storage.sorting = selector.value;
                localStorage.setItem('products-view', JSON.stringify(storage));

                const products = await this.fetch_products();
                this.draw_products(products);
            };
        });

        this.offset = 0;
        this.continue = true;
        this.to = null;
    };

    async init (url) {
        this.app.innerHTML = '';
        this.app.append(this.view);
        
        if (!localStorage.getItem('products-view')) {
            localStorage.setItem('products-view', JSON.stringify({
                sorting: null
            }));
        };

        this.draw();

        this.continue = true;
        this.offset = 0;
        this.to = null;

        if (url.params) {
            if (url.params.to) {
                this.to = url.params.to;
            };
        };

        const products = await this.fetch_products();
        this.draw_products(products);
    };

    draw () {
        const storage = JSON.parse(localStorage.getItem('products-view'));
        const selector = document.querySelector('#products-view-select');
        selector.value = storage.sorting;
    };

    async fetch_products (name) {
        try {
            if (!name || !name.trim()) name = '';
            const storage = JSON.parse(localStorage.getItem('products-view'));
            const request = await fetch(`/api/products?name=${name}&sorting=${storage.sorting}&offset=${this.offset}`, { method: "GET" });
            const response = await request.json();
            if(!request.ok) throw new Error(response.error.message);
            return response.data;
        } catch (error) {
            console.error(error);
            return [];
        };
    };

    draw_products (products) {
        document.querySelector('#products-view-table-body').innerHTML = '';
        for (const product of products) {
            document.querySelector('#products-view-table-body').innerHTML += `
                <tr class="product-view-table-row">
                    <td id="${product.id}" class="products-view-table-row-data">${product.barcode}</td>
                    <td id="${product.id}" class="products-view-table-row-data">${product.name}</td>
                    <td id="${product.id}" class="products-view-table-row-data">${product.stock}</td>
                    <td id="${product.id}" class="products-view-table-row-data">${product.price_major / 100}</td>
                    <td id="${product.id}" class="products-view-table-row-data">${product.price_minor / 100}</td>
                    <td id="${product.id}" class="products-view-table-row-data">${new Date(product.created_at).toLocaleDateString()}</td>
                </tr>
            `;
        };
    };

    clear () {
        document.querySelector('#products-view-table-body').innerHTML = '';
    };

    async previous () {
        this.offset -= 20;
        
        if (this.offset < 0) {
            this.offset = 0;
            return;
        };

        this.continue = true;

        const name = document.querySelector('#products-view-name-input').value;
        const products = await this.fetch_products(name);
        this.draw_products(products);
    };

    async next () {
        if (!this.continue) return;

        this.offset += 20;

        const name = document.querySelector('#products-view-name-input').value;
        const products = await this.fetch_products(name);

        if (!products || products.length <= 0) {
            this.continue = false;
            this.offset -= 20;
            return;
        };

        this.draw_products(products);
    };
};