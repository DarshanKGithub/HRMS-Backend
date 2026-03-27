const pool = require("../config/db");

const queryExecutor = (client) => (client || pool);

exports.apply = (data, client) => {
  const { empId, start_date, end_date, reason, type } = data;
  return queryExecutor(client).query(
    `INSERT INTO leaves(employee_id,start_date,end_date,reason,type)
     VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [empId, start_date, end_date, reason, type]
  );
};

exports.findOverlapping = (empId, startDate, endDate) => {
  return pool.query(
    `SELECT id FROM leaves
     WHERE employee_id=$1
       AND status IN ('PENDING', 'APPROVED')
       AND start_date <= $3
       AND end_date >= $2
     LIMIT 1`,
    [empId, startDate, endDate]
  );
};

exports.listByEmployee = ({ empId, status, type, limit, offset }) => {
  return pool.query(
    `SELECT * FROM leaves
     WHERE employee_id=$1
       AND ($2::text IS NULL OR status=$2)
       AND ($3::text IS NULL OR type=$3)
     ORDER BY start_date DESC
     LIMIT $4 OFFSET $5`,
    [empId, status || null, type || null, limit, offset]
  );
};

exports.countByEmployee = ({ empId, status, type }) => {
  return pool.query(
    `SELECT COUNT(*)::int AS total
     FROM leaves
     WHERE employee_id=$1
       AND ($2::text IS NULL OR status=$2)
       AND ($3::text IS NULL OR type=$3)`,
    [empId, status || null, type || null]
  );
};

exports.listAll = ({ status, type, employeeId, limit, offset }) => {
  return pool.query(
    `SELECT l.*, e.name AS employee_name, e.user_id
     FROM leaves l
     JOIN employees e ON e.id = l.employee_id
     WHERE ($1::text IS NULL OR l.status=$1)
       AND ($2::text IS NULL OR l.type=$2)
       AND ($3::int IS NULL OR l.employee_id=$3)
     ORDER BY l.start_date DESC, l.id DESC
     LIMIT $4 OFFSET $5`,
    [status || null, type || null, employeeId || null, limit, offset]
  );
};

exports.countAll = ({ status, type, employeeId }) => {
  return pool.query(
    `SELECT COUNT(*)::int AS total
     FROM leaves l
     WHERE ($1::text IS NULL OR l.status=$1)
       AND ($2::text IS NULL OR l.type=$2)
       AND ($3::int IS NULL OR l.employee_id=$3)`,
    [status || null, type || null, employeeId || null]
  );
};

exports.findById = (id, client) => {
  return queryExecutor(client).query("SELECT * FROM leaves WHERE id=$1", [id]);
};

exports.updateStatus = (id, status, client) => {
  return queryExecutor(client).query(
    `UPDATE leaves SET status=$1 WHERE id=$2 RETURNING *`,
    [status, id]
  );
};