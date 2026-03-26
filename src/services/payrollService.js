const pool = require("../config/db");
const payrollModel = require("../models/payrollModel");

exports.generate = async (employee_id, month) => {
  const emp = await pool.query(
    "SELECT salary,user_id FROM employees WHERE id=$1",
    [employee_id]
  );

  const base = emp.rows[0].salary;

  const leave = await pool.query(
    `SELECT COUNT(*) FROM leaves WHERE employee_id=$1 AND status='APPROVED'
     AND EXTRACT(MONTH FROM start_date)=$2`,
    [employee_id, month]
  );

  const existing = await pool.query(
  `SELECT * FROM payroll WHERE employee_id=$1 AND month=$2`,
  [employee_id, month]
);

if (existing.rows.length) {
  throw new Error("Payroll already generated");
}

  const days = parseInt(leave.rows[0].count);
  const deduction = (base / 30) * days;
  const net = base - deduction;

  return (await payrollModel.create({
    empId: employee_id,
    base,
    deduction,
    net,
    month
  })).rows[0];
};