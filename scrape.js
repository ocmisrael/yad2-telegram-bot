const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeYad2(url) {
  const results = [];

  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  $(".feeditem.table").each((i, el) => {
    const title = $(el).find(".title").text().trim();
    const link = "https://www.yad2.co.il" + $(el).attr("href");
    const image = $(el).find(".image img").attr("data-src") || null;
    const id = link.split("/").pop();

    if (title && link) {
      results.push({ id, title, link, image });
    }
  });

  return results;
}

module.exports = scrapeYad2;
