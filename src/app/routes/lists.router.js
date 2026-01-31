const { Router } = require('express');
const excel = require('exceljs');
const uuid = require('uuid');
const { ResponseError, ResponseOk } = require('../controllers/response.controller');
const { database } = require('../database/database');
const { uploadExcel } = require('../helpers/multer');
const InvalidArgumentError = require('../errors/invalidArgumentError');
const responses = require('../static/responses');

const router = Router();

router.get('/products-internal', async (req, res) => {
    try {
        const products = database.prepare(`
            SELECT * FROM products;
        `).all();

        const queryMinorPrices = database.prepare(`
            SELECT * FROM minor_prices WHERE product_id = :product_id;
        `);

        const queryProvider = database.prepare(`
            SELECT * FROM providers WHERE id = :id;
        `);

        for (let i = 0; i < products.length; i++) {
            const minor_prices = queryMinorPrices.all({ product_id: products[i].id });
            minor_prices.sort((a, b) => a.condition_value - b.condition_value);
            products[i].minor_prices = minor_prices;

            const provider = queryProvider.get({ id: products[i].provider_id });
            products[i].provider = provider;
        };

        const book  = new excel.Workbook();
        const sheet = book.addWorksheet('reporte');

        sheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'CÓDIGO', key: 'barcode', width: 12 },
            { header: 'NOMBRE', key: 'name', width: 24 },
            { header: 'PROVEEDOR', key: 'provider', width: 24 },
            { header: 'P. MAYOR.', key: 'major_price', width: 14 },
            { header: 'P. MINOR.', key: 'minor_price', width: 14 },

            { header: 'COND. DESC. 1', key: 'discount_cond_1', width: 16 },
            { header: 'PRECIO DESC. 1', key: 'discount_price_1', width: 16 },

            { header: 'COND. DESC. 2', key: 'discount_cond_2', width: 16 },
            { header: 'PRECIO DESC. 2', key: 'discount_price_2', width: 16 },

            { header: 'COND. DESC. 3', key: 'discount_cond_3', width: 16 },
            { header: 'PRECIO DESC. 3', key: 'discount_price_3', width: 16 },

            { header: 'COND. DESC. 4', key: 'discount_cond_4', width: 16 },
            { header: 'PRECIO DESC. 4', key: 'discount_price_4', width: 16 },
        ];

        const header = sheet.getRow(1);

        header.eachCell((cell) => {
            cell.font = {
                name: 'Arial',
                bold: true
            }
            cell.alignment = {
                vertical: 'middle',
                horizontal: 'center'
            }
        });

        for (let i = 0; i < products.length; i++) {
            const minor_prices = products[i].minor_prices;
            sheet.addRow({
                id: products[i].id,
                barcode: products[i].barcode,
                name: products[i].name,
                provider: products[i].provider ? products[i].provider.name : 'SIN ASIGNAR',
                major_price: products[i].price_major / 100,
                minor_price: products[i].price_minor / 100,

                discount_cond_1: (minor_prices[0] ? minor_prices[0].condition_value : 0),
                discount_price_1: (minor_prices[0] ? minor_prices[0].price_value : 0) / 100,
               
                discount_cond_2: (minor_prices[1] ? minor_prices[1].condition_value : 0),
                discount_price_2: (minor_prices[1] ? minor_prices[1].price_value : 0) / 100,

                discount_cond_3: (minor_prices[2] ? minor_prices[2].condition_value : 0),
                discount_price_3: (minor_prices[2] ? minor_prices[2].price_value : 0) / 100,

                discount_cond_4: (minor_prices[3] ? minor_prices[3].condition_value : 0),
                discount_price_4: (minor_prices[3] ? minor_prices[3].price_value : 0) / 100
            });
        };

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        
        res.setHeader(
            'Content-Disposition', 
            'attachment; filename=' + `rd_lista_interna_${new Date().getTime()}.xlsx`
        );

        await book.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        ResponseError(res, error);  
    };
});

