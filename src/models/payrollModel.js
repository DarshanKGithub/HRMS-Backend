const pool = require("../config/db");

exports.create = (data) => {
  const { empId, base, deduction, net, month } = data;
  return pool.query(
    `INSERT INTO payroll(employee_id,base_salary,deductions,net_salary,month)
     VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [empId, base, deduction, net, month]
  );
};

exports.findById = (id) =>
  pool.query(
    `SELECT p.*, e.name FROM payroll p 
     JOIN employees e ON p.employee_id=e.id WHERE p.id=$1`,
    [id]
  );