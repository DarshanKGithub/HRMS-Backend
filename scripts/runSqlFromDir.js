const fs = require("fs");
const path = require("path");
const pool = require("../src/config/db");

const run = async (dirPath) => {
  const absolute = path.resolve(dirPath);
  const files = fs
    .readdirSync(absolute)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(absolute, file), "utf8");
    await pool.query(sql);
    process.stdout.write(`Executed ${file}\n`);
  }

  await pool.end();
};

module.exports = run;
