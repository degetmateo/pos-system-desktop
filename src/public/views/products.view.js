import Navigation from "../components/navigation/navigation.js";
import router from "../router.js";
import GenericView from "./GenericView.js";

export default class ProductsView extends GenericView {
    constructor () {
        super();
        this.view = document.createElement('div');
        this.view.classList.add('view', 'products-view');

        this.view.append(new Navigation());

        this.container = document.createElement('div');
        this.container.classList.add('products-container');
        this.view.append(this.container);

        this.inputContainer = document.createElement('div');
        this.inputContainer.classList.add('products-input-container');
        this.container.append(this.inputContainer)

        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.placeholder = 'Filtrar por Nombre';
        this.input.classList.add('products-input');
        this.inputContainer.append(this.input);

        this.input.addEventListener('change', () => {
            this.onChange();
        });

        this.list = document.createElement('div');
        this.list.classList.add('products-products-list');
        this.container.append(this.list);

        this.table = document.createElement('table');
        this.table.classList.add('products-table');
        this.list.append(this.table);

        this.thead = document.createElement('thead');
        this.table.append(this.thead);

        this.tr = document.createElement('tr');
        this.thead.append(this.tr);

        this.thBarcode = document.createElement('th');
        this.thBarcode.textContent = 'Código';
        this.tr.append(this.thBarcode);

        this.thName = document.createElement('th');
        this.thName.textContent = 'Nombre';
        this.tr.append(this.thName);

        this.thStock = document.createElement('th');
        this.thStock.textContent = 'Stock';
        this.tr.append(this.thStock);

        this.thPriceMajor = document.createElement('th');
        this.thPriceMajor.textContent = 'Precio Mayorista';
        this.tr.append(this.thPriceMajor);

        this.thPriceMinor = document.createElement('th');
        this.thPriceMinor.textContent = 'Precio Minorista';
        this.tr.append(this.thPriceMinor);

        this.thDate = document.createElement('th');
        this.thDate.textContent = 'Fecha';
        this.tr.append(this.thDate);

        this.tbody = document.createElement('tbody');
        this.table.append(this.tbody);

        this.buttonsContainer = document.createElement('div');
        this.buttonsContainer.classList.add('products-view-buttons-container');
        this.container.append(this.buttonsContainer);

        this.buttonPrevious = document.createElement('button');
        this.buttonPrevious.classList.add('products-view-button');
        this.buttonPrevious.textContent = 'Anterior';
        this.buttonsContainer.append(this.buttonPrevious);

        this.buttonNext = document.createElement('button');
        this.buttonNext.classList.add('products-view-button');
        this.buttonNext.textContent = 'Siguiente';
        this.buttonsContainer.append(this.buttonNext);

        this.buttonPrevious.addEventListener('click', () => {
            this.previous();
        });

        this.buttonNext.addEventListener('click', () => {
            this.next();
        });

        this.offset = 0;
        this.continue = true;
    };

    async init () {
        this.app.innerHTML = '';
        this.app.append(this.view);
        this.offset = 0;

        const products = await this.fetch_products(null);

        this.clear_products();
        this.draw_products(products);
    };

    async onChange () {
        const value = this.input.value;
        const products = await this.fetch_products(value);

        this.clear_products();
        this.draw_products(products);
    };

    async fetch_products (name) {
        if (!name) name = '';
        const request = await fetch(`/api/products?name=${name}&offset=${this.offset}`, { method: "GET" });
        const response = await request.json();
        return response.data;
    };

    draw_products (products) {
        for (const prod of products) {
            const row = document.createElement('tr');
            
            row.classList.add('product-row');

            row.addEventListener('click', () => {
                router.navigateTo(`/products/${prod.id}`);
            });

            row.innerHTML = `
                <td>${prod.barcode}</td>
                <td>${prod.name}</td>
                <td>${prod.stock}</td>
                <td>${prod.price_major/100}</td>
                <td>${prod.price_minor/100}</td>
                <td>${new Date(prod.created_at).toLocaleDateString()}</td>
            `;

            this.tbody.append(row);
        };
    };

    clear_products () {
        this.tbody.innerHTML = '';
    };

    async previous () {
        this.offset -= 20;
        
        if (this.offset < 0) {
            this.offset = 0;
            return;
        };

        this.continue = true;

        this.clear_products();

        const value = this.input.value;
        const products = await this.fetch_products(value);
  console.log(products);
        this.draw_products(products);
    };

    async next () {
        if (!this.continue) return;

        this.offset += 20;
        this.clear_products();

        const value = this.input.value;
        const products = await this.fetch_products(value);

        if (!products || products.length <= 0) {
            this.continue = false;
            return;
        };

        this.draw_products(products);
    };
};