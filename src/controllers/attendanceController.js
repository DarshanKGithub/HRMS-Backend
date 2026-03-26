const pool = require("../config/db");
const getEmployeeId = require("../utils/getEmployeeId");

exports.clockIn = async (req, res) => {
  try {
    const empId = await getEmployeeId(req.user.id);

    const result = await pool.query(
      `INSERT INTO attendance(employee_id, clock_in)
       VALUES($1,NOW()) RETURNING *`,
      [empId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.clockOut = async (req, res) => {
  try {
    const empId = await getEmployeeId(req.user.id);

    const result = await pool.query(
      `UPDATE attendance
       SET clock_out=NOW(),
       work_hours=EXTRACT(EPOCH FROM (NOW()-clock_in))/3600
       WHERE employee_id=$1 AND clock_out IS NULL
       RETURNING *`,
      [empId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  const empId = await getEmployeeId(req.user.id);

  const result = await pool.query(
    `SELECT * FROM attendance 
     WHERE employee_id=$1 ORDER BY date DESC`,
    [empId]
  );

  res.json(result.rows);
};