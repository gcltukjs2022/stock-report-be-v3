import axios from "axios";
import { getEnvConfig } from "../config/env";
import { fetchStocksFromDB } from "../services/dynamoService";
import { StockDefinition, StockPriceResult } from "../types/stock";

interface YahooQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
}

interface YahooQuoteResponse {
  quoteResponse: {
    result: YahooQuote[];
    error: string | null;
  };
}

export async function getStockPrices(
  stocks?: StockDefinition[],
): Promise<StockPriceResult[]> {
  const env = getEnvConfig();

  // Load stocks from DynamoDB if not provided
  if (!stocks) {
    stocks = await fetchStocksFromDB();
  }

  if (!env.yahooApiUrl || !env.rapidApiKey || !env.rapidApiHost) {
    throw new Error(
      "Missing required environment variables: YAHOO_API, RAPIDAPI_KEY, RAPIDAPI_HOST",
    );
  }

  const symbols = stocks.map((s) => s.yahooSymbol).join(",");

  try {
    const response = await axios.request<YahooQuoteResponse>({
      method: "GET",
      url: env.yahooApiUrl,
      params: {
        region: "US",
        symbols,
      },
      headers: {
        "X-RapidAPI-Key": env.rapidApiKey,
        "X-RapidAPI-Host": env.rapidApiHost,
      },
    });

    const quotes = response.data.quoteResponse.result || [];
    const quoteBySymbol = new Map<string, YahooQuote>(
      quotes.map((q) => [q.symbol, q]),
    );

    const results: StockPriceResult[] = [];

    for (const stock of stocks) {
      const quote = quoteBySymbol.get(stock.yahooSymbol);
      if (!quote) {
        console.warn(`[PriceService] No quote returned for symbol: ${stock.yahooSymbol}`);
        continue;
      }

      results.push({
        ...stock,
        marketPrice: quote.regularMarketPrice,
        changePercent: quote.regularMarketChangePercent,
      });
    }

    return results;
  } catch (err) {
    console.error("[PriceService] Failed to fetch Yahoo stock prices:", err);
    throw err;
  }
}
