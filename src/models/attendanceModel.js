const pool = require("../config/db");

exports.findToday = (empId) =>
  pool.query(
    "SELECT * FROM attendance WHERE employee_id=$1 AND date=CURRENT_DATE",
    [empId]
  );

exports.clockIn = (empId) =>
  pool.query(
    "INSERT INTO attendance(employee_id,clock_in) VALUES($1,NOW()) RETURNING *",
    [empId]
  );

exports.clockOut = (empId) =>
  pool.query(
    `UPDATE attendance SET clock_out=NOW(),
     work_hours=EXTRACT(EPOCH FROM (NOW()-clock_in))/3600
     WHERE employee_id=$1 AND clock_out IS NULL RETURNING *`,
    [empId]
  );