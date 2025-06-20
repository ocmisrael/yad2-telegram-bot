import { chromium } from "playwright";
import fs from "fs";

export default async function scrapeYad2(url) {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    locale: "he-IL",
  });

  const page = await context.newPage();

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

    const title = await page.title();
    if (title.includes("ShieldSquare") || title.includes("Captcha")) {
      throw new Error("Bot was blocked by ShieldSquare (captcha)");
    }

    await page.waitForSelector(".feeditem", { timeout: 10000 });

    const items = await page.$$eval(".feeditem", (nodes) =>
      nodes.map((node) => {
        const title = node.querySelector(".title")?.innerText?.trim();
        const link = node.querySelector("a")?.href;
        const image = node.querySelector("img")?.src;
        const idMatch = link?.match(/\/(\d+)$/);
        const id = idMatch ? idMatch[1] : null;

        if (title && link && id) {
          return {
            title,
            link,
            image,
            id,
          };
        }
      }).filter(Boolean)
    );

    await browser.close();
    return items;
  } catch (err) {
    await browser.close();
    console.error("❌ Scrape error:", err.message);
    throw err;
  }
}
