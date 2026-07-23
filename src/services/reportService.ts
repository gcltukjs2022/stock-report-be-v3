import {
  Document,
  HeightRule,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import * as fs from "fs";
import moment from "moment";
import * as os from "os";
import path from "path";
import { StockPriceResult } from "../types/stock";
import { StockWithNews } from "../types/news";
import { toSimplified } from "../utils/textUtils";

const CURRENCY_LABEL: Record<string, string> = {
  USD: "美元",
  HKD: "港币",
  RMB: "人民币",
};

const currencyLabel = (currency: string): string =>
  CURRENCY_LABEL[currency] || "元";

const formatMonthDay = (currency: string): { month: string; day: string } => {
  const month =
    currency === "USD"
      ? moment(new Date()).subtract(1, "month").format("M")
      : moment(new Date()).format("M");
  const day =
    currency === "USD"
      ? moment(new Date()).subtract(1, "day").format("D")
      : moment(new Date()).format("D");
  return { month, day };
};

export interface GeneratedReport {
  buffer: Buffer;
  fileName: string;
  filePath: string;
}

export async function generateWordReport(
  highlightStocks: StockPriceResult[],
  stockNewsList: StockWithNews[],
  allStockPrices: StockPriceResult[],
): Promise<GeneratedReport> {
  const currentDate = new Date();
  const currentDayOfMonth = currentDate.getDate();

  // 1. Highlight Paragraphs
  const highlightParagraphs: Paragraph[] = highlightStocks.map((stock) => {
    const isFirstOfMonth = currentDayOfMonth === 1;
    const month = isFirstOfMonth
      ? formatMonthDay(stock.currency).month
      : moment(new Date()).format("M");
    const day =
      stock.currency === "USD"
        ? moment(new Date()).subtract(1, "day").format("D")
        : moment(new Date()).format("D");

    return new Paragraph({
      children: [
        new TextRun({
          text: `${stock.name} ${month} 月 ${day} 日 ${
            stock.changePercent > 0 ? "涨幅" : "跌幅"
          } ${Math.abs(stock.changePercent).toFixed(1)}%, 收盘价 ${
            stock.marketPrice
          } ${currencyLabel(stock.currency)}`,
          bold: true,
          highlight: "yellow",
        }),
      ],
    });
  });

  // 2. News Article Paragraphs
  const articlesParagraphs: Paragraph[] = [];
  for (const stock of stockNewsList) {
    if (stock.news.length === 0) continue;

    articlesParagraphs.push(
      new Paragraph({ children: [] }),
      new Paragraph({
        children: [
          new TextRun({
            text: stock.name,
            bold: true,
            highlight: "yellow",
          }),
        ],
      }),
    );

    for (const newsItem of stock.news) {
      const simplifiedTitle = toSimplified(newsItem.title);
      articlesParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: simplifiedTitle, bold: true })],
        }),
        new Paragraph({
          children: [new TextRun(newsItem.article)],
        }),
        new Paragraph({ children: [] }),
      );
    }
  }

  // 3. Price Summary Table Header
  const tableHeader = new Table({
    columnWidths: [901, 901, 7208],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 901, type: WidthType.DXA },
            children: [new Paragraph("Project")],
          }),
          new TableCell({
            width: { size: 901, type: WidthType.DXA },
            children: [new Paragraph("Local CCY")],
          }),
          new TableCell({
            width: { size: 7208, type: WidthType.DXA },
            children: [new Paragraph("Combine")],
          }),
        ],
        height: { value: 700, rule: HeightRule.EXACT },
      }),
    ],
  });

  // 4. Price Summary Table Rows
  const tableRows = allStockPrices.map((stock) => {
    const isFirstOfMonth = currentDayOfMonth === 1;
    const month = isFirstOfMonth
      ? formatMonthDay(stock.currency).month
      : moment(new Date()).format("M");
    const day =
      stock.currency === "USD"
        ? moment(new Date()).subtract(1, "day").format("D")
        : moment(new Date()).format("D");

    const changeAbs = isFirstOfMonth
      ? Math.round(stock.changePercent)
      : Math.abs(Math.round(stock.changePercent));

    return new Table({
      columnWidths: [901, 901, 7208],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 901, type: WidthType.DXA },
              children: [new Paragraph(stock.name)],
            }),
            new TableCell({
              width: { size: 901, type: WidthType.DXA },
              children: [new Paragraph(stock.currency)],
            }),
            new TableCell({
              width: { size: 7208, type: WidthType.DXA },
              children: [
                new Paragraph(
                  `${stock.name} ${month} 月 ${day} 日 ${
                    stock.changePercent > 0 ? "涨幅" : "跌幅"
                  } ${changeAbs}%, 收盘价 ${stock.marketPrice} ${currencyLabel(
                    stock.currency,
                  )}`,
                ),
              ],
            }),
          ],
          height: { value: 800, rule: HeightRule.EXACT },
        }),
      ],
    });
  });

  // Construct Document
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun(
                `Please find attached the listed share price summary as of `,
              ),
              new TextRun({
                text: `${moment(new Date()).format("YYYY.MM.DD.")}`,
                highlight: "yellow",
              }),
            ],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({
            children: [
              new TextRun(
                "Below please also find public news which is relevant to the stocks or banks during the day: ",
              ),
            ],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({
            children: [
              new TextRun({
                text: "项目相关",
                bold: true,
                highlight: "yellow",
              }),
            ],
          }),
          ...highlightParagraphs,
          new Paragraph({ children: [] }),
          ...articlesParagraphs,
          new Paragraph({ children: [] }),
          tableHeader,
          ...tableRows,
        ],
      },
    ],
  });

  const formattedDate = moment().format("DDMMYYYY");
  const fileName = `report-v3-${formattedDate}.docx`;
  const desktopDir = path.join(os.homedir(), "Desktop");
  const targetDir = fs.existsSync(desktopDir) ? desktopDir : os.tmpdir();
  const filePath = path.join(targetDir, fileName);

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer, { encoding: "binary" });

  return { buffer, fileName, filePath };
}
