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
const offerLetterCtrl = require("../controllers/offerLetterController");
const phase2Ctrl = require("../controllers/phase2Controller");
const {
	createOfferLetterSchema,
	updateOfferLetterSchema,
	updateOfferStatusSchema,
	rejectOfferSchema,
	createTemplateSchema,
	listOffersQuerySchema,
} = require("../validators/offerLetterValidator");
const {
	createDepartmentSchema,
	updateDepartmentSchema,
	listDepartmentsQuerySchema,
	createHolidaySchema,
	updateHolidaySchema,
	listHolidaysQuerySchema,
	createSalaryComponentSchema,
	updateSalaryComponentSchema,
	listSalaryComponentsQuerySchema,
	createSalaryTemplateSchema,
	addSalaryComponentSchema,
	listSalaryTemplatesQuerySchema,
	assignManagerSchema,
	assignSalaryTemplateSchema,
} = require("../validators/phase2Validator");

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

// Offer Letter Routes (Admin)
router.post(
	"/admin/offer-letters",
	auth([ROLES.ADMIN]),
	validate(createOfferLetterSchema),
	offerLetterCtrl.createOfferLetter
);
router.get(
	"/admin/offer-letters",
	auth([ROLES.ADMIN]),
	validate(listOffersQuerySchema, "query"),
	offerLetterCtrl.listOffers
);
router.get("/admin/offer-letters/:id", auth([ROLES.ADMIN]), offerLetterCtrl.getOffer);
router.put(
	"/admin/offer-letters/:id",
	auth([ROLES.ADMIN]),
	validate(updateOfferLetterSchema),
	offerLetterCtrl.updateOffer
);
router.delete("/admin/offer-letters/:id", auth([ROLES.ADMIN]), offerLetterCtrl.deleteOffer);
router.post("/admin/offer-letters/:id/send", auth([ROLES.ADMIN]), offerLetterCtrl.sendOffer);
router.post(
	"/admin/offer-letters/:id/pdf",
	auth([ROLES.ADMIN]),
	offerLetterCtrl.generatePDF
);
router.get(
	"/admin/offer-letters/:id/pdf/download",
	auth([ROLES.ADMIN]),
	offerLetterCtrl.downloadPDF
);
router.get(
	"/admin/offer-letters/:id/audit",
	auth([ROLES.ADMIN]),
	offerLetterCtrl.getAuditTrail
);

// Offer Letter Routes (Employee - Self-service)
router.get(
	"/offer-letters/my",
	auth([ROLES.EMPLOYEE, ROLES.ADMIN]),
	offerLetterCtrl.getMyOffers
);
router.post(
	"/offer-letters/:id/accept",
	auth([ROLES.EMPLOYEE, ROLES.ADMIN]),
	offerLetterCtrl.acceptOffer
);
router.post(
	"/offer-letters/:id/reject",
	auth([ROLES.EMPLOYEE, ROLES.ADMIN]),
	validate(rejectOfferSchema),
	offerLetterCtrl.rejectOffer
);

// Offer Letter Template Routes (Admin only)
router.get(
	"/admin/offer-letter-templates",
	auth([ROLES.ADMIN]),
	offerLetterCtrl.getTemplates
);
router.post(
	"/admin/offer-letter-templates",
	auth([ROLES.ADMIN]),
	validate(createTemplateSchema),
	offerLetterCtrl.createTemplate
);

// ========== PHASE 2: DEPARTMENT MANAGEMENT ROUTES ==========
router.post(
	"/admin/departments",
	auth([ROLES.ADMIN]),
	validate(createDepartmentSchema),
	phase2Ctrl.createDepartment
);
router.get(
	"/admin/departments",
	auth([ROLES.ADMIN]),
	validate(listDepartmentsQuerySchema, "query"),
	phase2Ctrl.listDepartments
);
router.get(
	"/admin/departments/:id",
	auth([ROLES.ADMIN]),
	phase2Ctrl.getDepartment
);
router.put(
	"/admin/departments/:id",
	auth([ROLES.ADMIN]),
	validate(updateDepartmentSchema),
	phase2Ctrl.updateDepartment
);
router.delete(
	"/admin/departments/:id",
	auth([ROLES.ADMIN]),
	phase2Ctrl.deleteDepartment
);

