const fs = require("fs");
const path = require("path");
const axios = require("axios");
const config = require("./config.json");
const scrapeYad2 = require("./scrape");

const token = process.env.BOT_TOKEN;
const chat_id = process.env.TELEGRAM_CHAT_ID;

function getSentFilePath(topic) {
  return path.join(__dirname, "data", `sent-${topic}.json`);
}

function loadSent(topic) {
  const filePath = getSentFilePath(topic);
  if (!fs.existsSync(filePath)) return { ids: [], images: [] };
  return JSON.parse(fs.readFileSync(filePath));
}

function saveSent(topic, data) {
  const filePath = getSentFilePath(topic);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function sendTelegramMessage(item, label) {
  const caption = `🔔 *${label}*\n${item.title}\n[צפייה במודעה](${item.link})`;
  const payload = {
    chat_id,
    caption,
    parse_mode: "Markdown"
  };

  if (item.image) {
    payload.photo = item.image;
    await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, payload);
  } else {
    payload.text = caption;
    delete payload.caption;
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, payload);
  }
}

(async () => {
  if (!fs.existsSync("data")) fs.mkdirSync("data");

  for (const search of config.searches) {
    const { topic, label, url } = search;
    const sentData = loadSent(topic);
    const sentIds = new Set(sentData.ids);
    const sentImages = new Set(sentData.images);

    try {
      const items = await scrapeYad2(url);
      const newItems = [];

      for (const item of items) {
        const uniqueImage = item.image?.split("?")[0];
        if (!sentIds.has(item.id) && uniqueImage && !sentImages.has(uniqueImage)) {
          await sendTelegramMessage(item, label);
          sentIds.add(item.id);
          sentImages.add(uniqueImage);
          newItems.push(item);
        }
      }

      saveSent(topic, {
        ids: Array.from(sentIds),
        images: Array.from(sentImages)
      });

      if (newItems.length === 0) {
        console.log(`✅ [${topic}] אין פריטים חדשים`);
      }
    } catch (err) {
      console.error(`❌ שגיאה ב-${topic}:`, err.message);
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id,
        text: `❗ שגיאה בסריקת "${label}": ${err.message}`
      });
    }
  }
})();
