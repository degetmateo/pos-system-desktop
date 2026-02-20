const { database } = require('../database/database.js');
const ConflictError = require('../errors/conflictError.js');
const InvalidArgumentError = require('../errors/invalidArgumentError.js');
const NotFoundError = require('../errors/notFoundError.js');
const uuid = require('uuid');

const insert = (data) => {
    let {
        id,
        barcode, 
        name, 
        major_price, 
        minor_price, 
        stock, 
        provider_id,
        cost,
        minor_price_condition_1, 
        minor_price_condition_2, 
        minor_price_condition_3, 
        minor_price_condition_4,
        minor_price_value_1, 
        minor_price_value_2, 
        minor_price_value_3, 
        minor_price_value_4,
        image_filename
    } = data;

    const date = new Date().toISOString();

    database.transaction(() => {
        if (barcode) {
            if (barcode === 'INTERNAL_BARCODE') {
                const barcodes = database.prepare(`
                    SELECT * FROM metadata WHERE key = :key;
                `).get({ key: 'barcode' });
            
                const new_value = Number(barcodes.value_int) + 1;
                const year = new Date().getFullYear().toString().slice(-2);
                const prefix = 'RD';
                const padding = new_value.toString().padStart(9, '0');

                barcode = `${prefix}${year}${padding}`;
                
                database.prepare(`
                    UPDATE metadata
                    SET value_int = :value
                    WHERE key = :key;
                `).run({ value: new_value, key: 'barcode' });
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
        `).run(id, barcode, name, Number(stock), provider_id, image_filename, Number(major_price)*100, Number(minor_price)*100, date, date);

        const preparedQuery = database.prepare(`
            INSERT INTO minor_prices (id, product_id, condition, condition_value, price_value, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        `);

        const createMinorPrice = (condition, price) => {
            if (condition && condition > 0) {
                if (price && price > 0) {
                    const minorPriceId = uuid.v4();
                    preparedQuery.run(minorPriceId, id, 'discount', Number(condition), Number(price)*100, date, date);
                } else {
                    throw new InvalidArgumentError('Existe un descuento con precio cero o negativo.');
                };
            };
        };

        createMinorPrice(minor_price_condition_1, minor_price_value_1);
        createMinorPrice(minor_price_condition_2, minor_price_value_2);
        createMinorPrice(minor_price_condition_3, minor_price_value_3);
        createMinorPrice(minor_price_condition_4, minor_price_value_4);
    }).exclusive();
};

module.exports.productsRepository = {
    insert
};