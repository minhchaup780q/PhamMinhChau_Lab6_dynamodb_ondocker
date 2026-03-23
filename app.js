const express = require('express');
const path = require('path');
const { client, docClient } = require('./models/dbConfig');
const { CreateTableCommand, ListTablesCommand } = require("@aws-sdk/client-dynamodb");
const productRoutes = require('./routes/productRoutes');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use((req, res, next) => {
    req.docClient = docClient;
    next();
});

// Hàm khởi tạo DB có cơ chế tự động thử lại sau 5 giây nếu lỗi
async function initDB() {
    try {
        const data = await client.send(new ListTablesCommand({}));
        if (!data.TableNames.includes("Products")) {
            const params = {
                TableName: "Products",
                KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
                AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
            };
            await client.send(new CreateTableCommand(params));
            console.log("✅ Đã tạo bảng Products thành công!");
        } else {
            console.log("ℹ️ Bảng Products đã tồn tại.");
        }
    } catch (err) {
        // Nếu lỗi do chưa kết nối được, đợi 5s rồi thử lại
        console.error("⚠️ Đang chờ DynamoDB sẵn sàng... (Thử lại sau 5s)");
        setTimeout(initDB, 5000);
    }
}

// Bắt đầu khởi tạo
initDB();

app.use('/', productRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));