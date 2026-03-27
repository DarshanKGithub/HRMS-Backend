const service = require("../services/reportService");

const parseMonth = (rawMonth) => {
  const month = Number(rawMonth);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    const err = new Error("month must be an integer between 1 and 12");
    err.status = 422;
    throw err;
  }
  return month;
};

exports.attendance = async (req, res, next) => {
  try {
    const month = parseMonth(req.query.month);
    const data = await service.getAttendanceReport({
      month,
      page: req.query.page,
      limit: req.query.limit,
      employeeName: req.query.employee_name,
    });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.leave = async (req, res, next) => {
  try {
    const data = await service.getLeaveReport();
    res.status(200).json(data.rows);
  } catch (err) {
    next(err);
  }
};

exports.payroll = async (req, res, next) => {
  try {
    const month = parseMonth(req.query.month);
    const data = await service.getPayrollSummary({
      month,
      page: req.query.page,
      limit: req.query.limit,
      employeeId: req.query.employee_id ? Number(req.query.employee_id) : null,
    });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};