const { Router } = require('express');
const uuid = require('uuid');
const { database } = require('../database/database');
const responses = require('../static/responses');
const InvalidArgumentError = require('../errors/invalidArgumentError');
const { ResponseOk, ResponseError } = require('../controllers/response.controller');
const customersRepositoryUpdate = require('../repositories/customers.repository.update');

const router = Router();

router.post('/', (req, res) => {
    try {
        let { 
            name, 
            cuil, 
            email, 
            phone, 
            address,
            type
        } = req.body;

        const id = uuid.v4();
        const date = new Date().toISOString();

        if (!name || !name.trim()) throw new InvalidArgumentError();

        if (type) {
            if (!['minor', 'major'].includes(type)) throw new InvalidArgumentError();
        } else {
            type = null;
        };

        name = name + '';
        name = name.toUpperCase();

        database.prepare(`
            INSERT INTO customers (id, name, cuil, email, phone, address, created_at, updated_at, default_order_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, name, cuil, email, phone, address, date, date, type);

        ResponseOk(res, responses.CREATED, {
            id,
            name,
            cuil,
            email,
            phone,
            address,
            created_at: date,
            updated_at: date,
            default_order_type: type
        });
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

router.get('/', (req, res) => {
    try {
        const id_filter = req.query.id ? req.query.id : null;
        const name_filter = req.query.name ? `%${req.query.name}%` : null;
        const default_order_type = req.query.default_order_type ? `%${req.query.default_order_type}%` : null;
        const offset = req.query.offset ? Number(req.query.offset) : 0;
        const limit = 20;

        const customers = database.prepare(`
            SELECT * FROM 
                customers
            WHERE 
                (:name IS NULL OR name LIKE :name) AND
                (:id IS NULL OR id = :id) AND
                (:default_order_type IS NULL OR default_order_type = :default_order_type)
            GROUP BY 
                id
            ORDER BY 
                created_at ASC
            LIMIT 
                :limit 
            OFFSET 
                :offset;    
        `).all({ id: id_filter, name: name_filter, offset, limit, default_order_type });

        ResponseOk(res, responses.OK, customers);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);  
    };
});

router.put('/:id', async (req, res) => {
    try {
        const customerId = req.params.id;
        req.body.id = customerId;
        let { name, type } = req.body;

        if (!name) throw new InvalidArgumentError("Se requiere nombre.");
        if (type) {
            if (!['major', 'minor'].includes(type)) throw new InvalidArgumentError("Tipo incorrecto.");
        };

        req.body.name = name.toUpperCase();

        const response = await customersRepositoryUpdate(req.body);
        ResponseOk(res, responses.OK, response);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

module.exports = router;