const { PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');
const fs = require('fs'); // Thêm dòng này để thao tác với file
const path = require('path'); // Thêm dòng này để xử lý đường dẫn

const TABLE_NAME = "Products";

// Lấy danh sách sản phẩm
exports.getAllProducts = async(req, res) => {
    const params = { TableName: TABLE_NAME };
    const msg = req.query.msg; // Nhận mã thông báo từ URL
    try {
        const data = await req.docClient.send(new ScanCommand(params));
        res.render('index', { products: data.Items, message: msg, keyword: undefined });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Thêm sản phẩm
exports.createProduct = async(req, res) => {
    const { name, price, unit_in_stock } = req.body;
    const url_image = req.file ? `/uploads/${req.file.filename}` : "";

    if (!name || !price || !unit_in_stock || !url_image) {
        return res.redirect('/?msg=error');
    }

    const numPrice = Number(price);
    const numStock = Number(unit_in_stock);

    const params = {
        TableName: TABLE_NAME,
        Item: { id: uuidv4(), name: name.trim(), price: numPrice, unit_in_stock: numStock, url_image: url_image }
    };

    try {
        await req.docClient.send(new PutCommand(params));
        res.redirect('/?msg=add_success');
    } catch (err) {
        res.redirect('/?msg=error');
    }
};

// Sửa hàm xóa sản phẩm
exports.deleteProduct = async(req, res) => {
    const { id } = req.params;

    try {
        // Bước 1: Lấy thông tin sản phẩm trước khi xóa để lấy đường dẫn ảnh
        const getParams = {
            TableName: TABLE_NAME,
            Key: { id: id }
        };
        const productData = await req.docClient.send(new GetCommand(getParams));
        const product = productData.Item;

        if (product && product.url_image) {
            // Bước 2: Xác định đường dẫn thực tế của file ảnh
            // Giả sử url_image có dạng: /uploads/ten-file.jpg
            // Chúng ta cần trỏ vào thư mục public thực tế
            const imagePath = path.join(__dirname, '..', 'public', product.url_image);

            // Bước 3: Kiểm tra xem file có tồn tại không và tiến hành xóa
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath); // Xóa file vật lý
                console.log(`✅ Đã xóa file ảnh: ${imagePath}`);
            }
        }

        // Bước 4: Xóa bản ghi trên DynamoDB
        await req.docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { id: id }
        }));

        res.redirect('/?msg=delete_success');
    } catch (err) {
        console.error("❌ Lỗi khi xóa sản phẩm và ảnh:", err);
        res.redirect('/?msg=error');
    }
};

// Cập nhật sản phẩm
// Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
    const { id, name, price, unit_in_stock, old_image } = req.body;
    
    // Mặc định dùng ảnh cũ, nếu có file mới thì dùng đường dẫn ảnh mới
    let new_image = old_image;
    let shouldDeleteOldImage = false;

    if (req.file) {
        new_image = `/uploads/${req.file.filename}`;
        shouldDeleteOldImage = true; // Đánh dấu cần xóa ảnh cũ
    }

    const params = {
        TableName: TABLE_NAME,
        Key: { id: id },
        UpdateExpression: "set #n = :n, price = :p, unit_in_stock = :s, url_image = :i",
        ExpressionAttributeNames: { "#n": "name" },
        ExpressionAttributeValues: {
            ":n": name,
            ":p": Number(price),
            ":s": Number(unit_in_stock),
            ":i": new_image
        }
    };

    try {
        // Bước 1: Cập nhật thông tin trên DynamoDB
        await req.docClient.send(new UpdateCommand(params));

        // Bước 2: Nếu có ảnh mới, tiến hành xóa file ảnh cũ trong thư mục public
        if (shouldDeleteOldImage && old_image) {
            // Lưu ý: old_image thường có dạng '/uploads/ten-file.jpg'
            // path.join sẽ giúp trỏ đúng vào thư mục public
            const oldImagePath = path.join(__dirname, '..', 'public', old_image);

            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
                console.log(`✅ Đã xóa ảnh cũ thành công: ${oldImagePath}`);
            }
        }

        res.redirect('/?msg=update_success');
    } catch (err) {
        console.error("❌ Lỗi khi cập nhật sản phẩm:", err);
        res.redirect('/?msg=error');
    }
};

//  getDetail, getEditPage và searchProducts...
exports.getDetail = async(req, res) => {
    try {
        const data = await req.docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { id: req.params.id } }));
        res.render('detail', { p: data.Item });
    } catch (err) { res.status(500).send(err.message); }
};

exports.getEditPage = async(req, res) => {
    try {
        const data = await req.docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { id: req.params.id } }));
        res.render('edit', { p: data.Item });
    } catch (err) { res.status(500).send(err.message); }
};

exports.searchProducts = async(req, res) => {
    const { keyword } = req.query;
    if (!keyword) return res.redirect('/');
    const params = {
        TableName: TABLE_NAME,
        FilterExpression: "contains(#n, :k)",
        ExpressionAttributeNames: { "#n": "name" },
        ExpressionAttributeValues: { ":k": keyword.trim() }
    };
    try {
        const data = await req.docClient.send(new ScanCommand(params));
        res.render('index', { products: data.Items, keyword: keyword, message: undefined });
    } catch (err) { res.status(500).send(err.message); }
};