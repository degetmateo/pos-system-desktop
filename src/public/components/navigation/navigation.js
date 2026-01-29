import router from "../../router.js";

export default class Navigation extends HTMLElement {
    constructor () {
        super();
        this.classList.add('navigation');

        this.innerHTML = `
            <button
                type="button"
                href="/"
                class="navigation-button"
            >Inicio</button>

            <button
                type="button"
                href="/new-product"
                class="navigation-button"
            >Nuevo Producto</button>

            <button
                type="button"
                href="/products"
                class="navigation-button"
            >Productos</button>

            <button
                type="button"
                href="/new-customer"
                class="navigation-button"
            >Nuevo Cliente</button>

            <button
                type="button"
                href="/customers"
                class="navigation-button"
            >Clientes</button>

            <button
                type="button"
                href="/new-order"
                class="navigation-button"
            >Nueva Orden</button>

            <button
                type="button"
                href="/orders"
                class="navigation-button"
            >Ordenes</button>
        `;

        this.addEventListener('click', (event) => {
            if (event.target.matches('.navigation-button')) {
                router.navigateTo(event.target.getAttribute('href'));
            };
        });
    };
};

customElements.define('app-navigation', Navigation);