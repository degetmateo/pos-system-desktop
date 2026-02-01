const { database } = require("../database/database");
const uuid = require('uuid');

const qProducts = database.prepare(`
    SELECT * FROM products;
`);

const qMinorPrices = database.prepare(`
    SELECT * FROM minor_prices WHERE product_id = :product_id;
`);

const qProvider = database.prepare(`
    SELECT * FROM providers WHERE id = :id;
`);

const get = () => {
    const products = qProducts.all();

    for (let i = 0; i < products.length; i++) {
        const minor_prices = qMinorPrices.all({ product_id: products[i].id });
        minor_prices.sort((a, b) => a.condition_value - b.condition_value);
        products[i].minor_prices = minor_prices;

        const provider = qProvider.get({ id: products[i].provider_id });
        products[i].provider = provider;
    };

    return products;
};

const update_product = database.prepare(`
    UPDATE products
    SET
        barcode = :barcode,
        name = :name,
        price_major = :price_major,
        price_minor = :price_minor,
        updated_at = :updated_at
    WHERE
        id = :id;
`);

const delete_minor_prices = database.prepare(`
    DELETE FROM minor_prices WHERE product_id = :product_id;
`);

const create_minor_price = database.prepare(`
    INSERT INTO minor_prices (id, product_id, condition, condition_value, price_value, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?);
`);

const update = (data) => {
    const date = new Date().toISOString();
    database.transaction(() => {
        for (const product of data) {
            update_product.run({
                id: product.id,
                barcode: product.barcode,
                name: product.name,
                price_major: product.price_major * 100,
                price_minor: product.price_minor * 100,
                updated_at: date
            });

            delete_minor_prices.run({ product_id: product.id });

            if (product.discount_cond_1 && product.discount_cond_1 > 0) {
                const id = uuid.v4();
                create_minor_price.run(
                    id, 
                    product.id, 
                    'discount', 
                    product.discount_cond_1,
                    product.discount_price_1 * 100,
                    date,
                    date
                );
            };

            if (product.discount_cond_2 && product.discount_cond_2 > 0) {
                const id = uuid.v4();
                create_minor_price.run(
                    id, 
                    product.id, 
                    'discount', 
                    product.discount_cond_2,
                    product.discount_price_2 * 100,
                    date,
                    date
                );
            };

            if (product.discount_cond_3 && product.discount_cond_3 > 0) {
                const id = uuid.v4();
                create_minor_price.run(
                    id, 
                    product.id, 
                    'discount', 
                    product.discount_cond_3,
                    product.discount_price_3 * 100,
                    date,
                    date
                );
            };

            if (product.discount_cond_4 && product.discount_cond_4 > 0) {
                const id = uuid.v4();
                create_minor_price.run(
                    id, 
                    product.id, 
                    'discount', 
                    product.discount_cond_4,
                    product.discount_price_4 * 100,
                    date,
                    date
                );
            };
        };
    }).exclusive();
};

const getForCustomers = () => {
    const products = qProducts.all();
    return products;
};

module.exports.listsRepository = {
    get,
    update,
    getForCustomers
};