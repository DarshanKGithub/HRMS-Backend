const path = require("path");
const runSqlFromDir = require("./runSqlFromDir");

runSqlFromDir(path.join(__dirname, "../db/migrations"))
  .then(() => {
    process.stdout.write("Migrations completed\n");
  })
  .catch((err) => {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  });
