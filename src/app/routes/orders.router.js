const { Router } = require('express');
const uuid = require('uuid');
const Printer = require('pdfmake');
const path = require('path');
const { database } = require('../database/database.js');
const { ResponseError, ResponseOk } = require('../helpers/controllerResponse.js');
const responses = require('../static/responses.js');
const InvalidArgumentError = require('../errors/invalidArgumentError.js');
const NotFoundError = require('../errors/notFoundError.js');
const GenericError = require('../errors/genericError.js');

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
        })();

        ResponseOk(res, responses.OK, orders);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

router.post('/', (req, res) => {
    try {
        let { customer_id, type, items } = req.body;

        if (!type) throw new InvalidArgumentError("Type is required.");
        if (!items || items.length <= 0) throw new InvalidArgumentError("Items are required.");

        if (customer_id === 'none') customer_id = null;

        const order_id = uuid.v4();
        const date = new Date().toISOString();
        
        database.transaction(() => {
            const orders_count = database.prepare(`
                SELECT * FROM metadata WHERE key = :key;
            `).get({ key: 'orders-count' });
    
            const count = orders_count.value_int;

            if (customer_id) {
                const customer = database.prepare(`
                    SELECT * FROM customers WHERE id = :id;
                `).get({
                    id: customer_id
                });

                if (!customer) throw new NotFoundError();
            };

            let total_price = 0;

            for (const item of items) {
                const product = database.prepare(`
                    SELECT * FROM products WHERE id = :id;
                `).get({
                    id: item.id
                });

                if (!product) throw new NotFoundError();

                if (type === 'major') {
                    if (!product.price_major || product.price_major <= 0) 
                        throw new GenericError(`${product.name} no tiene precio mayorista.`);
                    total_price += product.price_major * item.quantity;
                }
                else if (type === 'minor') {
                    if (!product.price_minor || product.price_minor <= 0)
                        throw new GenericError(`${product.name} no tiene precio minorista.`);
                    total_price += product.price_minor * item.quantity;
                } else {
                    throw new InvalidArgumentError();
                };

                const order_item_id = uuid.v4();

                database.prepare(`
                    INSERT INTO order_item (id, order_id, product_id, quantity, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(order_item_id, order_id, product.id, item.quantity, date, date);
            };

            database.prepare(`
                INSERT INTO orders (id, number, customer_id, total_price, type, created_at, updated_at, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(order_id, count + 1, customer_id, total_price, type, date, date, "PENDING");

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

const fonts = {
    Roboto: {
        normal: path.join(__dirname, '../../shared/fonts/Roboto-Regular.ttf'),
        bold: path.join(__dirname, '../../shared/fonts/Roboto-Bold.ttf')
    }
};

const printer = new Printer(fonts);

router.get('/receipt/:id', async (req, res) => {
    try {
        const order_id = req.params.id;
        if (!order_id) throw new InvalidArgumentError();

        const request = await fetch('http://localhost:4000/api/orders?id='+order_id, {
            method: "GET"
        });

        const response = await request.json();
        const order = response.data[0];

        // 1. Preparar las filas de la tabla de productos
        const tableBody = [
            [
            { text: 'Producto', style: 'tableHeader' },
            { text: 'Cant.', style: 'tableHeader', alignment: 'center' },
            { text: 'Precio Unit.', style: 'tableHeader', alignment: 'right' },
            { text: 'Subtotal', style: 'tableHeader', alignment: 'right' }
            ]
        ];

        order.items.forEach(item => {
            // Usamos el precio según el tipo de orden (mayorista o minorista)
            const precio = order.type === 'major' ? item.product.price_major : item.product.price_minor;
            const subtotal = precio * item.quantity;

            tableBody.push([
                item.product.name,
                    { text: item.quantity.toString(), alignment: 'center' },
                    { text: `$${(precio/100).toLocaleString()}`, alignment: 'right' },
                    { text: `$${(subtotal/100).toLocaleString()}`, alignment: 'right' }
            ]);
        });

        // 2. Definición del Documento
        const docDefinition = {
            content: [
            // Encabezado
            {
                columns: [
                    { text: 'LIBRERIA RUBEN DARIO', style: 'brand' },
                    { text: `ORDEN DE VENTA N° ${order.number}`, alignment: 'right', style: 'orderTitle' }
                ]
            },
            { text: `Fecha: ${new Date(order.created_at).toLocaleDateString()}`, alignment: 'right', margin: [0, 0, 0, 20] },

            { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#eeeeee' }] },

            // Información del Cliente
            {
                margin: [0, 20, 0, 20],
                columns: [
                {
                    text: [
                    { text: 'CLIENTE:\n', style: 'subheader' },
                    { text: `${order.customer ? order.customer.name : 'N/D'}\n`, bold: true },
                    { text: `CUIL: ${order.customer ? order.customer.cuil : 'N/D'}\n` },
                    { text: `Email: ${order.customer ? order.customer.email : 'N/D'}` }
                    ]
                },
                {
                    text: [
                        { text: 'ESTADO:\n', style: 'subheader' },
                        { text: order.status, color: order.status === 'PENDING' ? 'orange' : 'green' }
                    ],
                    alignment: 'right'
                }
                ]
            },

            // Tabla de Items
            {
                table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto', 'auto'],
                body: tableBody
                },
                layout: 'lightHorizontalLines'
            },

            // Total
            {
                margin: [0, 20, 0, 0],
                columns: [
                { text: '', width: '*' },
                {
                    width: 'auto',
                    table: {
                    body: [
                        [
                        { text: 'TOTAL:', style: 'totalLabel' },
                        { text: `$${(order.total_price / 100).toLocaleString()}`, style: 'totalAmount' }
                        ]
                    ]
                    },
                    layout: 'noBorders'
                }
                ]
            }
            ],
            styles: {
            brand: { fontSize: 18, bold: true, color: '#2c3e50' },
            orderTitle: { fontSize: 14, bold: true },
            subheader: { fontSize: 10, color: 'gray', marginBottom: 4 },
            tableHeader: { bold: true, fontSize: 11, color: 'black', margin: [0, 5, 0, 5] },
            totalLabel: { fontSize: 14, bold: true, margin: [0, 5, 20, 5] },
            totalAmount: { fontSize: 16, bold: true, color: '#27ae60' }
            }
        };

        const doc = printer.createPdfKitDocument(docDefinition);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=factura_${order_id}.pdf`);

        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error(error);
    }
});

module.exports = router;