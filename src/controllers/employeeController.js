const pool = require("../config/db");

exports.getProfile = async (req, res) => {
  const result = await pool.query(
    `SELECT e.*, u.email 
     FROM employees e
     JOIN users u ON e.user_id=u.id
     WHERE u.id=$1`,
    [req.user.id]
  );

  res.json(result.rows[0]);
};

exports.updateProfile = async (req, res) => {
  const { phone, address } = req.body;

  const result = await pool.query(
    `UPDATE employees
     SET phone=$1, address=$2
     WHERE user_id=$3 RETURNING *`,
    [phone, address, req.user.id]
  );

  res.json(result.rows[0]);
};