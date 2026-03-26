const pool = require("../config/db");

exports.create = async (user_id, message) => {
  await pool.query(
    `INSERT INTO notifications(user_id, message)
     VALUES($1,$2)`,
    [user_id, message]
  );
};

exports.getAll = async (user_id) => {
  return await pool.query(
    `SELECT * FROM notifications
     WHERE user_id=$1 ORDER BY created_at DESC`,
    [user_id]
  );
};