const { Router } = require('express');
const { app, net } = require('electron');
const InvalidArgumentError = require('../errors/invalidArgumentError');
const { ResponseOk, ResponseError } = require('../controllers/response.controller');
const responses = require('../static/responses');

const router = Router();

router.post('/', async (req, res) => {
    try {
        const endpoint = app.isPackaged ? 
            'https://libreriard.onrender.com' :
            'http://localhost:5000';
        
        const { email, password } = req.body;
        if (!email || !password) throw new InvalidArgumentError('Tenés que completar los campos.');

        const serverReq = await net.fetch(endpoint + '/api/authentication', {
            method: "POST",
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const serverRes = await serverReq.json();
        if (!serverReq.ok) throw new Error(serverRes.error.message);

        ResponseOk(res, responses.OK, serverRes);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

module.exports = router;