const uuid = require('uuid');
const { database } = require("../database/database.js");
const InvalidArgumentError = require('../errors/invalidArgumentError.js');

module.exports = (data) => {
    const {
        id,
        barcode,
        name,
        provider_id,
        price_major,
        price_minor,        
        minor_price_condition_1,
        minor_price_condition_2,
        minor_price_condition_3,
        minor_price_condition_4,
        minor_price_value_1,
        minor_price_value_2,
        minor_price_value_3,
        minor_price_value_4,
    } = data;

    const date = new Date().toISOString();

    database.transaction(() => {
        database.prepare(`
            UPDATE 
                products
            SET
                barcode = :barcode,
                name = :name,
                price_major = :price_major,
                price_minor = :price_minor,
                provider_id = :provider_id
            WHERE
                id = :id;
        `).run({ id, barcode, name, price_major, price_minor, provider_id });

        database.prepare(`
            DELETE FROM minor_prices 
            WHERE product_id = :product_id;
        `).run({ product_id: id });

        const preparedQuery = database.prepare(`
            INSERT INTO minor_prices (id, product_id, condition, condition_value, price_value, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        `);

        const createMinorPrice = (condition, price) => {
            if (condition && condition > 0) {
                if (price && price > 0) {
                    const minorPriceId = uuid.v4();
                    preparedQuery.run(minorPriceId, id, 'discount', Number(condition), Number(price), date, date);
                } else {
                    throw new InvalidArgumentError('Existe un descuento con precio cero.');
                };
            };
        };

        createMinorPrice(minor_price_condition_1, minor_price_value_1);
        createMinorPrice(minor_price_condition_2, minor_price_value_2);
        createMinorPrice(minor_price_condition_3, minor_price_value_3);
        createMinorPrice(minor_price_condition_4, minor_price_value_4);
    }).exclusive();
};