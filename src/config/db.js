const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

pool
    .query(
        "CREATE UNIQUE INDEX IF NOT EXISTS attendance_employee_date_unique ON attendance(employee_id, date)"
    )
    .catch(() => {
        // Non-fatal bootstrap guard; app should still start.
    });

module.exports = pool;