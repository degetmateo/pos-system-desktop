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
                (:name IS NULL OR p.name LIKE :name COLLATE NOCASE) AND
                (:id IS NULL OR p.id = :id) AND
                (:barcode IS NULL or p.barcode = :barcode)
            
            GROUP BY p.id
            ORDER BY ${orderByClause}
            LIMIT :limit 
            OFFSET :offset;    
        `).all({
            name: data.nameFilter,
            id: data.idFilter,
            barcode: data.barcodeFilter,
            limit: LIMIT,
            offset: data.offset
        });

        for (let i = 0; i < products.length; i++) {
            const prices = database.prepare(`
                SELECT * FROM minor_prices WHERE product_id = :product_id;
            `).all({ product_id: products[i].id });

            products[i].minor_prices = prices;
        };
    })();

    return products;
};