const pool = require("../config/db");

let initialized = false;

const ensureTable = async () => {
  if (initialized) return;

  await pool.query(
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      actor_user_id INT,
      action VARCHAR(80) NOT NULL,
      target_type VARCHAR(50),
      target_id INT,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );

  initialized = true;
};

exports.log = async ({ actorUserId, action, targetType, targetId, metadata }) => {
  try {
    await ensureTable();
    await pool.query(
      `INSERT INTO audit_logs(actor_user_id, action, target_type, target_id, metadata)
       VALUES($1,$2,$3,$4,$5)`,
      [actorUserId || null, action, targetType || null, targetId || null, metadata || null]
    );
  } catch (err) {
    // Audit logging must not break primary business flow.
  }
};