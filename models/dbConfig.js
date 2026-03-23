const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
require('dotenv').config();

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-west-2",
    endpoint: process.env.DYNAMODB_ENDPOINT || "http://dynamodb-local:8000",
    credentials: {
        // Sửa ở đây:
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "fakeMyKeyId",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "fakeSecretAccessKey"
    }
});

const docClient = DynamoDBDocumentClient.from(client);
module.exports = { docClient, client };