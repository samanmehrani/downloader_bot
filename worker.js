require("dotenv").config();
const { Worker } = require("bullmq");
const { exec } = require("child_process");
const connection = require("./redis");

new Worker(
  "downloads",
  async (job) => {
    const { url } = job.data;

    const file = `/tmp/video_${job.id}.mp4`;

    await new Promise((resolve, reject) => {
      const cmd = `yt-dlp -f best --merge-output-format mp4 -o "${file}" "${url}"`;

      exec(cmd, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    return {
      file,
      chatId: job.data.chatId
    };
  },
  { connection }
);