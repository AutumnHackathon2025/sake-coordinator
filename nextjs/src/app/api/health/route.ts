import { NextResponse } from "next/server";

/**
 * ヘルスチェックエンドポイント
 * ECSのヘルスチェックで使用される
 */
export async function GET() {
  try {
    // 基本的なヘルスチェック情報
    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "unknown",
      service: "nextjs-app"
    };

    // DynamoDB接続チェック（オプション）
    // let dbStatus = "unknown";
    // try {
    //   // 設定ファイルから設定を取得
    //   const { awsConfig, dynamodbConfig } = await import("@/lib/config");
      
    //   // DynamoDBクライアントが利用可能かチェック
    //   if (awsConfig.region && dynamodbConfig.tableName) {
    //     const { dynamodbClient } = await import("@/lib/dynamodb");
    //     const { ListTablesCommand } = await import("@aws-sdk/client-dynamodb");
        
    //     // 簡単な接続テスト
    //     await dynamodbClient.send(new ListTablesCommand({}));
    //     dbStatus = "connected";
    //   } else {
    //     dbStatus = "not_configured";
    //   }
    // } catch (error) {
    //   console.warn("DynamoDB health check failed:", error);
    //   dbStatus = "disconnected";
    // }

    const response = {
      ...healthStatus,
      // dependencies: {
      //   database: dbStatus
      // }
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Health check failed:", error);
    
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Internal server error",
        service: "nextjs-app"
      },
      { status: 503 }
    );
  }
}