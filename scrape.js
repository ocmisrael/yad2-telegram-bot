import { chromium } from "playwright";

export default async function scrapeYad2(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    const title = await page.title();
    if (title.includes("ShieldSquare Captcha")) {
      throw new Error("Blocked by ShieldSquare CAPTCHA");
    }

    const items = await page.$$eval(".feeditem", (nodes) => {
      return nodes.map((el) => {
        const link = el.getAttribute("href");
        const titleEl = el.querySelector(".title");
        const title = titleEl ? titleEl.innerText.trim() : null;
        const imgEl = el.querySelector("img");
        const image = imgEl?.getAttribute("data-src") || imgEl?.getAttribute("src") || null;
        if (!link || !title) return null;

        const id = link.split("/").pop().split("?")[0];
        return {
          id,
          title,
          link: "https://www.yad2.co.il" + link,
          image,
        };
      }).filter(Boolean);
    });

    results.push(...items);
  } catch (err) {
    console.error("❌ Scrape error:", err.message);
    throw err;
  } finally {
    await browser.close();
  }

  return results;
}
