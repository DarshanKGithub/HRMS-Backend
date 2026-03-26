exports.getNotifications = async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC",
    [req.user.id]
  );

  res.json(result.rows);
};