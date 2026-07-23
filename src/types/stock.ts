export interface StockDefinition {
  name: string;
  currency: string;
  futunnParam: string;
  aastocksCode: string;
  yahooSymbol: string;
}

export interface StockPriceResult extends StockDefinition {
  marketPrice: number;
  changePercent: number;
}
