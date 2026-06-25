const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

function detectSite(url) {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");

    const map = {
      youtube: ["youtube.com", "youtu.be", "m.youtube.com"],
      instagram: ["instagram.com", "instagr.am"],
      tiktok: ["tiktok.com", "vm.tiktok.com"],
      x: ["x.com", "twitter.com"]
    };

    for (const [key, domains] of Object.entries(map)) {
      if (domains.some(d => hostname === d || hostname.endsWith(`.${d}`) || hostname === d)) {
        return key;
      }
    }

    return "generic";
  } catch (err) {
    return "unknown";
  }
}

function buildCommand(url, fileName, attempt = 1) {
  const formats = {
    1: `"bv*+ba/b"`,
    2: `"best"`,
    3: `"worst"`
  };

  return [
    "yt-dlp",
    `-f ${formats[attempt]}`,
    "--merge-output-format mp4",
    "--no-check-certificate",
    "--extractor-retries 2",
    '--user-agent "Mozilla/5.0"',
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

  let lastError = null;

  onProgress("🔍 Detecting platform...");

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      onProgress(`⚙️ Trying method ${attempt}/3...`);

      const cmd = buildCommand(url, fileName, attempt);

      await runCmd(cmd);

      if (fs.existsSync(fileName)) {
        return {
          success: true,
          file: fileName,
          site,
          attempt
        };
      }
    } catch (err) {
      lastError = err;
      onProgress(`❌ Attempt ${attempt} failed`);
    }
  }

  return {
    success: false,
    error: classifyError(lastError),
    site
  };
}

function formatErrorForUser(type, site) {
  const map = {
    video_removed: "❌ Video is no longer available",
    access_denied: "🔒 Access restricted or blocked",
    login_required: "🔑 Login required to view this content",
    unsupported_site: "🚫 This platform is not supported yet",
    download_failed: "⚠️ Download failed",
    unknown_error: "❓ Unknown error occurred"
  };

  return `${map[type] || map.unknown_error}\n\n🌐 Platform: ${site}`;
}

module.exports = {
  download,
  detectSite,
  classifyError,
  formatErrorForUser
};