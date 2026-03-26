const pool = require("../config/db");

exports.applyLeave = async (empId, data) => {
  const emp = await pool.query(
    "SELECT leave_balance FROM employees WHERE id=$1",
    [empId]
  );

  if (emp.rows[0].leave_balance <= 0) {
    throw new Error("No leave balance left");
  }

  const result = await pool.query(
    `INSERT INTO leaves(employee_id,start_date,end_date,reason,type)
     VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [empId, data.start_date, data.end_date, data.reason, data.type]
  );

  return result.rows[0];
};