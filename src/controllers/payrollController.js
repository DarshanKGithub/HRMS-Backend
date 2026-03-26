const pool = require("../config/db");
const getEmployeeId = require("../utils/getEmployeeId");

exports.getPayroll = async (req, res) => {
  const empId = await getEmployeeId(req.user.id);

  const result = await pool.query(
    `SELECT * FROM payroll 
     WHERE employee_id=$1 ORDER BY created_at DESC`,
    [empId]
  );

  res.json(result.rows);
};