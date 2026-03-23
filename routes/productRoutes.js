const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const productController = require('../controllers/productController');

// Cấu hình lưu trữ ảnh
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Các đường dẫn
router.get('/', productController.getAllProducts);
router.post('/add', upload.single('url_image'), productController.createProduct);
router.post('/delete/:id', productController.deleteProduct);

router.get('/detail/:id', productController.getDetail);
router.get('/edit/:id', productController.getEditPage);
router.post('/update', upload.single('url_image'), productController.updateProduct);
router.get('/search', productController.searchProducts);

module.exports = router;