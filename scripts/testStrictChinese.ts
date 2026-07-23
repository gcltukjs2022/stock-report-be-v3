import { JSDOM } from "jsdom";
import { renderPage, closeBrowser } from "../src/scrapers/core/browser";
import { toSimplified, hasChinese } from "../src/utils/textUtils";

export function extractChineseDOMParagraphs(html: string, url: string): string {
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // Target main content containers
  const container =
    doc.querySelector("#content .inner") ||
    doc.querySelector("#spanContent") ||
    doc.querySelector("article") ||
    doc.body;

  if (!container) return "";

  // Select all paragraph, heading, list-item, and block elements
  const blocks = container.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, div.text, div.content-paragraph");
  const chineseBlocks: string[] = [];

  blocks.forEach((node) => {
    // Avoid double counting nested elements
    if (node.querySelector("p, h1, h2, h3, h4, h5, h6")) return;

    const rawText = node.textContent?.trim() || "";
    if (!rawText) return;

    // Check if element node contains Chinese characters
    if (hasChinese(rawText)) {
      // If node starts with English title/prefix before Chinese, slice from first Chinese character
      const match = rawText.match(/[\u4e00-\u9fa5]/);
      if (match && match.index !== undefined) {
        const chineseOnly = rawText.slice(match.index).trim();
        if (chineseOnly.length > 0) {
          chineseBlocks.push(chineseOnly);
        }
      }
    }
  });

  // Fallback: If no block elements matched, filter by line
  if (chineseBlocks.length === 0) {
    const fullText = container.textContent || "";
    const lines = fullText.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (hasChinese(line)) {
        const match = line.match(/[\u4e00-\u9fa5]/);
        if (match && match.index !== undefined) {
          chineseBlocks.push(line.slice(match.index).trim());
        }
      }
    }
  }

  return chineseBlocks.join("\n\n");
}

async function testDomExtraction() {
  const sampleArticleUrl = "https://news.futunn.com/hk/post/76365874/consumer-finance-market-to-surpass-14-trillion-by-2031-with";

  console.log(`[TEST DOM] Fetching: ${sampleArticleUrl}...`);
  const html = await renderPage(sampleArticleUrl);

  const extracted = extractChineseDOMParagraphs(html, sampleArticleUrl);
  const simplified = toSimplified(extracted);

  console.log("=== CHINESE DOM EXTRACTED OUTPUT ===");
  console.log(simplified.slice(0, 2500));
  console.log("====================================");
  console.log(`Extracted Chinese Length: ${simplified.length} characters`);

  // Check if any pure English sentences remain
  const hasEnglishSentence = /[A-Za-z]{5,}\s+[A-Za-z]{5,}\s+[A-Za-z]{5,}/.test(simplified);
  console.log(`[TEST VERIFICATION] Contains leftover English prose?`, hasEnglishSentence ? "YES (Warning)" : "NO (Pure Chinese Cleaned!)");

  await closeBrowser();
}

testDomExtraction();
