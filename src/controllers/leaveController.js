const getEmployeeId = require("../utils/getEmployeeId");
const leaveService = require("../services/leaveService");

exports.applyLeave = async (req, res, next) => {
  try {
    const empId = await getEmployeeId(req.user.id);
    const result = await leaveService.applyLeave(empId, req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.message === "Employee not found") err.status = 404;
    if (
      err.message === "No leave balance left" ||
      err.message === "start_date must be less than or equal to end_date" ||
      err.message === "Leave dates overlap with an existing request" ||
      err.message === "Invalid leave duration" ||
      err.message === "Invalid date format"
    ) {
      err.status = 422;
    }
    next(err);
  }
};

exports.getMyLeaves = async (req, res, next) => {
  try {
    const empId = await getEmployeeId(req.user.id);
    const result = await leaveService.getMyLeaves(empId, req.query);
    res.status(200).json(result);
  } catch (err) {
    if (err.message === "Employee not found") err.status = 404;
    next(err);
  }
};

exports.getAllLeaves = async (req, res, next) => {
  try {
    const result = await leaveService.getAllLeaves(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.updateLeaveStatus = async (req, res, next) => {
  try {
    const result = await leaveService.updateLeaveStatus({
      leaveId: Number(req.params.id),
      status: req.body.status,
      adminUserId: req.user.id,
    });

    res.status(200).json(result);
  } catch (err) {
    if (err.message === "Leave request not found") err.status = 404;
    if (err.message === "Leave request is already processed") err.status = 409;
    if (err.message === "Insufficient leave balance during approval") err.status = 409;
    next(err);
  }
};