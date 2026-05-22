const { Router } = require('express');
const { app, net } = require('electron');
const { database } = require("../database/database");
const { ResponseError, ResponseOk } = require('../controllers/response.controller');
const UnauthorizedError = require('../errors/unauthorizedError');
const responses = require('../static/responses');
const flowController = require('../controllers/flow.controller');
const ConflictError = require('../errors/conflictError');
const router = Router();

router.post('/products/synchronize', async (req, res) => {
    try {
        const authorization = req.headers['authorization'];
        if (!authorization) throw new UnauthorizedError();

        if (flowController.isSynzhronizing()) throw new ConflictError('¡Ya se están sincronizando los datos!');
        flowController.setSynchronizing(true);

        const endpoint = app.isPackaged ? 
            'https://libreriard.onrender.com' :
            'http://localhost:5000';

        const products = database.prepare(`
            SELECT * FROM products WHERE synchronized = 0;    
        `).all();

        const CHUNK_SIZE = 100;
        for (let i = 0; i < products.length; i += CHUNK_SIZE) {
            const chunk = products.slice(i, i + CHUNK_SIZE);

            const serverReq = await net.fetch(endpoint + '/api/products/synchronize', {
                method: "POST",
                headers: { 'content-type': 'application/json', 'authorization': authorization },
                body: JSON.stringify({ products: chunk })
            });
            const serverRes = await serverReq.json();

            if (req.ok) {
                for (const product of chunk) {
                    database.prepare(`
                        UPDATE products
                        SET synchronized = 1
                        WHERE id = :id;
                    `).run({ id: product.id });
                };
            };

            await new Promise((resolve, _) => {
                setTimeout(() => {
                    resolve(null);
                }, 1000);
            });
        };

        flowController.setSynchronizing(false);
        ResponseOk(res, responses.ACCEPTED, null);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

router.post('/products/desynchronize', (req, res) => {
    try {
        database.prepare(`
            UPDATE products
            SET synchronized = 0;
        `).run();
        ResponseOk(res, responses.OK, null);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

module.exports = router;