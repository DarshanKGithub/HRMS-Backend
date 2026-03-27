const pool = require("../config/db");
const leaveModel = require("../models/leaveModel");
const notificationService = require("./notificationService");
const auditService = require("./auditService");

const parseDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getDays = (start, end) => {
  return Math.floor((parseDate(end) - parseDate(start)) / MS_PER_DAY) + 1;
};

const toPagination = (page, limit) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
};

exports.applyLeave = async (empId, data) => {
  const emp = await pool.query(
    "SELECT leave_balance, user_id FROM employees WHERE id=$1",
    [empId]
  );

  if (!emp.rows.length) {
    throw new Error("Employee not found");
  }

  if (parseDate(data.start_date) > parseDate(data.end_date)) {
    throw new Error("start_date must be less than or equal to end_date");
  }

  const daysRequested = getDays(data.start_date, data.end_date);

  if (daysRequested <= 0) {
    throw new Error("Invalid leave duration");
  }

  const overlap = await leaveModel.findOverlapping(empId, data.start_date, data.end_date);
  if (overlap.rows.length) {
    throw new Error("Leave dates overlap with an existing request");
  }

  if (emp.rows[0].leave_balance < daysRequested) {
    throw new Error("No leave balance left");
  }

  const result = await leaveModel.apply({
    empId,
    start_date: data.start_date,
    end_date: data.end_date,
    reason: data.reason,
    type: data.type,
  });

  await auditService.log({
    actorUserId: emp.rows[0].user_id,
    action: "LEAVE_REQUESTED",
    targetType: "leave",
    targetId: result.rows[0].id,
    metadata: { daysRequested, type: data.type },
  });

  return result.rows[0];
};

exports.getMyLeaves = async (empId, filters) => {
  const { page, limit, offset } = toPagination(filters.page, filters.limit);
  const [rows, count] = await Promise.all([
    leaveModel.listByEmployee({
      empId,
      status: filters.status,
      type: filters.type,
      limit,
      offset,
    }),
    leaveModel.countByEmployee({
      empId,
      status: filters.status,
      type: filters.type,
    }),
  ]);

  return {
    data: rows.rows,
    pagination: {
      page,
      limit,
      total: count.rows[0].total,
    },
  };
};

exports.getAllLeaves = async (filters) => {
  const { page, limit, offset } = toPagination(filters.page, filters.limit);
  const employeeId = filters.employee_id ? Number(filters.employee_id) : null;

  const [rows, count] = await Promise.all([
    leaveModel.listAll({
      status: filters.status,
      type: filters.type,
      employeeId,
      limit,
      offset,
    }),
    leaveModel.countAll({
      status: filters.status,
      type: filters.type,
      employeeId,
    }),
  ]);

  return {
    data: rows.rows,
    pagination: {
      page,
      limit,
      total: count.rows[0].total,
    },
  };
};

exports.updateLeaveStatus = async ({ leaveId, status, adminUserId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const leaveResult = await leaveModel.findById(leaveId, client);
    if (!leaveResult.rows.length) {
      throw new Error("Leave request not found");
    }

    const leave = leaveResult.rows[0];
    if (leave.status !== "PENDING") {
      throw new Error("Leave request is already processed");
    }

    const updated = await leaveModel.updateStatus(leaveId, status, client);

    if (status === "APPROVED") {
      const days = getDays(leave.start_date, leave.end_date);
      const balanceUpdate = await client.query(
        `UPDATE employees
         SET leave_balance = leave_balance - $1
         WHERE id=$2 AND leave_balance >= $1`,
        [days, leave.employee_id]
      );

      if (!balanceUpdate.rowCount) {
        throw new Error("Insufficient leave balance during approval");
      }
    }

    const employee = await client.query(
      "SELECT user_id FROM employees WHERE id=$1",
      [leave.employee_id]
    );

    if (employee.rows.length) {
      await notificationService.create(
        employee.rows[0].user_id,
        `Your leave request #${leaveId} was ${status.toLowerCase()}`,
        client
      );
    }

    await client.query("COMMIT");

    await auditService.log({
      actorUserId: adminUserId,
      action: `LEAVE_${status}`,
      targetType: "leave",
      targetId: leaveId,
      metadata: { employeeId: leave.employee_id },
    });

    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};