// ========== PHASE 2: HOLIDAY CALENDAR ROUTES ==========
router.post(
	"/admin/holidays",
	auth([ROLES.ADMIN]),
	validate(createHolidaySchema),
	phase2Ctrl.createHoliday
);
router.get(
	"/admin/holidays",
	auth([ROLES.ADMIN]),
	validate(listHolidaysQuerySchema, "query"),
	phase2Ctrl.listHolidays
);
router.get(
	"/holidays",
	auth([ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.MANAGER]),
	validate(listHolidaysQuerySchema, "query"),
	phase2Ctrl.listHolidays
);
router.put(
	"/admin/holidays/:id",
	auth([ROLES.ADMIN]),
	validate(updateHolidaySchema),
	phase2Ctrl.updateHoliday
);
router.delete(
	"/admin/holidays/:id",
	auth([ROLES.ADMIN]),
	phase2Ctrl.deleteHoliday
);

// ========== PHASE 2: SALARY COMPONENT ROUTES ==========
router.post(
	"/admin/salary-components",
	auth([ROLES.ADMIN]),
	validate(createSalaryComponentSchema),
	phase2Ctrl.createSalaryComponent
);
router.get(
	"/admin/salary-components",
	auth([ROLES.ADMIN]),
	validate(listSalaryComponentsQuerySchema, "query"),
	phase2Ctrl.listSalaryComponents
);
router.get(
	"/admin/salary-components/:type",
	auth([ROLES.ADMIN]),
	phase2Ctrl.getSalaryComponentsByType
);
router.put(
	"/admin/salary-components/:id",
	auth([ROLES.ADMIN]),
	validate(updateSalaryComponentSchema),
	phase2Ctrl.updateSalaryComponent
);

// ========== PHASE 2: SALARY TEMPLATE ROUTES ==========
router.post(
	"/admin/salary-templates",
	auth([ROLES.ADMIN]),
	validate(createSalaryTemplateSchema),
	phase2Ctrl.createSalaryTemplate
);
router.get(
	"/admin/salary-templates",
	auth([ROLES.ADMIN]),
	validate(listSalaryTemplatesQuerySchema, "query"),
	phase2Ctrl.listSalaryTemplates
);
router.get(
	"/admin/salary-templates/:id",
	auth([ROLES.ADMIN]),
	phase2Ctrl.getSalaryTemplate
);
router.post(
	"/admin/salary-templates/:id/components",
	auth([ROLES.ADMIN]),
	validate(addSalaryComponentSchema),
	phase2Ctrl.addComponentToTemplate
);
router.delete(
	"/admin/salary-templates/:id/components/:componentId",
	auth([ROLES.ADMIN]),
	phase2Ctrl.removeComponentFromTemplate
);

// ========== PHASE 2: SALARY STRUCTURE ASSIGNMENT ROUTES ==========
router.post(
	"/admin/employees/:employeeId/salary-template",
	auth([ROLES.ADMIN]),
	validate(assignSalaryTemplateSchema),
	phase2Ctrl.assignSalaryTemplate
);
router.get(
	"/admin/employees/:employeeId/salary-template",
	auth([ROLES.ADMIN]),
	phase2Ctrl.getEmployeeSalaryTemplate
);

// ========== PHASE 2: MANAGER ASSIGNMENT ROUTES ==========
router.post(
	"/admin/managers/assign",
	auth([ROLES.ADMIN]),
	validate(assignManagerSchema),
	phase2Ctrl.assignManager
);

module.exports = router;