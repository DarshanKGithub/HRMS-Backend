const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const reportCtrl = require("../controllers/reportController");
const notificationCtrl = require("../controllers/notificationController")

const validate = require("../middlewares/authMiddleware");
const { loginSchema } = require("../validators/authValidator");

const authCtrl = require("../controllers/authController");
const attCtrl = require("../controllers/attendanceController");
const payrollCtrl = require("../controllers/payrollController");

router.post("/login",validate(loginSchema) ,authCtrl.login);

router.post("/clock-in", auth(), attCtrl.clockIn);
router.post("/clock-out", auth(), attCtrl.clockOut);

router.post("/admin/payroll", auth(["ADMIN"]), payrollCtrl.generate);
router.get("/payroll/:id/payslip", auth(), payrollCtrl.downloadPayslip);

router.get("/admin/reports/attendance", auth(["ADMIN"]), reportCtrl.attendance);
router.get("/admin/reports/leave", auth(["ADMIN"]), reportCtrl.leave);
router.get("/admin/reports/payroll", auth(["ADMIN"]), reportCtrl.payroll);

router.get("/notifications", auth(), notificationCtrl.getNotifications);

module.exports = router;