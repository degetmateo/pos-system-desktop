const { database } = require("../database/database.js");
const NotFoundError = require("../errors/notFoundError.js");

const LIMIT = 20;

module.exports = (data = {
    sorting: null,
    offset: null,
    nameFilter: null,
    idFilter: null,
    barcodeFilter: null
}) => {
    let orderByClause;

    data.sorting === 'abc' ?
        orderByClause = "p.name COLLATE NOCASE ASC" :
        orderByClause = "p.created_at ASC";

    const queryParams = {
        id: data.idFilter,
        barcode: data.barcodeFilter,
        limit: LIMIT,
        offset: data.offset
    };

    let nameWhereClause = '1 = 1';
    if (data.nameFilter) {
        const words = data.nameFilter.trim().split(' ');
        const wordConditions = words.map((_, i) => `p.name LIKE :word${i} COLLATE NOCASE`);

        nameWhereClause = wordConditions.join(' AND ');

        words.forEach((word, i) => {
            queryParams[`word${i}`] = `%${word}%`;
        });
    };

    let products = [];
    
    database.transaction(() => {
        products = database.prepare(`
            SELECT 
                p.id,
                p.description, 
                p.barcode, 
                p.name, 
                p.stock, 
                p.provider_id,
                p.price_major,
                p.price_minor,
                p.created_at, 
                p.updated_at
            FROM products p

            WHERE
                deleted = 0 AND
                (${nameWhereClause}) AND
                (:id IS NULL OR p.id = :id) AND
                (:barcode IS NULL or p.barcode = :barcode)
            
            GROUP BY p.id
            ORDER BY ${orderByClause}
            LIMIT :limit 
            OFFSET :offset;    
        `).all(queryParams);

        for (let i = 0; i < products.length; i++) {
            const prices = database.prepare(`
                SELECT * FROM minor_prices WHERE product_id = :product_id;
            `).all({ product_id: products[i].id });

            products[i].minor_prices = prices;
        };
    })();

    return products;
};