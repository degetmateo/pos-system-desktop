const { Router } = require('express');
const uuid = require('uuid');

const { ResponseError, ResponseOk } = require('../helpers/controllerResponse');
const { database } = require('../database/database.js');
const responses = require('../static/responses');
const InvalidArgumentError = require('../errors/invalidArgumentError.js');
const ConflictError = require('../errors/conflictError.js');
const NotFoundError = require('../errors/notFoundError.js');

const router = Router();

router.get('/', (_, res) => {
    try {
        const providers = database.prepare(`
            SELECT * FROM providers;
        `).all();

        ResponseOk(res, responses.OK, providers);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);  
    };
});

router.post('/', (req, res) => {
    try {
        let { name } = req.body;
        if (!name || !name.trim()) throw new InvalidArgumentError();

        name = name.toUpperCase();

        database.transaction(() => {
            const provider = database.prepare(`
                SELECT * FROM providers WHERE name = :name;
            `).get({ name });

            if (provider) throw new ConflictError("Ya existe un proveedor con ese nombre.");

            const date = new Date().toISOString();

            database.prepare(`
                INSERT INTO providers (id, name, created_at, updated_at)
                VALUES (?, ?, ?, ?);
            `).run(uuid.v4(), name, date, date);
        })();

        ResponseOk(res, responses.CREATED, null);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);  
    };
});

router.delete('/:id', (req, res) => {
    try {
        const provider_id = req.params.id; 

        database.transaction(() => {
            const provider = database.prepare(`
                SELECT * FROM providers WHERE id = :id;
            `).get({ id: provider_id });

            if (!provider) throw new NotFoundError();

            database.prepare(`
                UPDATE products
                SET provider_id = NULL
                WHERE provider_id = :provider_id;
            `).run({ provider_id });

            database.prepare(`
                DELETE FROM providers WHERE id = :provider_id;
            `).run({ id: provider_id });
        })();
    } catch (error) {
        console.error(error);
        ResponseError(res, error);  
    };
});

module.exports = router;