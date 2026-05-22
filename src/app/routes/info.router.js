const { Router } = require ('express');
const uuid = require('uuid');
const getLanIp = require('../helpers/getLanIp');
const { ResponseError, ResponseOk } = require('../helpers/controllerResponse');
const responses = require('../static/responses');
const { app } = require('electron');

const router = Router();

router.get('/', (_, res) => {
    res.json({
        ip: getLanIp() + ":4000"
    })
    .status(200);
});

router.get('/uuid', (_, res) => {
    try {
        ResponseOk(res, responses.OK, uuid.v7());
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

router.get('/data', (_, res) => {
    try {
        const endpoint = app.isPackaged ? 
            'https://libreriard.onrender.com' :
            'http://localhost:5000';

        ResponseOk(res, responses.OK, {
            endpoint: endpoint
        });
    } catch (error) {
        console.error(error);
        ResponseError(error);  
    };
});

module.exports = router;