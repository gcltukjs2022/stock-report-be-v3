import { StockDefinition } from "./stock";

export interface NewsItemWoArticle {
  stock: string;
  title: string;
  href: string;
  dateRaw: string | null;
  dateYYYYMMDD: string | null;
}

export interface NewsItem extends NewsItemWoArticle {
  article: string;
}

export interface StockWithNews extends StockDefinition {
  news: NewsItem[];
}
