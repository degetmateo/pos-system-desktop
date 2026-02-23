import ErrorView from "./views/error/ErrorView.js";
import HomeView from "./views/home/HomeView.js";
import ScannerView from "./views/scanner/ScannerView.js";
import DatabaseView from "./views/database/DatabaseView.js";
import PriceListsView from "./views/price-lists/PriceListsView.js";
import ProductsView from "./views/products.view.js";
import ProductView from "./views/product.view.js";

import CustomersCreateView from "./views/customers.create.view.js";
import OrdersCreateView from "./views/orders.create.view.js";
import OrdersView from "./views/orders.view.js";
import OrderView from "./views/order.view.js";
import ProductsCreateView from "./views/products.create.view.js";
import CustomersView from "./views/customers.view.js";
import ListsView from "./views/lists.view.js";
import CustomerView from "./views/customer.view.js";

class Router {
    constructor () {
        this.router = new Navigo("/", { hash: true });
        this.event = new Event('pathnamechange');

        this.views = {
            home: new HomeView(),
            scanner: new ScannerView(),
            database: new DatabaseView(),
            productsCreate: new ProductsCreateView(),
            priceLists: new PriceListsView(),
            products: new ProductsView(),
            product: new ProductView(),
            customers_create: new CustomersCreateView(),
            orders_create: new OrdersCreateView(),
            orders: new OrdersView(),
            order: new OrderView(),
            customers: new CustomersView(),
            lists: new ListsView(),
            error: new ErrorView(),
            customer: new CustomerView()
        };

        this.router
            .on("/", () => this.views.home.init())
            .on("/scanner", () => this.views.scanner.init())
            .on('/database', () => this.views.database.init())
            .on('/new-product', () => this.views.productsCreate.init())
            .on('/price-lists', () => this.views.priceLists.init())
            .on('/products', (data) => this.views.products.init(data))
            .on('/products/:id', (data) => this.views.product.init(data))
            .on('/new-customer', () => this.views.customers_create.init())
            .on('/new-order', (data) => this.views.orders_create.init(data))
            .on('/orders', () => this.views.orders.init())
            .on('/orders/:id', ({ data }) => this.views.order.init(data))
            .on('/customers', (data) => this.views.customers.init(data))
            .on('/customers/:id', (data) => this.views.customer.init(data))
            .on('/lists', (data) => this.views.lists.init(data))
            .notFound(() => this.views.error.init());
    }

    resolve = () => {
        this.router.resolve();
    };

    navigateTo = (url) => {
        if (url == window.location.pathname) return;
        window.history.pushState(null, null, url);
        window.dispatchEvent(this.event);
        this.resolve();
    };

    replace = (url) => {
        if (url == window.location.pathname) return;
        window.history.replaceState(null, null, url);
        window.dispatchEvent(this.event);
        this.resolve();
    };

    goBack = () => {
        window.history.back();
    };

    goForward = () => {
        window.history.forward();
    };

    getPathname = () => {
        return window.location.pathname;
    };

    reload = () => {
        window.location.reload();
    };
};

export default new Router();