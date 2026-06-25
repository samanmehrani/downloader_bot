require("dotenv").config();
const { Telegraf } = require("telegraf");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { exec } = require("child_process");

const downloader = require("./downloader.engine");

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: {
    apiRoot: "https://api.telegram.org"
  }
});

bot.start(async (ctx) => {
  const filePath = path.join(__dirname, "public", "welcome.png");

  const caption =
    "🎬 Content Dock Bot\n\n" +
    "Send me any video link and I will download it for you.\n\n" +
    "⚡ Fast • Simple • Smart";

  if (!fs.existsSync(filePath)) {
    return ctx.reply(caption);
  }

  await ctx.replyWithPhoto(
    { source: fs.createReadStream(filePath) },
    { caption }
  );
});

bot.on("text", async (ctx) => {
  const url = ctx.message.text;

  if (!/^https?:\/\//.test(url)) {
    return ctx.reply("❌ Invalid URL");
  }

  const status = await ctx.reply("⏳ Processing your request...");

  const update = (t) =>
    ctx.telegram
      .editMessageText(ctx.chat.id, status.message_id, undefined, t)
      .catch(() => { });

  try {
    update("🔍 Detecting platform...");

    const result = await downloader.download(url);

    if (!result.success) {
      return update(formatErrorForUser(result.error, result.site));
    }

    update("📤 Uploading video to Telegram...");

    await ctx.replyWithVideo({ source: result.file });

    update("🧹 Cleaning up...");

    fs.unlinkSync(result.file);

    update(`✅ Done! (${result.site}, attempt ${result.attempt})`);

  } catch (err) {
    console.error(err);
    update("❌ Unexpected error occurred");
  }
});

bot.launch({
  dropPendingUpdates: true
});

const PORT = process.env.PORT || 2585;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Bot is alive");
}).listen(PORT);

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

console.log(`Bot is running on port ${PORT}`);