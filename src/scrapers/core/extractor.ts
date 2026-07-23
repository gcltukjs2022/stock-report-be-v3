import * as cheerio from "cheerio";
import { hasChinese, extractChineseContent } from "../../utils/textUtils.js";

/**
 * Extracts Chinese article content and title from HTML using Cheerio.
 * Filters out pure-English blocks and leading English headers.
 */
export function extractArticle(html: string, _url: string): { title: string; content: string } {
    const $ = cheerio.load(html);

    // Remove non-content elements
    $("script, style, nav, footer, header, iframe, noscript, svg").remove();

    // Extract title
    const title = $("h1").first().text().trim() || $("title").text().trim();

    // Extract Chinese content blocks
    const chineseParagraphs: string[] = [];

    $("p, h1, h2, h3, h4, h5, h6, li").each((_, el) => {
        const text = $(el).text().trim();
        if (!text || !hasChinese(text)) {
            return;
        }
        const cleanedText = extractChineseContent(text);
        if (cleanedText && hasChinese(cleanedText)) {
            chineseParagraphs.push(cleanedText);
        }
    });

    return {
        title,
        content: chineseParagraphs.join("\n\n")
    };
}
