// src/services/dynamoService.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { StockDefinition } from "../types/stock";

// Region can be overridden via AWS_REGION env variable; default to ap-east-1 (used elsewhere)
const REGION = process.env.AWS_REGION || "ap-east-1";

const ddbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

/**
 * Fetch all stock definitions from the DynamoDB `Stocks` table.
 * Returns an array of {@link StockDefinition} objects.
 */
export async function fetchStocksFromDB(): Promise<StockDefinition[]> {
  const command = new ScanCommand({ TableName: "Stocks" });
  const result = await ddbClient.send(command);
  // The Items array may be undefined if the table is empty.
  return (result.Items ?? []) as StockDefinition[];
}
