const pool = require("../config/db");

const toPagination = (page, limit) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
};

exports.getAttendanceReport = async ({ month, page, limit, employeeName }) => {
  const { offset, ...pagination } = toPagination(page, limit);

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT e.id AS employee_id, e.name, COUNT(a.id)::int AS days_present
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       WHERE EXTRACT(MONTH FROM a.date) = $1
         AND ($2::text IS NULL OR e.name ILIKE '%' || $2 || '%')
       GROUP BY e.id, e.name
       ORDER BY e.name ASC
       LIMIT $3 OFFSET $4`,
      [month, employeeName || null, pagination.limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM (
        SELECT e.id
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        WHERE EXTRACT(MONTH FROM a.date) = $1
          AND ($2::text IS NULL OR e.name ILIKE '%' || $2 || '%')
        GROUP BY e.id
      ) t`,
      [month, employeeName || null]
    ),
  ]);

  return {
    data: rows.rows,
    pagination: {
      ...pagination,
      total: count.rows[0].total,
    },
  };
};

exports.getLeaveReport = async () => {
  return await pool.query(
    `SELECT status, COUNT(*) FROM leaves GROUP BY status`
  );
};

exports.getPayrollSummary = async ({ month, page, limit, employeeId }) => {
  const { offset, ...pagination } = toPagination(page, limit);

  const [summary, rows, count] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(base_salary),0) as total_salary,
              COALESCE(SUM(deductions),0) as total_deductions,
              COALESCE(SUM(net_salary),0) as total_net
       FROM payroll
       WHERE month = $1
         AND ($2::int IS NULL OR employee_id=$2)`,
      [month, employeeId || null]
    ),
    pool.query(
      `SELECT p.*, e.name AS employee_name
       FROM payroll p
       JOIN employees e ON e.id = p.employee_id
       WHERE p.month = $1
         AND ($2::int IS NULL OR p.employee_id=$2)
       ORDER BY p.created_at DESC
       LIMIT $3 OFFSET $4`,
      [month, employeeId || null, pagination.limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM payroll
       WHERE month = $1
         AND ($2::int IS NULL OR employee_id=$2)`,
      [month, employeeId || null]
    ),
  ]);

  return {
    summary: summary.rows[0],
    data: rows.rows,
    pagination: {
      ...pagination,
      total: count.rows[0].total,
    },
  };
};