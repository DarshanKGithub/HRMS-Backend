const model = require("../models/attendanceModel");

exports.clockIn = async (empId) => {
  const existing = await model.findToday(empId);
  if (existing.rows.length) throw new Error("Already clocked in");
  return (await model.clockIn(empId)).rows[0];
};

exports.clockOut = async (empId) => {
  const existing = await model.findToday(empId);
  if (!existing.rows.length) throw new Error("No clock-in found");
  return (await model.clockOut(empId)).rows[0];
};