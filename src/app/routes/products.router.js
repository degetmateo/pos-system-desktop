const { Router } = require("express");
const uuid = require('uuid');
const { ResponseOk, ResponseError, ResponseFile } = require("../helpers/controllerResponse");
const responses = require("../static/responses");
const { database } = require("../database/database");
const ConflictError = require("../errors/conflictError");
const { upload } = require("../helpers/multer");
const path = require('path');
const { app, IpcMainServiceWorker } = require("electron");
const NotFoundError = require("../errors/notFoundError");
const GenericError = require("../errors/genericError");
const InvalidArgumentError = require("../errors/invalidArgumentError");

const router = Router();

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
                    price_minor = :price_minor
                WHERE
                    id = :id;
            `).run({ id, barcode, name, stock, price_major, price_minor });

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

router.post('/', (req, _, next) => {
    req.data = {
        id: uuid.v4()
    };

    next();
}, upload.single('image'), async (req, res) => {
    try {
        let { barcode, name, stock, provider_id, price_major, price_minor, minor_prices } = JSON.parse(req.body.data);
        const date = new Date().toISOString();

        const product_id = req.data.id;
        const image_filename = req.file ? req.file.filename : null;

        if (!barcode) barcode = null;
        if (!name) throw new InvalidArgumentError("Tenés que ponerle un nombre al producto.");
        if (provider_id === 'none') provider_id = null;

        if (!stock || stock < 0) stock = 0;
        if (!price_major || price_major < 0) price_major = 0;
        if (!price_minor || price_minor < 0) price_minor = 0;

        for (const minor_price of minor_prices) {
            if (!minor_price.condition || minor_price.condition <= 0) throw new InvalidArgumentError("Hay un error con la condición de uno de los precios minoristas.");
            if (!minor_price.price || minor_price.price <= 0) throw new InvalidArgumentError("Hay un error con el precio de uno de los precios minoristas.");
        };
        
        database.transaction(() => {
            if (barcode) {
                if (barcode === 'INTERNAL_BARCODE') {
                    const barcodes = database.prepare(`
                        SELECT * FROM metadata WHERE key = :key;
                    `).get({ key: 'barcode' });
                    
                    const id = barcodes.value_int + 1;
                    const year = new Date().getFullYear().toString().slice(-2);
                    const prefix = 'RD';
                    const padding = id.toString().padStart(9, '0');

                    barcode = `${prefix}${year}${padding}`;
                    
                    database.prepare(`
                        UPDATE metadata
                        SET value_int = :value
                        WHERE key = :key;
                    `).run({ value: id, key: 'barcode' });
                } else {
                    const queryCheck = database.prepare(`
                        SELECT id FROM products WHERE barcode = ?
                    `);
        
                    const existingProduct = queryCheck.get(barcode);
        
                    if (existingProduct) {
                        throw new ConflictError('Ya existe un producto con ese código de barras.')
                    };
                };
            };

            if (provider_id) {
                const provider = database.prepare(`
                    SELECT * FROM providers WHERE id = :id;
                `).get({ id: provider_id });

                if (!provider) throw new NotFoundError("No existe ese proveedor.");
            };

            database.prepare(`
                INSERT INTO products (id, barcode, name, stock, provider_id, image_name, price_major, price_minor, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(product_id, barcode, name, stock, provider_id, image_filename, Number(price_major)*100, Number(price_minor)*100, date, date);

            for (const minor_price of minor_prices) {
                const minor_price_id = uuid.v4();

                database.prepare(`
                    INSERT INTO minor_prices (id, product_id, condition, condition_value, price_value, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?);
                `).run(minor_price_id, product_id, 'discount', Number(minor_price.condition), Number(minor_price.price)*100, date, date);
            };
        }).exclusive();

        ResponseOk(res, responses.CREATED, null);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);    
    };
});

router.put('/:id', (req, _, next) => {
    req.data = {
        id: req.params.id
    };

    next();
}, upload.single('image'), (req, res) => {
    try {
        const id = req.params.id;
        let { name, stock, price_major, price_minor } = JSON.parse(req.body.data);
        const filename = req.file ? req.file.filename : null;
        const date = new Date().toISOString();

        if (!stock || stock < 0) stock = 0;
        if (!price_major || price_major < 0) price_major = 0;
        if (!price_minor || price_minor < 0) price_minor = 0;

        database.transaction(() => {
            const queryCheck = database.prepare(`
                SELECT id FROM products WHERE id = ?
            `);

            const existingProduct = queryCheck.get(id);

            if (!existingProduct) {
                throw new NotFoundError('No hemos encontrado el producto solicitado.')
            };
            
            database.prepare(`
                UPDATE 
                    products
                SET
                    name = :name,
                    stock = :stock,
                    price_major = :price_major,
                    price_minor = :price_minor,
                    updated_at = :updated_at
                WHERE
                    id = :id
            `).run({
                name,
                stock,
                price_major: price_major*100,
                price_minor: price_minor*100,
                updated_at: date,
                id
            });

            if (filename !== null) {
                database.prepare(`
                    UPDATE 
                        products
                    SET
                        image_name = :filename
                    WHERE
                        id = :id
                `).run({
                    filename: filename,
                    id
                });
            };
        })();

        ResponseOk(res, responses.OK, null);
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
        const nameFilter = req.query.name ? `%${req.query.name}%` : null;
        const idFilter = req.query.id ? req.query.id : null;
        const barcodeFilter = req.query.barcode ? req.query.barcode : null;
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;
        const limit = 20;

        let products = [];

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
                ORDER BY p.created_at ASC
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

module.exports = router;