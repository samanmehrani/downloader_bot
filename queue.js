const { Queue } = require("bullmq");
const connection = require("./redis");

const downloadQueue = new Queue("downloads", {
  connection
});

module.exports = downloadQueue;