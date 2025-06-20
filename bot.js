import fs from "fs";
import path from "path";
import axios from "axios";
import config from "./config.json" assert { type: "json" };
import scrapeYad2 from "./scrape.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SENT_FILE = path.join(__dirname, "sent.json");

function loadSent() {
  if (!fs.existsSync(SENT_FILE)) return { sent_ids: [] };
  return JSON.parse(fs.readFileSync(SENT_FILE));
}

function saveSent(data) {
  fs.writeFileSync(SENT_FILE, JSON.stringify(data, null, 2));
}

const token = process.env.BOT_TOKEN;
const chat_id = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramMessage(item, label) {
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
