const bcrypt = require("bcrypt");
const pool = require("../config/db");
const employeeModel = require("../models/employeeModel");
const auditService = require("./auditService");

const toPagination = (page, limit) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
};

exports.getProfile = async (userId) => {
  return await employeeModel.findByUserId(userId);
};

exports.createEmployee = async ({ actorUserId, payload }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const userInsert = await client.query(
      `INSERT INTO users(email, password, role)
       VALUES($1, $2, $3)
       RETURNING id, email, role`,
      [payload.email, hashedPassword, payload.role || "EMPLOYEE"]
    );

    const user = userInsert.rows[0];
    const employeeInsert = await client.query(
      `INSERT INTO employees(
         user_id, name, phone, address, department, position, salary, leave_balance
       ) VALUES($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        user.id,
        payload.name,
        payload.phone || null,
        payload.address || null,
        payload.department || null,
        payload.position || null,
        payload.salary,
        payload.leave_balance,
      ]
    );

    await client.query("COMMIT");

    await auditService.log({
      actorUserId,
      action: "EMPLOYEE_CREATED",
      targetType: "employee",
      targetId: employeeInsert.rows[0].id,
      metadata: {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
    });

    return {
      user,
      employee: employeeInsert.rows[0],
    };
  } catch (err) {
    await client.query("ROLLBACK");

    if (err.code === "23505") {
      throw new Error("User already exists");
    }

    throw err;
  } finally {
    client.release();
  }
};

exports.listEmployees = async ({ page, limit, search, department, role }) => {
  const { offset, ...pagination } = toPagination(page, limit);

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT
         e.id,
         e.user_id,
         e.name,
         e.phone,
         e.address,
         e.department,
         e.position,
         e.salary,
         e.leave_balance,
         u.email,
         u.role
       FROM employees e
       JOIN users u ON u.id = e.user_id
       WHERE (
         $1::text IS NULL
         OR e.name ILIKE '%' || $1 || '%'
         OR u.email ILIKE '%' || $1 || '%'
       )
       AND ($2::text IS NULL OR e.department = $2)
       AND ($3::text IS NULL OR u.role = $3)
       ORDER BY e.id DESC
       LIMIT $4 OFFSET $5`,
      [search || null, department || null, role || null, pagination.limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM employees e
       JOIN users u ON u.id = e.user_id
       WHERE (
         $1::text IS NULL
         OR e.name ILIKE '%' || $1 || '%'
         OR u.email ILIKE '%' || $1 || '%'
       )
       AND ($2::text IS NULL OR e.department = $2)
       AND ($3::text IS NULL OR u.role = $3)`,
      [search || null, department || null, role || null]
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