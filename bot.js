require("dotenv").config();
const { Telegraf } = require("telegraf");
const { exec } = require("child_process");
const fs = require("fs");

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: {
    apiRoot: "https://api.telegram.org"
  }
});

bot.start((ctx) => {
  ctx.reply("Send me a video link 🎥");
});

bot.on("text", async (ctx) => {
  const url = ctx.message.text;

  if (!url.startsWith("http")) {
    return ctx.reply("Invalid link ❌");
  }

  const fileName = `video_${Date.now()}.mp4`;

  await ctx.reply("Downloading... ⏳");

  const cmd = `yt-dlp -f mp4 -o "${fileName}" "${url}"`;

  exec(cmd, async (err) => {
    if (err) {
      console.log(err);
      return ctx.reply("Download failed ❌");
    }

    try {
      await ctx.replyWithVideo({ source: fileName });
      fs.unlinkSync(fileName);
    } catch (e) {
      ctx.reply("Upload failed ❌");
    }
  });
});

bot.launch();

const http = require("http");

const PORT = process.env.PORT || 2585;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Bot is alive");
}).listen(PORT);

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

const http = require("http");

console.log("Bot is running...");