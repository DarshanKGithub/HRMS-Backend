const pool = require("../config/db");

exports.getAttendanceReport = async (month) => {
  return await pool.query(
    `SELECT e.name, COUNT(a.id) AS days_present
     FROM attendance a
     JOIN employees e ON a.employee_id = e.id
     WHERE EXTRACT(MONTH FROM a.date) = $1
     GROUP BY e.name`,
    [month]
  );
};

exports.getLeaveReport = async () => {
  return await pool.query(
    `SELECT status, COUNT(*) FROM leaves GROUP BY status`
  );
};

exports.getPayrollSummary = async (month) => {
  return await pool.query(
    `SELECT SUM(base_salary) as total_salary,
            SUM(deductions) as total_deductions,
            SUM(net_salary) as total_net
     FROM payroll
     WHERE month = $1`,
    [month]
  );
};