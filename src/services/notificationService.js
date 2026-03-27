const pool = require("../config/db");

const queryExecutor = (client) => (client || pool);

exports.create = async (user_id, message, client) => {
  await queryExecutor(client).query(
    `INSERT INTO notifications(user_id, message)
     VALUES($1,$2)`,
    [user_id, message]
  );
};

exports.getAll = async (user_id, { page = 1, limit = 10, is_read } = {}) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT * FROM notifications
       WHERE user_id=$1
         AND ($2::boolean IS NULL OR is_read=$2)
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [user_id, is_read === undefined ? null : is_read === "true", safeLimit, offset]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM notifications
       WHERE user_id=$1
         AND ($2::boolean IS NULL OR is_read=$2)`,
      [user_id, is_read === undefined ? null : is_read === "true"]
    ),
  ]);

  return {
    rows: rows.rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: count.rows[0].total,
    },
  };
};

exports.markAsRead = async (user_id, id) => {
  return pool.query(
    `UPDATE notifications
     SET is_read=TRUE
     WHERE id=$1 AND user_id=$2
     RETURNING *`,
    [id, user_id]
  );
};

exports.markAllAsRead = async (user_id) => {
  return pool.query(
    `UPDATE notifications
     SET is_read=TRUE
     WHERE user_id=$1 AND is_read=FALSE`,
    [user_id]
  );
};

exports.getUnreadCount = async (user_id) => {
  return pool.query(
    `SELECT * FROM notifications
     WHERE user_id=$1 AND is_read=FALSE`,
    [user_id]
  );
};