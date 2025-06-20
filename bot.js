const fs = require("fs");
const path = require("path");
const axios = require("axios");
const config = require("./config.json");
const scrapeYad2 = require("./scrape");

const SENT_FILE = path.join(__dirname, "sent.json");

function loadSent() {
  if (!fs.existsSync(SENT_FILE)) return { sent_ids: [] };
  return JSON.parse(fs.readFileSync(SENT_FILE));
}

function saveSent(data) {
  fs.writeFileSync(SENT_FILE, JSON.stringify(data, null, 2));
}

async function sendTelegramMessage(item, label) {
  const { token, chat_id } = config.telegram;

  const caption = `🔔 *${label}*\n${item.title}\n[צפייה במודעה](${item.link})`;

  const payload = {
    chat_id,
    caption,
    parse_mode: "Markdown",
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
  const sentData = loadSent();
  const sent = new Set(sentData.sent_ids);

  for (const search of config.searches) {
    try {
      const items = await scrapeYad2(search.url);

      for (const item of items) {
        if (!sent.has(item.id)) {
          await sendTelegramMessage(item, search.label);
          sent.add(item.id);
        }
      }
    } catch (err) {
      console.error("❌ Error in search:", search.label, err.message);
    }
  }

  saveSent({ sent_ids: Array.from(sent) });
})();
