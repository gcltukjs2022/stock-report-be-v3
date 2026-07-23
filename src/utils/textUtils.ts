import * as OpenCC from "opencc-js";

// Traditional -> Simplified converter instance
const converter = OpenCC.Converter({ from: "tw", to: "cn" });

export function toSimplified(text: string): string {
  if (!text) return text;
  return converter(text);
}

/**
 * Detects whether a string contains Chinese characters.
 */
export function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Given article text (which may contain mixed English and Chinese paragraphs or English leading text),
 * strips non-Chinese paragraphs and leading English text, extracting only the Chinese text portion.
 */
export function extractChineseContent(text: string): string {
  if (!text) return text;

  // Split into paragraphs by newlines
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chineseExtractedParagraphs: string[] = [];

  for (const p of paragraphs) {
    const match = p.match(/[\u4e00-\u9fa5]/);
    if (match && match.index !== undefined) {
      // Slice from the first Chinese character to strip out any preceding English header/text
      const chineseOnlyPart = p.slice(match.index).trim();
      if (chineseOnlyPart.length > 0) {
        chineseExtractedParagraphs.push(chineseOnlyPart);
      }
    }
  }

  // If Chinese paragraphs were found and extracted, join them.
  // Otherwise, return original text as fallback.
  if (chineseExtractedParagraphs.length > 0) {
    return chineseExtractedParagraphs.join("\n\n");
  }

  return text;
}