router.get('/products-customers', async (req, res) => {
    try {
        const products = database.prepare(`
            SELECT * FROM products;
        `).all();

        const book  = new excel.Workbook();
        const sheet = book.addWorksheet('reporte');

        sheet.columns = [
            { header: 'CÓDIGO', key: 'barcode', width: 12 },
            { header: 'NOMBRE', key: 'name', width: 24 },
            { header: 'P. MAYOR.', key: 'major_price', width: 14 },
            { header: 'P. MINOR.', key: 'minor_price', width: 14 }
        ];

        const header = sheet.getRow(1);

        header.eachCell((cell) => {
            cell.font = {
                name: 'Arial',
                bold: true
            }
            cell.alignment = {
                vertical: 'middle',
                horizontal: 'center'
            }
        });

        for (let i = 0; i < products.length; i++) {
            sheet.addRow({
                barcode: products[i].barcode,
                name: products[i].name,
                major_price: products[i].price_major / 100,
                minor_price: products[i].price_minor / 100
            });
        };

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        
        res.setHeader(
            'Content-Disposition', 
            'attachment; filename=' + `LIBRERIA_RUBEN_DARIO.xlsx`
        );

        await book.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        ResponseError(res, error);
    };
});

router.post('/products-internal', uploadExcel.single('excel'), async (req, res) => {
    try {
        if (!req.file) throw new InvalidArgumentError('No se subió ningún archivo.');
        
        const date = new Date().toISOString();
        const book = new excel.Workbook();
        await book.xlsx.load(req.file.buffer);
        const sheet = book.getWorksheet(1);
        const datos = [];

        sheet.eachRow({ includeEmpty: false }, (row, number) => {
            if (number === 1) return;

            let barcode = row.getCell(2).value;

            if (barcode !== null && barcode !== undefined) {
                barcode = barcode.toString().split('.')[0];
            };

            datos.push({
                id: row.getCell(1).value,
                barcode: barcode,
                name: row.getCell(3).value,
                provider: row.getCell(4).value,
                price_major: row.getCell(5).value,
                price_minor: row.getCell(6).value,

                discount_cond_1: row.getCell(7).value,
                discount_price_1: row.getCell(8).value,

                discount_cond_2: row.getCell(9).value,
                discount_price_2: row.getCell(10).value,

                discount_cond_3: row.getCell(11).value,
                discount_price_3: row.getCell(12).value,

                discount_cond_4: row.getCell(13).value,
                discount_price_4: row.getCell(14).value
            });
        });

        const update_product = database.prepare(`
            UPDATE products
            SET
                barcode = :barcode,
                name = :name,
                price_major = :price_major,
                price_minor = :price_minor,
                updated_at = :updated_at
            WHERE
                id = :id;
        `);

        const delete_minor_prices = database.prepare(`
            DELETE FROM minor_prices WHERE product_id = :product_id;
        `);

        const create_minor_price = database.prepare(`
            INSERT INTO minor_prices (id, product_id, condition, condition_value, price_value, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        `);

        database.transaction(() => {
            for (const product of datos) {
                update_product.run({
                    id: product.id,
                    barcode: product.barcode,
                    name: product.name,
                    price_major: product.price_major * 100,
                    price_minor: product.price_minor * 100,
                    updated_at: date
                });

                delete_minor_prices.run({ product_id: product.id });

                if (product.discount_cond_1 && product.discount_cond_1 > 0) {
                    const id = uuid.v4();
                    create_minor_price.run(
                        id, 
                        product.id, 
                        'discount', 
                        product.discount_cond_1,
                        product.discount_price_1 * 100,
                        date,
                        date
                    );
                };

                if (product.discount_cond_2 && product.discount_cond_2 > 0) {
                    const id = uuid.v4();
                    create_minor_price.run(
                        id, 
                        product.id, 
                        'discount', 
                        product.discount_cond_2,
                        product.discount_price_2 * 100,
                        date,
                        date
                    );
                };

                if (product.discount_cond_3 && product.discount_cond_3 > 0) {
                    const id = uuid.v4();
                    create_minor_price.run(
                        id, 
                        product.id, 
                        'discount', 
                        product.discount_cond_3,
                        product.discount_price_3 * 100,
                        date,
                        date
                    );
                };

                if (product.discount_cond_4 && product.discount_cond_4 > 0) {
                    const id = uuid.v4();
                    create_minor_price.run(
                        id, 
                        product.id, 
                        'discount', 
                        product.discount_cond_4,
                        product.discount_price_4 * 100,
                        date,
                        date
                    );
                };
            };
        }).exclusive();

        ResponseOk(res, responses.ACCEPTED, null);
    } catch (error) {
        console.error(error);
        ResponseError(res, error);  
    };
});

module.exports = router;