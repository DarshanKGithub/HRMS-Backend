const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(/^jdbc:/, "")
    : null;

const useSsl =
    process.env.DB_SSL === "true" ||
    (process.env.DB_SSL !== "false" && Boolean(connectionString));

const pool = new Pool(
    connectionString
        ? {
              connectionString,
              ssl: useSsl ? { rejectUnauthorized: false } : false,
          }
        : {
              host: process.env.DB_HOST,
              port: process.env.DB_PORT,
              user: process.env.DB_USER,
              password: process.env.DB_PASSWORD,
              database: process.env.DB_NAME,
              ssl: useSsl ? { rejectUnauthorized: false } : false,
          }
);

pool
    .query(
        "CREATE UNIQUE INDEX IF NOT EXISTS attendance_employee_date_unique ON attendance(employee_id, date)"
    )
    .catch(() => {
        // Non-fatal bootstrap guard; app should still start.
    });

module.exports = pool;