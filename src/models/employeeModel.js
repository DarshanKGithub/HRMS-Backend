const pool = require("../config/db");

exports.findByUserId = (id) =>
  pool.query("SELECT * FROM employees WHERE user_id=$1", [id]);

exports.create = (data) => {
  const { user_id, name, phone, department, position, salary } = data;
  return pool.query(
    `INSERT INTO employees(user_id,name,phone,department,position,salary)
     VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
    [user_id, name, phone, department, position, salary]
  );
};