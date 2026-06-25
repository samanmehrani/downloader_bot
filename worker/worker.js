const { Worker } = require("bullmq");
const { exec } = require("child_process");
const connection = require("./redis");

console.log("Worker starting...");

const worker = new Worker(
  "downloads",
  async (job) => {
    const { url, chatId } = job.data;

    console.log("Processing job:", job.id);

    const file = `/tmp/video_${job.id}.mp4`;

    await new Promise((resolve, reject) => {
      exec(
        `yt-dlp -f best --merge-output-format mp4 -o "${file}" "${url}"`,
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    return { file, chatId };
  },
  { connection }
);

worker.on("completed", (job, result) => {
  console.log("Job completed:", job.id);
});

worker.on("failed", (job, err) => {
  console.error("Job failed:", job?.id, err.message);
});