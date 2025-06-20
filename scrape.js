const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeYad2(url) {
  const results = [];
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const $ = cheerio.load(data);

  if ($("title").text().includes("ShieldSquare Captcha")) {
    throw new Error("Bot was blocked by ShieldSquare (captcha)");
  }

  $(".feeditem").each((i, el) => {
    const link = $(el).attr("href");
    const title = $(el).find(".title").text().trim();
    const image = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || "";
    if (link && title) {
      const id = link.split("/").pop().split("?")[0];
      results.push({
        id,
        title,
        link: "https://www.yad2.co.il" + link,
        image,
      });
    }
  });

  return results;
}

module.exports = scrapeYad2;
