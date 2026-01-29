const { Router } = require('express');
const { database } = require('../database/database');
const { ResponseOk, ResponseError } = require('../helpers/controllerResponse');
const responses = require('../static/responses');

const router = Router();

router.get('/new', (_, res) => {
    try {
        const barcodes = database.prepare(`
            SELECT * FROM metadata WHERE key = :key;
        `).get({ key: 'barcode' });
        
        const id = barcodes.value_int + 1;
        const year = new Date().getFullYear().toString().slice(-2);
        const prefix = 'RD';
        const padding = id.toString().padStart(9, '0');

        const barcode = `${prefix}${year}${padding}`;

        ResponseOk(res, responses.OK, barcode);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

module.exports = router;