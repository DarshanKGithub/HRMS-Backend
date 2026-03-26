const pool = require("../config/db");
const getEmployeeId = require("../utils/getEmployeeId");

exports.applyLeave = async (req, res) => {
  try {
    const empId = await getEmployeeId(req.user.id);
    const { start_date, end_date, reason, type } = req.body;

    const result = await pool.query(
      `INSERT INTO leaves(employee_id, start_date, end_date, reason, type)
       VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [empId, start_date, end_date, reason, type]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyLeaves = async (req, res) => {
  const empId = await getEmployeeId(req.user.id);

  const result = await pool.query(
    `SELECT * FROM leaves WHERE employee_id=$1 ORDER BY start_date DESC`,
    [empId]
  );

  res.json(result.rows);
};