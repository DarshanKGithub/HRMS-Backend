const pool = require("../config/db");

exports.apply = (data) => {
  const { empId, start_date, end_date, reason, type } = data;
  return pool.query(
    `INSERT INTO leaves(employee_id,start_date,end_date,reason,type)
     VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [empId, start_date, end_date, reason, type]
  );
};