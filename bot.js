require("dotenv").config();
const { Telegraf } = require("telegraf");
const { exec } = require("child_process");
const http = require("http");
const fs = require("fs");

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: {
    apiRoot: "https://api.telegram.org"
  }
});

bot.start((ctx) => {
  ctx.reply(
    `Welcome!

    Send me a video URL and I'll try to download and send the video back to you.

    Examples:
    • YouTube
    • Instagram
    • TikTok
    • X (Twitter)

    Just paste a link and wait.`
  );
});

bot.on("text", async (ctx) => {
  const url = ctx.message.text;

  if (!url.startsWith("http")) {
    return ctx.reply(
      "❌ Invalid URL\n\nPlease send a valid video link."
    );
  }

  const fileName = `video_${Date.now()}.mp4`;

  await ctx.reply(
    "⏳ Download request received.\n\n🎥 Fetching video information..."
  );

  const cmd = `yt-dlp -f mp4 -o "${fileName}" "${url}"`;

  exec(cmd, async (err) => {
    if (err) {
      console.error(err);

      return ctx.reply(
        "❌ Download Failed\n\nThe video could not be downloaded.\n\nPossible reasons:\n• Unsupported website\n• Private or restricted content\n• Video is unavailable\n• Temporary server issue"
      );
    }

    try {
      await ctx.reply(
        "📤 Uploading video...\n\nPlease wait a moment."
      );

      await ctx.replyWithVideo({ source: fileName });

      fs.unlinkSync(fileName);

      await ctx.reply(
        "✅ Download Completed\n\nYour video has been delivered successfully."
      );
    } catch (e) {
      console.error(e);

      ctx.reply(
        "❌ Upload Failed\n\nThe video was downloaded successfully, but Telegram could not upload it.\n\nThe file may be too large."
      );
    }
  });
});

bot.launch();

const PORT = process.env.PORT || 2585;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Bot is alive");
}).listen(PORT);

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

console.log(`Bot is running on port ${PORT}`);