import Navigation from "../components/navigation/navigation.js";
import ProductCard from "../components/product.card.js";
import GenericView from "./GenericView.js";

export default class ProductView extends GenericView {
    constructor () {
        super();

        this.view = document.createElement('div');
        this.view.classList.add('view', 'product-view');

        this.view.append(new Navigation());

        this.container = document.createElement('div');
        this.container.classList.add('product-view-container');
        this.view.append(this.container);
    };

    async init (data) {
        this.app.innerHTML = '';
        this.app.append(this.view);
        this.container.innerHTML = '';

        const prod = await this.fetch_product(data.id);

        this.container.append(new ProductCard(prod));
    };

    async fetch_product (id) {
        const request = await fetch(`/api/products?id=${id}`, { method: "GET" });
        const response = await request.json();
        return response.data[0];
    };
};