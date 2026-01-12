const { Router } = require ('express');
const getLanIp = require('../helpers/getLanIp');

const router = Router();

router.get('/', (_, res) => {
    res.json({
        ip: getLanIp() + ":4000"
    })
    .status(200);
});

module.exports = router;