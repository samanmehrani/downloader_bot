const { Worker } = require("bullmq");
const fs = require("fs");
const { Telegraf } = require("telegraf");
const connection = require("./redis");

const bot = new Telegraf(process.env.BOT_TOKEN);

new Worker(
  "downloads",
  async () => { },
  { connection }
).on("completed", async (job, result) => {
  const { file, chatId } = result;

  if (!file || !fs.existsSync(file)) {
    return bot.telegram.sendMessage(chatId, "❌ File not found");
  }

  try {
    await bot.telegram.sendMessage(chatId, "📤 Uploading...");

    await bot.telegram.sendVideo(chatId, {
      source: fs.createReadStream(file)
    });

    fs.unlinkSync(file);

    await bot.telegram.sendMessage(chatId, "✅ Done");
  } catch (e) {
    console.error(e);
    bot.telegram.sendMessage(chatId, "❌ Upload failed");
  }
});