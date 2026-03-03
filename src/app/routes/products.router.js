const { Router } = require("express");
const uuid = require('uuid');
const { ResponseOk, ResponseError, ResponseFile } = require("../helpers/controllerResponse");
const responses = require("../static/responses");
const { database } = require("../database/database");
const { upload } = require("../helpers/multer");
const path = require('path');
const { app } = require("electron");
const NotFoundError = require("../errors/notFoundError");
const InvalidArgumentError = require("../errors/invalidArgumentError");
const { productsRepository } = require("../repositories/products.repository");

const router = Router();

router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const id = uuid.v4();

        if (!data.barcode) data.barcode = null;
        if (!data.name) throw new InvalidArgumentError("Tenés que ponerle un nombre al producto.");

        if (!data.stock || data.stock < 0) data.stock = 0;
        if (!data.major_price || data.major_price < 0) data.major_price = 0;
        if (!data.minor_price || data.minor_price < 0) data.minor_price = 0;
        
        data.id = id;
        data.name = data.name.toUpperCase();
        productsRepository.insert(data);

        ResponseOk(res, responses.CREATED, null);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);    
    };
});

router.post('/update/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(req.body)
        let {
            name,
            minor_prices
        } = req.body;

        if (!name || !name.trim()) throw new InvalidArgumentError("Se requiere un nombre.");
        if (!minor_prices || minor_prices.length <= 0) minor_prices = [];

        req.body.id = id;
        req.body.name = name.toUpperCase();

        productsRepository.update(req.body);
        ResponseOk(res, responses.ACCEPTED, req.body);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);  
    };
});

const PRODUCT_IMAGES_PATH = path.join(app.getPath('userData'), 'product_images');

router.get('/image/:id', async (req, res) => {
    try {
        const product = await database.prepare(`
            SELECT image_name FROM products WHERE id = ?;
        `).get(req.params.id);

        if (!product) throw new NotFoundError();
        if (!product.image_name) throw new NotFoundError();

        const IMAGE_PATH = path.join(PRODUCT_IMAGES_PATH, product.image_name);

        ResponseFile(res, IMAGE_PATH);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);  
    };
});

router.get('/', async (req, res) => {
    try {
        const sorting = req.query.sorting ? req.query.sorting : null;
        const nameFilter = req.query.name ? `%${req.query.name}%` : null;
        const idFilter = req.query.id ? req.query.id : null;
        const barcodeFilter = req.query.barcode ? req.query.barcode : null;
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;
        const limit = 20;

        let products = [];

        let orderByClause = "p.created_at ASC";

        if (sorting === 'abc') {
            orderByClause = "p.name COLLATE NOCASE ASC";
        };

        database.transaction(() => {
            products = database.prepare(`
                SELECT 
                    p.id,
                    p.description, 
                    p.barcode, 
                    p.name, 
                    p.stock, 
                    p.provider_id,
                    p.price_major,
                    p.price_minor,
                    p.created_at, 
                    p.updated_at
                FROM products p

                WHERE 
                    (:name IS NULL OR p.name LIKE :name) AND
                    (:id IS NULL OR p.id = :id) AND
                    (:barcode IS NULL or p.barcode = :barcode)
                
                GROUP BY p.id
                ORDER BY ${orderByClause}
                LIMIT :limit 
                OFFSET :offset;    
            `).all({
                name: nameFilter,
                id: idFilter,
                barcode: barcodeFilter,
                limit: limit,
                offset: offset
            });

            for (let i = 0; i < products.length; i++) {
                const prices = database.prepare(`
                    SELECT * FROM minor_prices WHERE product_id = :product_id;
                `).all({ product_id: products[i].id });

                products[i].minor_prices = prices;
            };
        })();

        if (products.length <= 0) throw new NotFoundError();

        ResponseOk(res, responses.OK, products);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        if (!id) throw new InvalidArgumentError();

        database.transaction(() => {
            database.prepare(`
                DELETE FROM products WHERE id = :id;
            `).run({ id });

            database.prepare(`
                DELETE FROM minor_prices WHERE product_id = :id;
            `).run({ id });
        })();

        ResponseOk(res, responses.OK, null);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);  
    };
});

module.exports = router;