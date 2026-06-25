const IORedis = require("ioredis");

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

connection.on("error", (err) => {
  console.error("Redis Error:", err.message);
});

console.log("Redis connected");

module.exports = connection;