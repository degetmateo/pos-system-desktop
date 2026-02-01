const excel = require('exceljs');

const createInternalBook = (products) => {
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

    return book;
};

const createCustomerBook = (products) => {
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

    return book;
};

const parseInternalBook = async (buffer) => {
    const book = new excel.Workbook();
    await book.xlsx.load(buffer);
    const sheet = book.getWorksheet(1);
    const data = [];

    sheet.eachRow({ includeEmpty: false }, (row, number) => {
        if (number === 1) return;

        let barcode = row.getCell(2).value;

        if (barcode !== null && barcode !== undefined) {
            barcode = barcode.toString().split('.')[0];
        };

        data.push({
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
    return data;
};

module.exports.workbookModule = {
    createInternalBook,
    createCustomerBook,
    parseInternalBook
};