import pLimit from "p-limit";
import { STOCKS } from "../config/stocks";
import { StockDefinition } from "../types/stock";
import { NewsItem, StockWithNews } from "../types/news";
import { getAllowedDates } from "../utils/dateUtils";
import { toSimplified, extractChineseContent, hasChinese } from "../utils/textUtils";
import {
  buildAastocksNewsUrl,
  scrapeAastocksNewsList,
  scrapeAastocksArticleBody,
} from "./sources/aastocks";
import {
  scrapeFutunnNewsList,
  scrapeFutunnArticleBody,
} from "./sources/futunn";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetches and aggregates news for all defined stocks from AAStocks and Futunn.
 */
export async function fetchAllStockNews(
  stocks: StockDefinition[] = STOCKS,
): Promise<StockWithNews[]> {
  const allowedDates = getAllowedDates();

  // 1. Scrape AAStocks in parallel across all stocks
  const aastocksTasks = stocks.map(async (stock): Promise<StockWithNews> => {
    const url = buildAastocksNewsUrl(stock.aastocksCode);
    const rawNews = await scrapeAastocksNewsList(url, stock.name);

    // Filter out articles with invalid dates or pure-English titles
    const filteredNews = rawNews.filter(
      (n) => n.dateYYYYMMDD && allowedDates.has(n.dateYYYYMMDD) && hasChinese(n.title),
    );

    const newsItems: NewsItem[] = await Promise.all(
      filteredNews.map(async (item) => {
        try {
          const rawArticle = await scrapeAastocksArticleBody(item.href);
          const chineseArticle = extractChineseContent(rawArticle);
          const article = toSimplified(chineseArticle);
          return { ...item, article };
        } catch (err) {
          console.error(`[NewsService] AAStocks body fetch error for ${item.href}`);
          return { ...item, article: "" };
        }
      }),
    );

    return { ...stock, news: newsItems };
  });

  // 2. Scrape Futunn using concurrency rate-limiting (max 2 concurrent browser tasks)
  const futunnLimit = pLimit(2);
  const futunnTasks = stocks.map((stock) =>
    futunnLimit(async (): Promise<StockWithNews> => {
      const url = `https://www.futunn.com/hk/stock/${stock.futunnParam}/news`;
      
      // Rate-limit spacing between stock list page fetches
      await sleep(500 + Math.random() * 500);
      const rawNews = await scrapeFutunnNewsList(url, stock.name);

      // Filter out articles with invalid dates or pure-English titles
      const filteredNews = rawNews.filter(
        (n) => n.dateYYYYMMDD && allowedDates.has(n.dateYYYYMMDD) && hasChinese(n.title),
      );

      const newsResults: (NewsItem | null)[] = [];
      for (const item of filteredNews) {
        try {
          await sleep(500 + Math.random() * 500);
          const rawArticle = await scrapeFutunnArticleBody(item.href);
          if (!rawArticle || rawArticle.trim() === "") continue;

          const chineseArticle = extractChineseContent(rawArticle);
          const article = toSimplified(chineseArticle);
          if (!article || article.trim() === "") continue;

          newsResults.push({ ...item, article });
        } catch (err) {
          console.error(`[NewsService] Futunn body fetch error for ${item.href}`);
        }
      }

      const newsItems = newsResults.filter(
        (item): item is NewsItem => item !== null,
      );

      return { ...stock, news: newsItems };
    }),
  );

  // Run both source pipelines concurrently
  const [aastocksResults, futunnResults] = await Promise.all([
    Promise.all(aastocksTasks),
    Promise.all(futunnTasks),
  ]);

  // Merge news items per stock
  const mergedResults: StockWithNews[] = stocks.map((stock, i) => ({
    ...stock,
    news: [...aastocksResults[i].news, ...futunnResults[i].news],
  }));

  return mergedResults;
}
