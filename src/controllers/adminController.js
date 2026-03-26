const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.createEmployee = async (req, res) => {
  const { name, email, phone, department, position, salary, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = await pool.query(
    `INSERT INTO users(email,password,role)
     VALUES($1,$2,'EMPLOYEE') RETURNING *`,
    [email, hashed]
  );

  const employee = await pool.query(
    `INSERT INTO employees(user_id,name,phone,department,position,salary)
     VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      user.rows[0].id,
      name,
      phone,
      department,
      position,
      salary
    ]
  );

  res.json(employee.rows[0]);
};

exports.getEmployees = async (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT * FROM employees
     WHERE name ILIKE $1 OR department ILIKE $1
     LIMIT $2 OFFSET $3`,
    [`%${search}%`, limit, offset]
  );

  res.json(result.rows);
};

exports.updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const result = await pool.query(
    `UPDATE leaves SET status=$1 WHERE id=$2 RETURNING *`,
    [status, id]
  );

  res.json(result.rows[0]);
};