const pool = require("../config/db");
const payrollModel = require("../models/payrollModel");

exports.generate = async (employee_id, month) => {
  const monthNumber = Number(month);
  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    throw new Error("Invalid month");
  }

  const emp = await pool.query(
    "SELECT salary,user_id FROM employees WHERE id=$1",
    [employee_id]
  );

  if (!emp.rows.length) {
    throw new Error("Employee not found");
  }

  const base = emp.rows[0].salary;

  if (base === null || Number(base) <= 0) {
    throw new Error("Employee salary is invalid");
  }

  const leave = await pool.query(
    `SELECT COUNT(*)
     FROM leaves
     WHERE employee_id=$1
       AND status='APPROVED'
       AND UPPER(type)='UNPAID'
       AND EXTRACT(MONTH FROM start_date)=$2`,
    [employee_id, monthNumber]
  );

  const existing = await pool.query(
    `SELECT * FROM payroll WHERE employee_id=$1 AND month=$2`,
    [employee_id, String(monthNumber)]
  );

  if (existing.rows.length) {
    throw new Error("Payroll already generated");
  }

  const days = parseInt(leave.rows[0].count);
  const deduction = (base / 30) * days;
  const net = Math.max(base - deduction, 0);

  return (await payrollModel.create({
    empId: employee_id,
    base,
    deduction,
    net,
    month: String(monthNumber)
  })).rows[0];
};