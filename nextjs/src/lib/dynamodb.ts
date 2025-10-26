import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// DynamoDB Localへの接続設定
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
  endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
  // credentials: {
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID || "dummy",
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "dummy",
  // },
});

// DynamoDBDocumentClientを作成（高レベルAPI用）
const dynamodbDoc = DynamoDBDocumentClient.from(client);

export { client as dynamodbClient, dynamodbDoc };