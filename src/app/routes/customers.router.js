const { Router } = require('express');
const uuid = require('uuid');
const { database } = require('../database/database');
const { ResponseOk, ResponseError } = require('../helpers/controllerResponse');
const responses = require('../static/responses');
const InvalidArgumentError = require('../errors/invalidArgumentError');

const router = Router();

router.post('/', (req, res) => {
    try {
        let { name, cuil, email, phone, address } = req.body;
        const id = uuid.v4();
        const date = new Date().toISOString();

        if (!name || !name.trim()) throw new InvalidArgumentError();
        let test = '';

        name = name.toUpperCase();

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

router.get('/', (req, res) => {
    try {
        const id_filter = req.query.id ? req.query.id : null;
        const name_filter = req.query.name ? `%${req.query.name}%` : null;
        const offset = req.query.offset ? Number(req.query.offset) : 0;
        const limit = 20;

        const customers = database.prepare(`
            SELECT * FROM 
                customers
            WHERE 
                (:name IS NULL OR name LIKE :name) AND
                (:id IS NULL OR id = :id)
            GROUP BY 
                id
            ORDER BY 
                created_at ASC
            LIMIT 
                :limit 
            OFFSET 
                :offset;    
        `).all({ id: id_filter, name: name_filter, offset, limit });

        ResponseOk(res, responses.OK, customers);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);  
    };
});

module.exports = router;