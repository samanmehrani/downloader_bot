const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

function detectSite(url) {
  const map = {
    youtube: ["youtube.com", "youtu.be"],
    instagram: ["instagram.com"],
    tiktok: ["tiktok.com"]
  };

  for (const [key, domains] of Object.entries(map)) {
    if (domains.some(d => url.includes(d))) return key;
  }

  return "generic";
}

function buildCommand(url, fileName, attempt = 1) {
  const formats = {
    1: `"bv*+ba/b"`,
    2: `"best"`,
    3: `"worst"`
  };

  return [
    "yt-dlp",
    `-f ${formats[attempt] || formats[3]}`,
    "--merge-output-format mp4",
    "--no-check-certificate",
    '--user-agent "Mozilla/5.0"',
    "--extractor-retries 2",
    `-o "${fileName}"`,
    `"${url}"`
  ].join(" ");
}

function runCmd(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function classifyError(err) {
  if (!err) return "unknown_error";

  const msg = err.message || "";

  if (msg.includes("410")) return "video_removed";
  if (msg.includes("403")) return "access_denied";
  if (msg.includes("Sign in")) return "login_required";
  if (msg.includes("Unsupported")) return "unsupported_site";

  return "download_failed";
}

async function download(url, onProgress = () => { }) {
  const site = detectSite(url);
  const fileName = path.join("/tmp", `video_${Date.now()}.mp4`);

  onProgress(`🔍 Detecting platform: ${site}`);

  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      onProgress(`⚙️ Trying method ${attempt}/3...`);

      const cmd = buildCommand(url, fileName, attempt);

      await runCmd(cmd);

      if (fs.existsSync(fileName)) {
        onProgress(`📦 Finalizing video...`);

        return {
          success: true,
          file: fileName,
          site,
          attempt
        };
      }
    } catch (err) {
      lastError = err;
      onProgress(`❌ Attempt ${attempt} failed...`);
    }
  }

  return {
    success: false,
    error: classifyError(lastError),
    site
  };
}

module.exports = {
  download,
  detectSite,
  classifyError
};