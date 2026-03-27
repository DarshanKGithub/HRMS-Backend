const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const ROLES = require("../config/roles");
const reportCtrl = require("../controllers/reportController");
const notificationCtrl = require("../controllers/notificationController");
const leaveCtrl = require("../controllers/leaveController");
const employeeCtrl = require("../controllers/employeeController");

const validate = require("../middlewares/validateMiddleware");
const createRateLimiter = require("../middlewares/rateLimitMiddleware");
const loginSecurity = require("../middlewares/loginSecurityMiddleware");
const {
	loginSchema,
	registerSchema,
	refreshTokenSchema,
	logoutSchema,
} = require("../validators/authValidator");
const { applyLeaveSchema, updateLeaveStatusSchema } = require("../validators/leaveValidator");
const { generatePayrollSchema } = require("../validators/payrollValidator");
const {
	createEmployeeSchema,
	listEmployeesQuerySchema,
} = require("../validators/employeeValidator");

const authCtrl = require("../controllers/authController");
const attCtrl = require("../controllers/attendanceController");
const payrollCtrl = require("../controllers/payrollController");

const loginRateLimiter = createRateLimiter({
	windowMs: 15 * 60 * 1000,
	max: 20,
	keySelector: (req) => `${req.ip}:${(req.body.email || "").toLowerCase()}`,
	message: "Too many login attempts. Try again later.",
});

router.post("/login", loginRateLimiter, validate(loginSchema), loginSecurity, authCtrl.login);
router.post("/auth/refresh-token", validate(refreshTokenSchema), authCtrl.refreshToken);
router.post("/auth/logout", auth(), validate(logoutSchema), authCtrl.logout);
router.post("/register", auth([ROLES.ADMIN]), validate(registerSchema), authCtrl.register);

router.post("/clock-in", auth(), attCtrl.clockIn);
router.post("/clock-out", auth(), attCtrl.clockOut);

router.post(
	"/admin/payroll",
	auth([ROLES.ADMIN]),
	validate(generatePayrollSchema),
	payrollCtrl.generate
);
router.get("/payroll/:id/payslip", auth(), payrollCtrl.downloadPayslip);

router.get("/admin/reports/attendance", auth([ROLES.ADMIN]), reportCtrl.attendance);
router.get("/admin/reports/leave", auth([ROLES.ADMIN]), reportCtrl.leave);
router.get("/admin/reports/payroll", auth([ROLES.ADMIN]), reportCtrl.payroll);

router.get("/employee/profile", auth([ROLES.EMPLOYEE, ROLES.ADMIN]), employeeCtrl.getProfile);
router.put("/employee/profile", auth([ROLES.EMPLOYEE, ROLES.ADMIN]), employeeCtrl.updateProfile);
router.post(
	"/admin/employees",
	auth([ROLES.ADMIN]),
	validate(createEmployeeSchema),
	employeeCtrl.createEmployee
);
router.get(
	"/admin/employees",
	auth([ROLES.ADMIN]),
	validate(listEmployeesQuerySchema, "query"),
	employeeCtrl.listEmployees
);

router.post(
	"/leaves",
	auth([ROLES.EMPLOYEE, ROLES.ADMIN]),
	validate(applyLeaveSchema),
	leaveCtrl.applyLeave
);
router.get("/leaves/my", auth([ROLES.EMPLOYEE, ROLES.ADMIN]), leaveCtrl.getMyLeaves);
router.get("/admin/leaves", auth([ROLES.ADMIN]), leaveCtrl.getAllLeaves);
router.patch(
	"/admin/leaves/:id/status",
	auth([ROLES.ADMIN]),
	validate(updateLeaveStatusSchema),
	leaveCtrl.updateLeaveStatus
);

router.get("/notifications", auth(), notificationCtrl.getNotifications);
router.patch("/notifications/:id/read", auth(), notificationCtrl.markAsRead);
router.patch("/notifications/read-all", auth(), notificationCtrl.markAllAsRead);

module.exports = router;