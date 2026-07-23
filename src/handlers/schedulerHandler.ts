import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { STOCKS } from "../config/stocks";
import { getAllowedDates } from "../utils/dateUtils";
import { hasChinese } from "../utils/textUtils";
import {
  buildAastocksNewsUrl,
  scrapeAastocksNewsList,
} from "../scrapers/sources/aastocks";
import { scrapeFutunnNewsList } from "../scrapers/sources/futunn";
import { NewsItemWoArticle } from "../types/news";
import { closeBrowser } from "../utils/playwrightHelper";

const sqs = new SQSClient({});

export async function handler(): Promise<{
  statusCode: number;
  count: number;
}> {
  console.log("[Scheduler Lambda] Starting news discovery...");

  const allowedDates = getAllowedDates();
  const queueUrl = process.env.QUEUE_URL;

  if (!queueUrl) {
    throw new Error("QUEUE_URL environment variable is missing!");
  }

  const allNewsItems: NewsItemWoArticle[] = [];

  try {
    for (const stock of STOCKS) {
      try {
        console.log(`[Scheduler Lambda] Processing ${stock.name}...`);

        // 1. AAStocks
        const aastocksUrl = buildAastocksNewsUrl(stock.aastocksCode);

        const aastocksNews = await scrapeAastocksNewsList(
          aastocksUrl,
          stock.name,
        );

        const filteredAastocks = aastocksNews.filter(
          (n) =>
            n.dateYYYYMMDD &&
            allowedDates.has(n.dateYYYYMMDD) &&
            hasChinese(n.title),
        );

        allNewsItems.push(...filteredAastocks);

        // 2. Futunn
        const futunnUrl = `https://www.futunn.com/hk/stock/${stock.futunnParam}/news`;

        const futunnNews = await scrapeFutunnNewsList(futunnUrl, stock.name);

        const filteredFutunn = futunnNews.filter(
          (n) =>
            n.dateYYYYMMDD &&
            allowedDates.has(n.dateYYYYMMDD) &&
            hasChinese(n.title),
        );

        allNewsItems.push(...filteredFutunn);

        console.log(
          `[Scheduler Lambda] Finished ${stock.name}. ` +
            `Found ${filteredAastocks.length + filteredFutunn.length} articles.`,
        );
      } catch (err) {
        console.error(
          `[Scheduler Lambda] Error fetching list for ${stock.name}:`,
          err,
        );

        // Continue processing next stock
        continue;
      }
    }

    // Deduplicate by article URL
    const uniqueItemsMap = new Map<string, NewsItemWoArticle>();

    for (const item of allNewsItems) {
      if (!uniqueItemsMap.has(item.href)) {
        uniqueItemsMap.set(item.href, item);
      }
    }

    const uniqueNews = Array.from(uniqueItemsMap.values());

    console.log(
      `[Scheduler Lambda] Total unique articles found: ${uniqueNews.length}. ` +
        `Pushing to SQS...`,
    );

    // Send messages to SQS in batches of 10
    for (let i = 0; i < uniqueNews.length; i += 10) {
      const chunk = uniqueNews.slice(i, i + 10);

      const entries = chunk.map((item, idx) => ({
        Id: `msg_${i + idx}`,
        MessageBody: JSON.stringify(item),
      }));

      await sqs.send(
        new SendMessageBatchCommand({
          QueueUrl: queueUrl,
          Entries: entries,
        }),
      );
    }

    console.log(
      `[Scheduler Lambda] Successfully queued ${uniqueNews.length} articles.`,
    );

    return {
      statusCode: 200,
      count: uniqueNews.length,
    };
  } catch (err) {
    console.error("[Scheduler Lambda] Fatal error:", err);

    throw err;
  } finally {
    // Important:
    // Only closes the browser after ALL scraping is finished.
    console.log("[Scheduler Lambda] Cleaning up Playwright browser...");

    await closeBrowser();
  }
}

// import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
// import { STOCKS } from "../config/stocks";
// import { getAllowedDates } from "../utils/dateUtils";
// import { hasChinese } from "../utils/textUtils";
// import {
//   buildAastocksNewsUrl,
//   scrapeAastocksNewsList,
// } from "../scrapers/sources/aastocks";
// import { scrapeFutunnNewsList } from "../scrapers/sources/futunn";
// import { NewsItemWoArticle } from "../types/news";

// const sqs = new SQSClient({});

// export async function handler(): Promise<{
//   statusCode: number;
//   count: number;
// }> {
//   console.log("[Scheduler Lambda] Starting news discovery...");
//   const allowedDates = getAllowedDates();
//   const queueUrl = process.env.QUEUE_URL;

//   if (!queueUrl) {
//     throw new Error("QUEUE_URL environment variable is missing!");
//   }

//   const allNewsItems: NewsItemWoArticle[] = [];

//   for (const stock of STOCKS) {
//     try {
//       // 1. AAStocks
//       const aastocksUrl = buildAastocksNewsUrl(stock.aastocksCode);
//       const aastocksNews = await scrapeAastocksNewsList(
//         aastocksUrl,
//         stock.name,
//       );
//       const filteredAastocks = aastocksNews.filter(
//         (n) =>
//           n.dateYYYYMMDD &&
//           allowedDates.has(n.dateYYYYMMDD) &&
//           hasChinese(n.title),
//       );
//       allNewsItems.push(...filteredAastocks);

//       // 2. Futunn
//       const futunnUrl = `https://www.futunn.com/hk/stock/${stock.futunnParam}/news`;
//       const futunnNews = await scrapeFutunnNewsList(futunnUrl, stock.name);
//       const filteredFutunn = futunnNews.filter(
//         (n) =>
//           n.dateYYYYMMDD &&
//           allowedDates.has(n.dateYYYYMMDD) &&
//           hasChinese(n.title),
//       );
//       allNewsItems.push(...filteredFutunn);
//     } catch (err) {
//       console.error(
//         `[Scheduler Lambda] Error fetching list for ${stock.name}:`,
//         err,
//       );
//     }
//   }

//   // Deduplicate by article URL
//   const uniqueItemsMap = new Map<string, NewsItemWoArticle>();
//   for (const item of allNewsItems) {
//     if (!uniqueItemsMap.has(item.href)) {
//       uniqueItemsMap.set(item.href, item);
//     }
//   }

//   const uniqueNews = Array.from(uniqueItemsMap.values());
//   console.log(
//     `[Scheduler Lambda] Total unique articles found: ${uniqueNews.length}. Pushing to SQS...`,
//   );

//   // Batch send to SQS in groups of 10
//   for (let i = 0; i < uniqueNews.length; i += 10) {
//     const chunk = uniqueNews.slice(i, i + 10);
//     const entries = chunk.map((item, idx) => ({
//       Id: `msg_${i + idx}`,
//       MessageBody: JSON.stringify(item),
//     }));

//     await sqs.send(
//       new SendMessageBatchCommand({
//         QueueUrl: queueUrl,
//         Entries: entries,
//       }),
//     );
//   }

//   console.log(
//     `[Scheduler Lambda] Successfully queued ${uniqueNews.length} articles.`,
//   );
//   return { statusCode: 200, count: uniqueNews.length };
// }
