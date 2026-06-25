const { Telegraf } = require("telegraf");
const fs = require("fs");

const bot = new Telegraf(process.env.BOT_TOKEN);

const worker = require("./worker-instance");

worker.on("completed", async (job) => {
  const file = job.data.file;
  const chatId = job.data.chatId;

  try {
    await bot.telegram.sendVideo(chatId, {
      source: fs.createReadStream(file)
    });

    fs.unlinkSync(file);
  } catch (e) {
    console.error(e);
  }
});