const express = require('express');
const path = require('path');

const productsRouter = require('./routes/products.router.js');
const infoRouter = require('./routes/info.router.js');
const customersRouter = require('./routes/customers.router.js');
const ordersRouter = require('./routes/orders.router.js');
const barcodesRouter = require('./routes/barcodes.router.js');
const providersRouter = require('./routes/providers.router.js');

const PUBLIC_PATH = path.join(__dirname, '../public');
const HTML_PATH = path.join(PUBLIC_PATH, 'index.html');

module.exports = class Server {
    constructor () {
        this.app = express();
        this.app.set("port", 4000);
    
        this.paths = {
            products: '/api/products',
            info: '/api/info',
            customers: '/api/customers',
            orders: '/api/orders',
            barcodes: '/api/barcodes',
            providers: '/api/providers'
        };
    };

    middlewares () {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use('/public', express.static(PUBLIC_PATH));

        this.app.use((_, res, next) => {
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            next();
        });
    };

    routes () {
        this.app.use(this.paths.products, productsRouter);
        this.app.use(this.paths.info, infoRouter);
        this.app.use(this.paths.customers, customersRouter);
        this.app.use(this.paths.orders, ordersRouter);
        this.app.use(this.paths.barcodes, barcodesRouter);
        this.app.use(this.paths.providers, providersRouter);

        this.app.use((_, res) => {
            res.sendFile(HTML_PATH);
        });
    };

    start () {
        this.middlewares();
        this.routes();

        this.app.listen(this.app.get("port"), () => {
            console.log('Server is running on http://localhost:4000');
        });
    };
};