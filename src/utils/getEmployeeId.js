const pool = require("../config/db");

const getEmployeeId = async (userId) => {
  const result = await pool.query(
    "SELECT id FROM employees WHERE user_id = $1",
    [userId]
  );

  if (!result.rows.length) {
    throw new Error("Employee not found");
  }

  return result.rows[0].id;
};

module.exports = getEmployeeId;