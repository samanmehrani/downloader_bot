require("dotenv").config();
const { Telegraf } = require("telegraf");
const downloadQueue = require("./queue");

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: {
    apiRoot: "https://api.telegram.org"
  }
});

bot.start(async (ctx) => {
  await ctx.replyWithPhoto(
    {
      source: fs.createReadStream(
        path.join(__dirname, "public", "177e68be6786805bb41ff5ac4ce9a939.gif")
      )
    },
    {
      caption:
        `Welcome to Video Downloader Bot\n\n` +
        `🎬 Send me any video link and I will download it for you automatically.\n` +
        `⚡ Fast • Simple • Free\n` +
        `📎 Just paste your URL and wait...`
    }
  );
});

bot.on("text", async (ctx) => {
  const url = ctx.message.text;

  if (!url.startsWith("http")) {
    return ctx.reply("❌ Invalid URL");
  }

  const job = await downloadQueue.add("download", {
    url,
    chatId: ctx.chat.id
  });

  ctx.reply(`⏳ Added to queue...\nJob ID: ${job.id}`);
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