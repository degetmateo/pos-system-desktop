const { Router } = require('express');
const keytar = require('keytar');
const RESPONSES = require('../static/responses');
const { SERVICE } = require('../static/consts.js');

const router = Router();

router.get('/status', (_, res) => {
    
});

router.post("/", async (req, res) => {
    // const { database } = req.body;

    // if (!database.name) return res.json({}).status(RESPONSES.NOT_ACCEPTABLE);
    // if (!database.host) return res.json({}).status(RESPONSES.NOT_ACCEPTABLE);
    // if (!database.port) return res.json({}).status(RESPONSES.NOT_ACCEPTABLE);
    // if (!database.user) return res.json({}).status(RESPONSES.NOT_ACCEPTABLE);
    // if (!database.pass) return res.json({}).status(RESPONSES.NOT_ACCEPTABLE);

    // await keytar.setPassword(SERVICE, 'db-name', database.name);
    // await keytar.setPassword(SERVICE, 'db-host', database.host);
    // await keytar.setPassword(SERVICE, 'db-port', database.port);
    // await keytar.setPassword(SERVICE, 'db-user', database.user);
    // await keytar.setPassword(SERVICE, 'db-pass', database.pass);

    // await postgres.start();

    // return res.json({}).status(RESPONSES.OK);
});

module.exports = router;