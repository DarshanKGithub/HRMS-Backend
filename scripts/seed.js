const path = require("path");
const runSqlFromDir = require("./runSqlFromDir");

runSqlFromDir(path.join(__dirname, "../db/seeds"))
  .then(() => {
    process.stdout.write("Seed completed\n");
  })
  .catch((err) => {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  });
