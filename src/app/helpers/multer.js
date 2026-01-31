const multer = require('multer');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(app.getPath('userData'), 'product_images');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const product_id = req.data.id || 'temp';
        const extension = path.extname(file.originalname);
        cb(null, `${product_id}${extension}`);
    }
});

module.exports.upload = multer({ storage });

const excel_storage = multer.memoryStorage();
module.exports.uploadExcel = multer({ storage: excel_storage });