import { getBrowser } from "../../utils/playwrightHelper";

const DEFAULT_DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/120.0.0.0 Safari/537.36";

export async function renderPage(
  url: string,
  timeoutMs: number = 20000,
): Promise<string> {
  const browser = await getBrowser();

  if (!browser.isConnected()) {
    throw new Error("Playwright browser disconnected");
  }

  const context = await browser.newContext({
    userAgent: DEFAULT_DESKTOP_UA,
    viewport: {
      width: 1280,
      height: 800,
    },
    locale: "zh-HK",
  });

  try {
    const page = await context.newPage();

    // Block heavy resources
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();

      if (["image", "font", "media"].includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: timeoutMs,
      });
    } catch (err: any) {
      console.warn(`[Page Goto Warning] ${url}:`, err.message || err);
    }

    // Allow JS rendering
    await page.waitForTimeout(1000);

    return await page.content();
  } finally {
    // Only close context.
    // Do NOT close browser here.
    await context.close();
  }
}

// import { getBrowser } from "../../utils/playwrightHelper";
// import { Browser } from "playwright";

// const DEFAULT_DESKTOP_UA =
//   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// export async function renderPage(
//   url: string,
//   timeoutMs: number = 20000,
// ): Promise<string> {
//   const browser = await getBrowser();
//   const context = await browser.newContext({
//     userAgent: DEFAULT_DESKTOP_UA,
//     viewport: { width: 1280, height: 800 },
//     locale: "zh-HK",
//   });

//   try {
//     const page = await context.newPage();

//     // Block unnecessary heavy asset downloads (images, fonts, media) to speed up rendering and prevent timeouts
//     await page.route("**/*", (route) => {
//       const type = route.request().resourceType();
//       if (["image", "font", "media"].includes(type)) {
//         route.abort();
//       } else {
//         route.continue();
//       }
//     });

//     try {
//       await page.goto(url, {
//         waitUntil: "domcontentloaded",
//         timeout: timeoutMs,
//       });
//     } catch (err: any) {
//       console.warn(`[Page Goto Warning] ${url}: ${err.message || err}`);
//     }

//     // Allow async DOM rendering to settle
//     await page.waitForTimeout(1000);

//     return await page.content();
//   } finally {
//     await context.close();
//   }
// }

// export async function closeBrowser(): Promise<void> {
//   const browser = await getBrowser();
//   if (browser && browser.isConnected()) {
//     await browser.close();
//   }
// }
