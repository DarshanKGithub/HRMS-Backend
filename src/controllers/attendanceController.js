const service = require("../services/attendanceService");
const getEmpId = require("../utils/getEmployeeId");

const mapAttendanceError = (err) => {
  if (err.message === "Already clocked in") err.status = 409;
  else if (err.message === "No clock-in found") err.status = 409;
  else if (err.message === "Employee not found") err.status = 404;
};

exports.clockIn = async (req, res, next) => {
  try {
    const id = await getEmpId(req.user.id);
    res.status(200).json(await service.clockIn(id));
  } catch (err) {
    mapAttendanceError(err);
    next(err);
  }
};

exports.clockOut = async (req, res, next) => {
  try {
    const id = await getEmpId(req.user.id);
    res.status(200).json(await service.clockOut(id));
  } catch (err) {
    mapAttendanceError(err);
    next(err);
  }
};