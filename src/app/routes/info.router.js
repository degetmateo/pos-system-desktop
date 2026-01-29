const { Router } = require ('express');
const uuid = require('uuid');
const getLanIp = require('../helpers/getLanIp');
const { ResponseError, ResponseOk } = require('../helpers/controllerResponse');
const responses = require('../static/responses');

const router = Router();

router.get('/', (_, res) => {
    res.json({
        ip: getLanIp() + ":4000"
    })
    .status(200);
});

router.get('/uuid', (_, res) => {
    try {
        ResponseOk(res, responses.OK, uuid.v4());
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

module.exports = router;