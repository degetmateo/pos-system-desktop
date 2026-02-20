const { Router } = require('express');
const { database } = require('../database/database.js');
const { ResponseError, ResponseOk } = require('../helpers/controllerResponse.js');
const responses = require('../static/responses.js');
const InvalidArgumentError = require('../errors/invalidArgumentError.js');
const NotFoundError = require('../errors/notFoundError.js');
const ReceiptTemplate = require('../templates/receipt.template.js');
const { BrowserWindow } = require('electron');
const { ordersRepository } = require('../repositories/orders.repository.js');

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
                SELECT * FROM orders o

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
            items,
            advancement
        } = req.body;

        if (!type) throw new InvalidArgumentError("Type is required.");
        if (!['major', 'minor'].includes(type)) throw new InvalidArgumentError("Incorrect type.");
        if (!['cash', 'transfer', 'card', 'current_account'].includes(payment_method)) payment_method = null;
        if (!items || items.length <= 0) throw new InvalidArgumentError("Items are required.");
        if (isNaN(Number(advancement))) throw new InvalidArgumentError();
        if (!advancement || advancement <= 0) advancement = 0;

        const response = ordersRepository.insert({
            type,
            customer,
            advancement,
            payment_method,
            items
        });

        ResponseOk(res, responses.CREATED, response);
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
        const { id } = req.params;
        const { action } = req.query;

        const request = await fetch('http://localhost:4000/api/orders?id='+id, {
            method: "GET"
        });

        const response = await request.json();
        const order = response.data[0];
        const html = ReceiptTemplate(order);

        if (action === 'print') {
            const htmlToPrint = html + `
                <script>
                    document.title = "check_${id}";
                    
                    window.onload = () => {
                        setTimeout(() => { 
                            window.print(); 
                            window.close();
                        }, 500);
                    }
                </script>
            `;

            res.setHeader('Content-Type', 'text/html');
            res.send(htmlToPrint);
        } else {
            let workerWindow = null;
            try {
                workerWindow = new BrowserWindow({
                    show: false,
                    webPreferences: { nodeIntegration: true }
                });

                await workerWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

                const buffer = await workerWindow.webContents.printToPDF({
                    printBackground: true,
                    format: "A4",
                    displayHeaderFooter: false,
                    margins: {
                        top: 0, 
                        bottom: 0, 
                        left: 0, 
                        right: 0
                    }
                });

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=check_${id}.pdf`);
                res.send(buffer);
            } catch (error) {
                throw error;
            } finally {
                if (workerWindow) workerWindow.close();
            };
        };
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

module.exports = router;