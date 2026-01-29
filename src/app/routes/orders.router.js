const { Router } = require('express');
const uuid = require('uuid');
const { database } = require('../database/database.js');
const { ResponseError, ResponseOk } = require('../helpers/controllerResponse.js');
const responses = require('../static/responses.js');
const InvalidArgumentError = require('../errors/invalidArgumentError.js');
const NotFoundError = require('../errors/notFoundError.js');
const GenericError = require('../errors/genericError.js');
const PDFCreator = require('../helpers/pdf.creator.js');

const router = Router();

router.get('/', (req, res) => {
    try {
        const id = req.query.id ? req.query.id : null;
        const customer_id = req.query.customer_id ? req.query.customer_id : null;
        const type = req.query.type ? req.query.type : null;
        const status = req.query.status ? req.query.status : null;
        const offset = req.query.offset ? req.query.offset : 0;
        const limit = 20;

        let orders;

        database.transaction(() => {
            orders = database.prepare(`
                SELECT 
                    o.id,
                    o.number,
                    o.customer_id,
                    o.total_price,
                    o.type,
                    o.payment_method,
                    o.created_at,
                    o.updated_at,
                    o.status
                FROM orders o

                WHERE 
                    (:id IS NULL OR o.id = :id) AND
                    (:customer_id IS NULL OR o.customer_id = :customer_id) AND
                    (:type IS NULL OR o.type = :type) AND
                    (:status IS NULL OR o.status = :status)
                
                GROUP BY 
                    o.id
                ORDER BY 
                    o.created_at 
                DESC
                LIMIT 
                    :limit 
                OFFSET
                    :offset;
            `).all({
                id,
                customer_id,
                type,
                status,
                limit,
                offset
            });

            for (let i = 0; i < orders.length; i++) {
                if (!orders[i].customer_id) continue;

                const customer = database.prepare(`
                    SELECT * FROM customers WHERE id = :id;
                `).get({ id: orders[i].customer_id });

                orders[i].customer = customer;
            };

            for (let i = 0; i < orders.length; i++) {
                const items = database.prepare(`
                    SELECT * FROM order_item WHERE order_id = :order_id;
                `).all({ order_id: orders[i].id });

                for (const item of items) {
                    const product = database.prepare(`
                        SELECT * FROM products WHERE id = :id;
                    `).get({ id: item.product_id });

                    item.product = product;
                };

                orders[i].items = items;
            };

            for (let i = 0; i < orders.length; i++) {
                let discounts = database.prepare(`
                    SELECT * FROM discounts WHERE order_id = :order_id;
                `).all({ order_id: orders[i].id });

                if (!discounts || discounts.length <= 0) discounts = [];

                orders[i].discounts = discounts;
            };
        })();

        ResponseOk(res, responses.OK, orders);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

router.post('/', (req, res) => {
    try {
        let {
            type,
            payment_method,
            customer,
            items 
        } = req.body;

        if (!type) throw new InvalidArgumentError("Type is required.");
        if (!['major', 'minor'].includes(type)) throw new InvalidArgumentError("Incorrect type.");
        if (!['cash', 'transfer', 'card', 'current_account'].includes(payment_method)) payment_method = null;
        if (!items || items.length <= 0) throw new InvalidArgumentError("Items are required.");

        
        database.transaction(() => {
            const order_id = uuid.v4();
            const date = new Date().toISOString();

            const orders_count = database.prepare(`
                SELECT * FROM metadata WHERE key = :key;
            `).get({ key: 'orders-count' });
    
            const count = orders_count.value_int;

            if (customer) {
                const qCustomer = database.prepare(`
                    SELECT * FROM customers WHERE id = :id;
                `).get({
                    id: customer.id
                });

                if (!qCustomer) throw new NotFoundError("No existe tal cliente.");
            };

            let amount = 0;
            
            if (type === 'major') {
                for (const item of items) {
                    const product = database.prepare(`
                        SELECT * FROM products WHERE id = :id;
                    `).get({
                        id: item.id
                    });
    
                    if (!product) throw new NotFoundError();
                    if (!product.price_major || product.price_major <= 0) throw new GenericError(`${product.name} no tiene precio mayorista.`);

                    amount += product.price_major * item.quantity;

                    const order_item_id = uuid.v4();

                    database.prepare(`
                        INSERT INTO order_item (id, order_id, product_id, quantity, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `).run(order_item_id, order_id, product.id, item.quantity, date, date);
                };
            } else {
                for (const item of items) {
                    const product = database.prepare(`
                        SELECT * FROM products WHERE id = :id;
                    `).get({
                        id: item.id
                    });
    
                    if (!product) throw new NotFoundError();
                    if (!product.price_minor || product.price_minor <= 0) throw new GenericError(`${product.name} no tiene precio minorista.`);
         
                    const minor_prices = database.prepare(`
                        SELECT * FROM minor_prices WHERE product_id = :product_id;
                    `).all({ product_id: product.id });

                    const quantity = Number(item.quantity);

                    let minor_price_id = null;
                    let minor_price_condition = 0;
                    let minor_price = product.price_minor;

                    for (let j = 0; j < minor_prices.length; j++) {
                        if (quantity >= Number(minor_prices[j].condition_value)) {
                            if (minor_price_condition < Number(minor_prices[j].condition_value)) {
                                minor_price_id = minor_prices[j].id;
                                minor_price_condition = Number(minor_prices[j].condition_value);
                                minor_price = Number(minor_prices[j].price_value);
                            };
                        };
                    };

                    if (minor_price_id) {
                        const discount_id = uuid.v4();

                        database.prepare(`
                            INSERT INTO discounts (id, minor_price_id, order_id)
                            VALUES (?, ?, ?);
                        `).run(discount_id, minor_price_id, order_id);
                    };

                    amount += minor_price * quantity;

                    const order_item_id = uuid.v4();
                    database.prepare(`
                        INSERT INTO order_item (id, order_id, product_id, quantity, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `).run(order_item_id, order_id, product.id, item.quantity, date, date);
                };
            };

            database.prepare(`
                INSERT INTO orders (
                    id, 
                    number, 
                    customer_id, 
                    payment_method, 
                    total_price, 
                    type, 
                    created_at, 
                    updated_at, 
                    status
                ) VALUES (
                    :id, 
                    :number, 
                    :customer_id, 
                    :payment_method, 
                    :total_price, 
                    :type, 
                    :created_at, 
                    :updated_at, 
                    :status
                );
            `).run({
                id: order_id, 
                number: count + 1, 
                customer_id: customer ? customer.id : null, 
                payment_method: payment_method ? payment_method : null, 
                total_price: amount, 
                type: type, 
                created_at: date, 
                updated_at: date, 
                status: "PENDING"
            });

            database.prepare(`
                UPDATE metadata
                SET value_int = :value
                WHERE id = :id;
            `).run({ value: count + 1, id: orders_count.id });
        }).exclusive();

        ResponseOk(res, responses.CREATED, null);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

router.put('/update-status/:id', (req, res) => {
    try {
        const id = req.params.id;
        const status = req.body.status;

        if (!status) throw new InvalidArgumentError();
        if (status != 'COMPLETED' && status != 'CANCELLED' && status != "PENDING") throw new InvalidArgumentError();

        database.transaction(() => {
            const order = database.prepare(`
                SELECT * FROM orders WHERE id = :id; 
            `).get({ id });

            if (!order) throw new NotFoundError();

            database.prepare(`
                UPDATE 
                    orders
                SET
                    status = :status
                WHERE
                    id = :id;
            `).run({ id, status });
        })();

        ResponseOk(res, responses.ACCEPTED, null);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

router.get('/receipt/:id', async (req, res) => {
    try {
        const order_id = req.params.id;
        if (!order_id) throw new InvalidArgumentError();

        const request = await fetch('http://localhost:4000/api/orders?id='+order_id, {
            method: "GET"
        });

        const response = await request.json();
        const order = response.data[0];

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=factura_${order_id}.pdf`);

        const doc = PDFCreator.receipt(order);

        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

module.exports = router;