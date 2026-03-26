const service = require("../services/reportService");

exports.attendance = async (req, res) => {
  const data = await service.getAttendanceReport(req.query.month);
  res.json(data.rows);
};

exports.leave = async (req, res) => {
  const data = await service.getLeaveReport();
  res.json(data.rows);
};

exports.payroll = async (req, res) => {
  const data = await service.getPayrollSummary(req.query.month);
  res.json(data.rows[0]);
};