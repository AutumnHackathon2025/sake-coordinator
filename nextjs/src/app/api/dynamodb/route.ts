import { NextRequest, NextResponse } from "next/server";
import { dynamodbClient, dynamodbDoc } from "@/lib/dynamodb";
import { CreateTableCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { PutCommand, ScanCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = "SampleTable";

// テーブル作成
async function createTable() {
  try {
    const createTableCommand = new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [
        { AttributeName: "id", KeyType: "HASH" }
      ],
      AttributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" }
      ],
      BillingMode: "PAY_PER_REQUEST",
    });

    await dynamodbClient.send(createTableCommand);
    return { success: true, message: "Table created successfully" };
  } catch (error: any) {
    if (error.name === "ResourceInUseException") {
      return { success: true, message: "Table already exists" };
    }
    throw error;
  }
}

// テーブル一覧取得
async function listTables() {
  const command = new ListTablesCommand({});
  const result = await dynamodbClient.send(command);
  return result.TableNames || [];
}

// アイテム追加
async function putItem(data: any) {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      id: data.id || Date.now().toString(),
      name: data.name,
      description: data.description,
      createdAt: new Date().toISOString(),
    },
  });
  
  const result = await dynamodbDoc.send(command);
  return result;
}

// 全アイテム取得
async function getAllItems() {
  const command = new ScanCommand({
    TableName: TABLE_NAME,
  });
  
  const result = await dynamodbDoc.send(command);
  return result.Items || [];
}

// アイテム取得
async function getItem(id: string) {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { id },
  });
  
  const result = await dynamodbDoc.send(command);
  return result.Item;
}

// アイテム削除
async function deleteItem(id: string) {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { id },
  });
  
  const result = await dynamodbDoc.send(command);
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const id = searchParams.get("id");

    switch (action) {
      case "list-tables":
        const tables = await listTables();
        return NextResponse.json({ tables });

      case "create-table":
        const createResult = await createTable();
        return NextResponse.json(createResult);

      case "get-item":
        if (!id) {
          return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }
        const item = await getItem(id);
        return NextResponse.json({ item });

      case "get-all":
      default:
        const items = await getAllItems();
        return NextResponse.json({ items });
    }
  } catch (error: any) {
    console.error("DynamoDB GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await putItem(body);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("DynamoDB POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const result = await deleteItem(id);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("DynamoDB DELETE Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}