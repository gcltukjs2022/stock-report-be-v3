import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { STOCKS } from "../config/stocks";
import { getStockPrices } from "../services/priceService";
import { generateWordReport } from "../services/reportService";
import { NewsItem, StockWithNews } from "../types/news";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

export async function handler(): Promise<{ statusCode: number; s3Key: string }> {
  console.log("[Report Lambda] Starting report generation...");
  const tableName = process.env.DYNAMODB_TABLE;
  const bucketName = process.env.S3_BUCKET_NAME;

  if (!tableName || !bucketName) {
    throw new Error("DYNAMODB_TABLE or S3_BUCKET_NAME environment variable is missing!");
  }

  // 1. Fetch stock prices
  const pricesMap = await getStockPrices(STOCKS);

  // 2. Scan articles from DynamoDB
  const scanResult = await ddb.send(new ScanCommand({ TableName: tableName }));
  const dbItems = scanResult.Items || [];

  // Group news items per stock
  const newsMap = new Map<string, NewsItem[]>();
  for (const item of dbItems) {
    const stockName = item.stock as string;
    if (!newsMap.has(stockName)) {
      newsMap.set(stockName, []);
    }
    newsMap.get(stockName)!.push({
      stock: stockName,
      title: item.title,
      href: item.url,
      dateRaw: item.dateRaw,
      dateYYYYMMDD: item.dateYYYYMMDD,
      article: item.article,
    });
  }

  const stocksWithNews: StockWithNews[] = STOCKS.map((stock) => ({
    ...stock,
    news: newsMap.get(stock.name) || [],
  }));

  // Filter highlight stocks
  const highlightStocks = pricesMap.filter(
    (stock) => Math.abs(stock.changePercent) >= 5,
  );

  // 3. Generate Word document Buffer
  const { buffer, fileName } = await generateWordReport(
    highlightStocks,
    stocksWithNews,
    pricesMap,
  );

  // 4. Upload to S3 Bucket
  const s3Key = `reports/${fileName}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
  );

  console.log(`[Report Lambda] Report uploaded to S3: s3://${bucketName}/${s3Key}`);
  return { statusCode: 200, s3Key };
}
