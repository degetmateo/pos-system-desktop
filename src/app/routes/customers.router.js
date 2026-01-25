const { Router } = require('express');
const uuid = require('uuid');
const { database } = require('../database/database');
const { ResponseOk, ResponseError } = require('../helpers/controllerResponse');
const responses = require('../static/responses');

const router = Router();

router.post('/', (req, res) => {
    try {
        const { name, cuil, email, phone, address } = req.body;
        const id = uuid.v4();
        const date = new Date().toISOString();

        database.prepare(`
            INSERT INTO customers (id, name, cuil, email, phone, address, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, name, cuil, email, phone, address, date, date);

        ResponseOk(res, responses.CREATED, null);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

router.get('/', (_, res) => {
    try {
        const customers = database.prepare(`
            SELECT * FROM customers;
        `).all();

        ResponseOk(res, responses.OK, customers);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);  
    };
});

module.exports = router;