const { database } = require("../database/database");

module.exports = async (data) => {
    const date = new Date().toISOString();
    database.transaction(() => {
        database.prepare(`
            UPDATE customers
            SET
                name = :name,
                cuil = :cuil,
                email = :email,
                phone = :phone,
                address = :address,
                default_order_type = :type,
                updated_at = :updated_at
            WHERE
                id = :id; 
        `).run({
            id: data.id,
            name: data.name,
            cuil: data.cuil,
            email: data.email,
            phone: data.phone,
            address: data.address,
            type: data.type,
            updated_at: date
        });
    })();
};