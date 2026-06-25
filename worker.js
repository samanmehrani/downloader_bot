const { Worker } = require("bullmq");
const { exec } = require("child_process");

const connection = require("./redis");

new Worker(
  "downloads",
  async (job) => {
    const { url, chatId } = job.data;

    const file = `/tmp/video_${job.id}.mp4`;

    return new Promise((resolve, reject) => {
      const cmd = `yt-dlp -f best --merge-output-format mp4 -o "${file}" "${url}"`;

      exec(cmd, (err) => {
        if (err) return reject(err);

        job.data.file = file;
        job.data.chatId = chatId;

        resolve(file);
      });
    });
  },
  { connection }
);