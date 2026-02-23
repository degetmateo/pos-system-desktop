const path = require('path');
const { Router } = require('express');
const { app } = require('electron');
const { ResponseError } = require('../controllers/response.controller');

const router = Router();

router.get('/download-database', (req, res) => {
    try {
        const databasePath = path.join(app.getPath('userData'), 'data.db');
        res.download(databasePath, 'data.db', (err) => {
            if (err) throw err;
        });
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

module.exports = router;