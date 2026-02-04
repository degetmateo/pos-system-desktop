const uuid = require('uuid');
const { database } = require('../database/database.js');
const NotFoundError = require('../errors/notFoundError.js');
const GenericError = require('../errors/genericError.js');
const InvalidArgumentError = require('../errors/invalidArgumentError.js');

const insert = (data) => {
    const qOrdersCount = database.prepare(`
        SELECT * FROM metadata WHERE key = :key;
    `);

    const qCustomer = database.prepare(`
        SELECT * FROM customers WHERE id = :id;
    `);

    const qProduct = database.prepare(`
        SELECT * FROM products WHERE id = :id;
    `);

    const qInsertOrderItem = database.prepare(`
        INSERT INTO order_item (id, order_id, product_id, quantity, created_at, updated_at, price, product_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `);

    const qMinorPrices = database.prepare(`
        SELECT * FROM minor_prices WHERE product_id = :product_id;
    `);

    const qInsertDiscounts = database.prepare(`
        INSERT INTO discounts (id, minor_price_id, order_id, product_id, original_price, discount_price)
        VALUES (?, ?, ?, ?, ?, ?);
    `);

    const qInsertOrder = database.prepare(`
        INSERT INTO orders (
            id, 
            number, 
            customer_id, 
            payment_method, 
            total_price, 
            type, 
            created_at, 
            updated_at, 
            status,
            advancement
        ) VALUES (
            :id, 
            :number, 
            :customer_id, 
            :payment_method, 
            :total_price, 
            :type, 
            :created_at, 
            :updated_at, 
            :status,
            :advancement
        );
    `);

    const qUpdateOrderMetadata = database.prepare(`
        UPDATE metadata
        SET value_int = :value
        WHERE id = :id;
    `);

    let {
        type,
        payment_method,
        customer,
        items,
        advancement
    } = data;

    const orderId = uuid.v4();
    const date = new Date().toISOString();

    database.transaction(() => {
        const ordersCount = qOrdersCount.get({ key: 'orders-count' });
        const count = ordersCount.value_int;

        if (customer) {
            customer = qCustomer.get({ id: customer.id });
            if (!customer) throw new NotFoundError("No existe tal cliente.");
        };

        let amount = 0;
        
        if (type === 'major') {
            for (const item of items) {
                const product = qProduct.get({ id: item.id });

                if (!product) throw new NotFoundError();
                if (!product.price_major || product.price_major <= 0) throw new GenericError(`${product.name} no tiene precio mayorista.`);

                amount += product.price_major * item.quantity;

                const orderItemId = uuid.v4();

                qInsertOrderItem.run(
                    orderItemId, 
                    orderId, 
                    product.id, 
                    item.quantity, 
                    date, 
                    date, 
                    product.price_major, 
                    product.name
                );                 
            };
        } else {
            for (const item of items) {
                const product = qProduct.get({ id: item.id });

                if (!product) throw new NotFoundError();
                if (!product.price_minor || product.price_minor <= 0) throw new GenericError(`${product.name} no tiene precio minorista.`);
        
                const minorPrices = qMinorPrices.all({ product_id: product.id });
                const quantity = Number(item.quantity);

                let minorPriceId = null;
                let minorPriceCondition = 0;
                let minorPrice = product.price_minor;

                for (let j = 0; j < minorPrices.length; j++) {
                    if (quantity >= Number(minorPrices[j].condition_value)) {
                        if (minorPriceCondition < Number(minorPrices[j].condition_value)) {
                            minorPriceId = minorPrices[j].id;
                            minorPriceCondition = Number(minorPrices[j].condition_value);
                            minorPrice = Number(minorPrices[j].price_value);
                        };
                    };
                };

                if (minorPriceId) {
                    const discount_id = uuid.v4();
                    qInsertDiscounts.run(
                        discount_id, 
                        minorPriceId, 
                        orderId, 
                        product.id,
                        product.price_minor, 
                        minorPrice
                    );
                };

                amount += minorPrice * quantity;

                const orderItemId = uuid.v4();

                qInsertOrderItem.run(
                    orderItemId, 
                    orderId, 
                    product.id, 
                    item.quantity, 
                    date, 
                    date, 
                    product.price_minor, 
                    product.name
                );
            };
        };

        const advancementAmount = amount - advancement;
        if (advancementAmount < 0) throw new InvalidArgumentError('El adelanto hace que el precio final sea negativo.');
        
        qInsertOrder.run({
            id: orderId, 
            number: count + 1, 
            customer_id: customer ? customer.id : null, 
            payment_method: payment_method ? payment_method : null, 
            total_price: amount, 
            type: type, 
            created_at: date, 
            updated_at: date, 
            status: "PENDING",
            advancement: advancement
        });

        qUpdateOrderMetadata.run({ value: count + 1, id: ordersCount.id });
    }).exclusive();

    return orderId;
};

module.exports.ordersRepository = {
    insert
};