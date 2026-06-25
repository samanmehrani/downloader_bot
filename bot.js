require("dotenv").config();
const { Telegraf } = require("telegraf");

const fs = require("fs");
const path = require("path");
const http = require("http");
const { exec } = require("child_process");

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: {
    apiRoot: "https://api.telegram.org"
  }
});

bot.start(async (ctx) => {
  const filePath = path.join(__dirname, "public", "welcome.png");

  if (!fs.existsSync(filePath)) {
    return ctx.reply(
      `Welcome to Content Dock Bot\n\n` +
      `🎬 Send me any video link and I will download it for you automatically.\n\n` +
      `⚡ Fast • Simple • Free\n`
    );
  }

  await ctx.replyWithPhoto(
    { source: fs.createReadStream(filePath) },
    {
      caption:
        `Welcome to Content Dock Bot\n\n` +
        `🎬 Send me any video link and I will download it for you automatically.\n\n` +
        `⚡ Fast • Simple • Free\n`
    }
  );
});

bot.on("text", async (ctx) => {
  const url = ctx.message.text;

  if (!/^https?:\/\//.test(url)) {
    return ctx.reply("❌ Invalid URL");
  }

  const fileName = `/tmp/video_${Date.now()}.mp4`;

  const status = await ctx.reply("⏳ Processing your request...");

  const update = (text) =>
    ctx.telegram.editMessageText(
      ctx.chat.id,
      status.message_id,
      undefined,
      text
    ).catch(() => { });

  update("🔍 Analyzing link...");

  const cmd = `yt-dlp -f best --merge-output-format mp4 -o "${fileName}" "${url}"`;

  exec(cmd, async (err) => {
    if (err) {
      console.error(err);
      return update("❌ Download failed (unsupported or blocked site)");
    }

    update("📤 Uploading video...");

    try {
      let tries = 0;
      while (!fs.existsSync(fileName) && tries < 20) {
        await new Promise(r => setTimeout(r, 500));
        tries++;
      }

      if (!fs.existsSync(fileName)) {
        return update("❌ File not generated");
      }

      await ctx.replyWithVideo({ source: fileName });

      fs.unlinkSync(fileName);

      update("✅ Done! Video sent successfully.");
    } catch (e) {
      console.error(e);
      update("❌ Upload failed (file too large or Telegram error)");
    }
  });
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