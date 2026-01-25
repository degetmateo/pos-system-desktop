import router from "../../router.js";

export default class Navigation extends HTMLElement {
    constructor () {
        super();
        this.classList.add('navigation');

        this.buttonHome = document.createElement('button');
        this.buttonProducts = document.createElement('button');
        this.buttonNewProduct = document.createElement('button');
        this.buttonPriceLists = document.createElement('button');
        this.buttonNewCustomer = document.createElement('button');
        this.buttonNewOrder = document.createElement('button');
        this.buttonOrders = document.createElement('button');

        this.buttonHome.textContent = "Inicio";
        this.buttonPriceLists.textContent = 'Listas';
        this.buttonProducts.textContent = 'Productos';
        this.buttonNewProduct.textContent = 'Nuevo Producto';
        this.buttonNewCustomer.textContent = 'Nuevo Cliente';
        this.buttonNewOrder.textContent = 'Nueva Orden';
        this.buttonOrders.textContent = 'Órdenes';

        this.buttonHome.classList.add('navigation-button');
        this.buttonPriceLists.classList.add('navigation-button');
        this.buttonProducts.classList.add('navigation-button');
        this.buttonNewProduct.classList.add('navigation-button');
        this.buttonNewCustomer.classList.add('navigation-button');
        this.buttonNewOrder.classList.add('navigation-button');
        this.buttonOrders.classList.add('navigation-button');

        this.buttonHome.addEventListener('click', () => {
            router.navigateTo('/');
        });

        this.buttonPriceLists.addEventListener('click', () => {
            router.navigateTo('/price-lists');
        });

        this.buttonProducts.addEventListener('click', () => {
            router.navigateTo('/products');
        });

        this.buttonNewProduct.addEventListener('click', () => {
            router.navigateTo('/new-product');
        });

        this.buttonNewCustomer.addEventListener('click', (e) => {
            router.navigateTo('/new-customer');
        });

        this.buttonNewOrder.addEventListener('click', () => {
            router.navigateTo('/new-order');
        });

        this.buttonOrders.addEventListener('click', () => {
            router.navigateTo('/orders');
        });

        this.append(this.buttonHome);
        // this.append(this.buttonPriceLists);
        this.append(this.buttonNewProduct);
        this.append(this.buttonProducts);
        this.append(this.buttonNewCustomer);
        this.append(this.buttonNewOrder);
        this.append(this.buttonOrders);
    };
};

customElements.define('app-navigation', Navigation);