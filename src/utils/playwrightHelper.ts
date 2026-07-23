import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import { Browser } from "playwright";

chromium.use(stealth());

// Use Lambda bundled browsers if applicable
process.env.PLAYWRIGHT_BROWSERS_PATH = "0";

let globalBrowser: Browser | null = null;

/**
 * Get a shared Playwright browser instance.
 * Recreates it if it was disconnected/crashed.
 */
export async function getBrowser(): Promise<Browser> {
  if (!globalBrowser || !globalBrowser.isConnected()) {
    console.log("[Playwright] Launching browser...");

    // globalBrowser = await chromium.launch({
    //   headless: true,
    //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
    // });
    globalBrowser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
      ],
    });

    globalBrowser.on("disconnected", () => {
      console.warn("[Playwright] Browser disconnected");
      globalBrowser = null;
    });
  }

  return globalBrowser;
}

/**
 * Close browser only if it already exists.
 * Does NOT create a new browser.
 */
export async function closeBrowser(): Promise<void> {
  if (!globalBrowser) {
    return;
  }

  try {
    if (globalBrowser.isConnected()) {
      console.log("[Playwright] Closing browser...");
      await globalBrowser.close();
    }
  } catch (err) {
    console.warn("[Playwright] Failed to close browser:", err);
  } finally {
    globalBrowser = null;
  }
}

// import { chromium } from "playwright-extra";
// import stealth from "puppeteer-extra-plugin-stealth";
// import { Browser } from "playwright";

// chromium.use(stealth());

// // Use Lambda bundled browsers if applicable
// process.env.PLAYWRIGHT_BROWSERS_PATH = "0";

// let globalBrowser: Browser | null = null;

// /**
//  * Get a shared Playwright browser instance.
//  * Recreates it if it was disconnected/crashed.
//  */
// export async function getBrowser(): Promise<Browser> {
//   if (!globalBrowser || !globalBrowser.isConnected()) {
//     console.log("[Playwright] Launching browser...");

//     globalBrowser = await chromium.launch({
//       headless: true,
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });

//     globalBrowser.on("disconnected", () => {
//       console.warn("[Playwright] Browser disconnected");
//       globalBrowser = null;
//     });
//   }

//   return globalBrowser;
// }

// /**
//  * Close browser only if it already exists.
//  * Does NOT create a new browser.
//  */
// export async function closeBrowser(): Promise<void> {
//   if (!globalBrowser) {
//     return;
//   }

//   try {
//     if (globalBrowser.isConnected()) {
//       console.log("[Playwright] Closing browser...");
//       await globalBrowser.close();
//     }
//   } catch (err) {
//     console.warn("[Playwright] Failed to close browser:", err);
//   } finally {
//     globalBrowser = null;
//   }
// }

// // // src/utils/playwrightHelper.ts
// // import { chromium } from "playwright-extra";
// // import stealth from "puppeteer-extra-plugin-stealth";
// // import { Browser } from "playwright";

// // // Apply stealth plugin once
// // chromium.use(stealth());

// // // Tell Playwright to use the bundled browsers (installed via prebuild script)
// // process.env.PLAYWRIGHT_BROWSERS_PATH = "0";

// // let globalBrowser: Browser | null = null;

// // /**
// //  * Returns a shared Chromium browser instance.
// //  * The first call launches a new headless browser; subsequent calls reuse it.
// //  */
// // export async function getBrowser(): Promise<Browser> {
// //   if (!globalBrowser || !globalBrowser.isConnected()) {
// //     globalBrowser = await chromium.launch({ headless: true });
// //   }
// //   return globalBrowser;
// // }
