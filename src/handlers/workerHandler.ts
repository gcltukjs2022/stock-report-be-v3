import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { NewsItemWoArticle } from "../types/news";
import { scrapeFutunnArticleBody } from "../scrapers/sources/futunn";
import { scrapeAastocksArticleBody } from "../scrapers/sources/aastocks";
import { extractChineseContent, toSimplified } from "../utils/textUtils";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function handler(event: { Records: { body: string }[] }): Promise<void> {
  const tableName = process.env.DYNAMODB_TABLE;
  if (!tableName) {
    throw new Error("DYNAMODB_TABLE environment variable is missing!");
  }

  for (const record of event.Records) {
    try {
      const item: NewsItemWoArticle = JSON.parse(record.body);
      console.log(`[Worker Lambda] Scraping article: ${item.title} (${item.href})...`);

      let rawArticle = "";
      if (item.href.includes("futunn.com")) {
        rawArticle = await scrapeFutunnArticleBody(item.href);
      } else {
        rawArticle = await scrapeAastocksArticleBody(item.href);
      }

      if (!rawArticle || rawArticle.trim() === "") {
        console.warn(`[Worker Lambda] Empty article body for ${item.href}`);
        continue;
      }

      const chineseArticle = extractChineseContent(rawArticle);
      const articleText = toSimplified(chineseArticle);

      if (!articleText || articleText.trim() === "") {
        console.warn(`[Worker Lambda] No Chinese text extracted for ${item.href}`);
        continue;
      }

      await ddb.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            url: item.href,
            stock: item.stock,
            title: item.title,
            article: articleText,
            dateRaw: item.dateRaw,
            dateYYYYMMDD: item.dateYYYYMMDD,
            fetchedAt: new Date().toISOString(),
          },
        }),
      );

      console.log(`[Worker Lambda] Saved article to DynamoDB: ${item.title}`);
    } catch (err) {
      console.error(`[Worker Lambda] Failed to process record:`, err);
    }
  }
}
