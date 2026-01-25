const { Router } = require("express");
const uuid = require('uuid');
const { ResponseOk, ResponseError, ResponseFile } = require("../helpers/controllerResponse");
const responses = require("../static/responses");
const database = require("../database/database");
const ConflictError = require("../errors/conflictError");
const { upload } = require("../helpers/multer");
const path = require('path');
const { app } = require("electron");
const NotFoundError = require("../errors/notFoundError");
const GenericError = require("../errors/genericError");

const router = Router();

router.post('/', (req, _, next) => {
    req.data = {
        id: uuid.v4()
    };

    next();
}, upload.single('image'), async (req, res) => {
    let { barcode, name, stock, price_major, price_minor } = JSON.parse(req.body.data);
    const date = new Date().toISOString();

    const product_id = req.data.id;
    const image_filename = req.file ? req.file.filename : null;

    if (!barcode) throw new GenericError();
    if (!name) throw new GenericError();

    if (!stock || stock < 0) stock = 0;
    if (!price_major || price_major < 0) price_major = 0;
    if (!price_minor || price_minor < 0) price_minor = 0;

    try {
        database.db.transaction(() => {
            const queryCheck = database.db.prepare(`
                SELECT id FROM products WHERE barcode = ?
            `);

            const existingProduct = queryCheck.get(barcode);

            if (existingProduct) {
                throw new ConflictError('Ya existe un producto con este código de barras.')
            };

            database.db.prepare(`
                INSERT INTO products (id, barcode, name, stock, image_name, price_major, price_minor, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(product_id, barcode, name, stock, image_filename, price_major*100, price_minor*100, date, date);
        })();

        const createdProduct = {
            id: product_id,
            barcode,
            name,
            stock,
            price_major: price_major*100,
            price_minor: price_minor*100
        };

        ResponseOk(res, responses.CREATED, createdProduct);
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

        database.db.transaction(() => {
            const queryCheck = database.db.prepare(`
                SELECT id FROM products WHERE id = ?
            `);

            const existingProduct = queryCheck.get(id);

            if (!existingProduct) {
                throw new NotFoundError('No hemos encontrado el producto solicitado.')
            };
            
            database.db.prepare(`
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
                database.db.prepare(`
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
        const product = await database.db.prepare(`
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

        const query = `
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
        `;

        const products = database.db.prepare(query).all({
            name: nameFilter,
            id: idFilter,
            barcode: barcodeFilter,
            limit: limit,
            offset: offset
        });

        if (products.length <= 0) throw new NotFoundError();

        ResponseOk(res, responses.OK, products);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

module.exports = router;