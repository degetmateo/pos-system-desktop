const express = require('express');
const path = require('path');

const infoRouter = require('./routes/info.js');
const productsRouter = require('./routes/products.js');
const databaseRouter = require('./routes/database.js');

module.exports = class Server {
    constructor () {
        this.app = express();
        this.app.set("port", 4000);
    
        this.paths = {
            info: '/api/info',
            products: '/api/products',
            database: "/api/database"
        };
    };

    middlewares () {
        this.app.use(express.json());
        this.app.use('/public', express.static(path.join(__dirname, '../public')));

        this.app.use((_, res, next) => {
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            next();
        });
    };

    routes () {
        this.app.use(this.paths.info, infoRouter);
        this.app.use(this.paths.products, productsRouter);
        this.app.use(this.paths.database, databaseRouter);

        this.app.use((_, res) => {
            res.sendFile(path.join(__dirname, "../public/index.html"));
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