const { Router } = require('express');
const { ResponseError, ResponseOk, ResponseExcel } = require('../controllers/response.controller');
const { uploadExcel } = require('../helpers/multer');
const InvalidArgumentError = require('../errors/invalidArgumentError');
const responses = require('../static/responses');
const { listsRepository } = require('../repositories/lists.repository');
const { workbookModule } = require('../modules/workbook.module');

const router = Router();

router.get('/products-internal', async (req, res) => {
    try {
        const products = listsRepository.get();
        const book = workbookModule.createInternalBook(products);
        ResponseExcel(res, book, `LISTA_INTERNA_RD_${new Date().getTime()}`);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);  
    };
});

router.get('/products-customers', async (req, res) => {
    try {
        const products = listsRepository.getForCustomers();
        const book = workbookModule.createCustomerBook(products);
        ResponseExcel(res, book, 'LISTA_DE_PRECIOS_RUBEN_DARIO');
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

router.post('/products-internal', uploadExcel.single('excel'), async (req, res) => {
    try {
        if (!req.file) throw new InvalidArgumentError('No se subió ningún archivo.');
        const products = await workbookModule.parseInternalBook(req.file.buffer);
        listsRepository.update(products);
        ResponseOk(res, responses.ACCEPTED, null);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);  
    };
});

module.exports = router;