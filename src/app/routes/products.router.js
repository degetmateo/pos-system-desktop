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

router.post('/', (req, _, next) => {
    req.data = {
        id: uuid.v4()
    };

    next();
}, upload.single('image'), async (req, res) => {
    try {
        const data = JSON.parse(req.body.data);

        const id = req.data.id;
        const image_filename = req.file ? req.file.filename : null;

        if (!data.barcode) data.barcode = null;
        if (!data.name) throw new InvalidArgumentError("Tenés que ponerle un nombre al producto.");

        if (!data.stock || data.stock < 0) data.stock = 0;
        if (!data.major_price || data.major_price < 0) data.major_price = 0;
        if (!data.minor_price || data.minor_price < 0) data.minor_price = 0;
        
        data.id = id;
        data.image_filename = image_filename;
        productsRepository.insert(data);

        ResponseOk(res, responses.CREATED, null);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);    
    };
});

router.post('/update/:id', async (req, _, next) => {
    req.data = {
        id: req.params.id
    };

    next();
}, upload.single('image'), async (req, res) => {
    try {
        let {
            id,
            barcode,
            name,
            stock,
            provider_id,
            price_major,
            price_minor,
            minor_prices
        } = JSON.parse(req.body.data);

        if (!name || !name.trim()) throw new InvalidArgumentError("Name is required.");
        if (!minor_prices || minor_prices.length <= 0) minor_prices = [];

        let filename = req.file ? req.file.filename : null;

        const date = new Date().toISOString();

        database.transaction(() => {
            database.prepare(`
                UPDATE 
                    products
                SET
                    barcode = :barcode,
                    name = :name,
                    stock = :stock,
                    price_major = :price_major,
                    price_minor = :price_minor,
                    provider_id = :provider_id
                WHERE
                    id = :id;
            `).run({ id, barcode, name, stock, price_major, price_minor, provider_id });

            if (filename) {
                database.prepare(`
                    UPDATE 
                        products
                    SET
                        image_name = :filename
                    WHERE
                        id = :id;
                `).run({ id, filename });
            };

            database.prepare(`
                DELETE FROM minor_prices 
                WHERE product_id = :product_id;
            `).run({ product_id: id });

            for (const minor_price of minor_prices) {
                const minor_price_id = uuid.v4();
                database.prepare(`
                    INSERT INTO minor_prices (id, product_id, condition, condition_value, price_value, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?);
                `).run(minor_price_id, id, 'discount', Number(minor_price.condition_value), Number(minor_price.price_value), date, date);
            };
        }).exclusive();
        
        ResponseOk(res, responses.ACCEPTED, null);
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