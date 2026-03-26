const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware");

const authCtrl = require("../controllers/authController");
const empCtrl = require("../controllers/employeeController");
const attCtrl = require("../controllers/attendanceController");
const leaveCtrl = require("../controllers/leaveController");
const payrollCtrl = require("../controllers/payrollController");
const adminCtrl = require("../controllers/adminController");

// Auth
router.post("/register", authCtrl.register);
router.post("/login", authCtrl.login);

// Employee
router.get("/profile", auth(), empCtrl.getProfile);
router.put("/profile", auth(), empCtrl.updateProfile);

// Attendance
router.post("/clock-in", auth(), attCtrl.clockIn);
router.post("/clock-out", auth(), attCtrl.clockOut);
router.get("/attendance", auth(), attCtrl.getMyAttendance);

// Leaves
router.post("/leave", auth(), leaveCtrl.applyLeave);
router.get("/leave", auth(), leaveCtrl.getMyLeaves);

// Payroll
router.get("/payroll", auth(), payrollCtrl.getPayroll);

// Admin
router.post("/admin/employee", auth(["ADMIN"]), adminCtrl.createEmployee);
router.get("/admin/employees", auth(["ADMIN"]), adminCtrl.getEmployees);
router.put("/admin/leave/:id", auth(["ADMIN"]), adminCtrl.updateLeaveStatus);

module.exports = router;