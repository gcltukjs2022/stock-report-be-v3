import { validateEnvConfig } from "./config/env";
import { fetchStocksFromDB } from "./services/dynamoService";
import { getStockPrices } from "./services/priceService";
import { fetchAllStockNews } from "./scrapers/newsService";
import { generateWordReport } from "./services/reportService";
// import { closeBrowser } from "./scrapers/core/browser";
import { closeBrowser } from "./utils/playwrightHelper";
import { StockPriceResult } from "./types/stock";

async function main(): Promise<void> {
  console.log("[Stock Report Pipeline] Starting execution...");
  validateEnvConfig();
  const stocks = await fetchStocksFromDB();

  try {
    // 1. Fetch stock prices
    console.log("[Step 1/3] Fetching stock prices from Yahoo Finance...");
    let priceResults: StockPriceResult[] = [];
    try {
      priceResults = await getStockPrices(stocks);
      console.log(
        `[Step 1/3] Successfully fetched prices for ${priceResults.length} stocks.`,
      );
    } catch (err) {
      console.warn(
        "[Step 1/3] Warning: Price fetching failed. Continuing with empty price list.",
      );
    }

    // 2. Scrape news articles across AAStocks and Futunn
    console.log("[Step 2/3] Scraping news articles for target portfolio...");
    const stockNewsResults = await fetchAllStockNews(stocks);
    const totalArticles = stockNewsResults.reduce(
      (acc, s) => acc + s.news.length,
      0,
    );
    console.log(
      `[Step 2/3] Completed news scraping. Total articles found: ${totalArticles}`,
    );

    // Filter stocks with absolute change >= 5% for highlight section
    const highlightStocks = priceResults.filter(
      (stock) => Math.abs(stock.changePercent) >= 5,
    );

    // 3. Generate Word Document Report
    console.log("[Step 3/3] Generating Word (.docx) stock report...");
    const { fileName, filePath } = await generateWordReport(
      highlightStocks,
      stockNewsResults,
      priceResults,
    );

    console.log(`[Success] Stock report successfully generated!`);
    console.log(`[Success] File saved to: ${filePath}`);
  } catch (err) {
    console.error("[Fatal Error] Stock report pipeline execution failed:", err);
    process.exit(1);
  } finally {
    // Safely close browser instance
    console.log("[Cleanup] Closing Playwright browser resources...");
    await closeBrowser();
  }
}

// Run application
main();
