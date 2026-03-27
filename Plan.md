# HRMS Backend Plan

Date: 2026-03-27

## 1) Current State (What Is Already Done)

### Core setup
- Express app bootstrapped with CORS and JSON parsing.
- Route mounting under /api.
- PostgreSQL pool configuration via environment variables.
- JWT-based authentication middleware present.

### Auth
- Login flow implemented with bcrypt password verification and JWT issuance.
- Joi login schema exists for email/password format checks.

### Attendance
- Clock-in endpoint implemented.
- Clock-out endpoint implemented.
- Attendance service includes guard rules for duplicate clock-in and missing clock-in before clock-out.
- Attendance model calculates work hours using clock_in/clock_out delta.

### Payroll
- Admin payroll generation endpoint implemented.
- Payroll generation computes deduction and net salary.
- Duplicate payroll check for same employee and month implemented.
- Payslip PDF generation implemented with pdf-lib.

### Reports
- Attendance summary report by month implemented.
- Leave status summary report implemented.
- Payroll totals report by month implemented.

### Leave
- Leave apply endpoint implemented.
- My leaves listing endpoint implemented.
- Leave balance check logic exists in leave service.

### Notifications
- Notification listing endpoint implemented.
- Notification service supports create and fetch.

### Data layer
- SQL schema for users, employees, attendance, leaves, payroll, notifications exists.
- Basic models for users, employees, attendance, leaves, payroll created.

## 2) Gaps and Risks Found During Analysis

### Critical correctness issues
- Route validation wiring is incorrect: login currently uses auth middleware as validator.
- Auth middleware contains broken code (schema reference in token middleware), which can crash runtime.
- Some controllers duplicate auth logic and bypass service/model abstraction.

### Missing API coverage
- Several controllers/services are not exposed via routes (employee profile, leave service flow, register flow).
- No admin leave approval/rejection endpoints, though payroll depends on approved leave.
- No endpoint to mark notifications as read.

### Validation and error handling
- Input validation is inconsistent across endpoints.
- Many async handlers do not have try/catch and may leak internal errors.
- HTTP status usage is inconsistent (400 vs 401/403/404/409/422).

### Security and operations
- No rate limiting on login.
- No token expiration strategy documented.
- No centralized logger / request tracing.
- No migration tool or seed strategy.

### Quality and maintainability
- Mixed architecture style: some controllers use services/models, some execute SQL directly.
- No automated tests found (unit/integration/e2e).
- No API documentation (OpenAPI/Swagger).

## 3) What We Can Do More (Execution Plan)

### Phase 1: Stabilize (High Priority)
1. Fix auth middleware and create a dedicated request validation middleware.
2. Standardize error handling with global error middleware.
3. Add missing try/catch wrappers in all controllers.
4. Normalize status codes and error response format.

### Phase 2: Complete Functional Scope
1. Expose missing routes for register, employee profile, and leave service flow.
2. Add admin leave approval/rejection APIs.
3. Add notification read/unread APIs.
4. Add pagination/filtering for leaves, notifications, and reports.

### Phase 3: Security and Governance
1. Add login rate limiting and account lockout policy.
2. Add JWT expiry + refresh token flow.
3. Add role matrix for all endpoints (least privilege).
4. Add audit logging for payroll and leave decisions.

### Phase 4: Data and Domain Accuracy
1. Validate month format and range for payroll/report endpoints.
2. Prevent overlapping leave requests and invalid date ranges.
3. Enforce one attendance record per employee/day at DB level.
4. Re-check payroll deduction policy (approved leave may be paid/unpaid by type).

### Phase 5: Engineering Quality
1. Add unit tests for services and middleware.
2. Add integration tests for auth, attendance, payroll, and reports.
3. Add API docs (Swagger) and environment setup documentation.
4. Add DB migrations and seed scripts.

## 4) Suggested Immediate Backlog (Next Sprint)

1. Fix middleware validation bug and auth guard bug.
2. Add centralized validator and error middleware.
3. Add leave approval endpoint with role-based access.
4. Add tests for login, clock-in/out, payroll generation duplicate checks.
5. Add API documentation and sample Postman collection.

## 5) Phase 1 Implementation Status (Completed)

Completed on: 2026-03-27

1. Fixed auth middleware by removing broken schema usage, validating Bearer token format, and enforcing role checks through standardized errors.
2. Added dedicated Joi validation middleware for request validation.
3. Added global not-found and error handling middleware with normalized error response shape.
4. Wired route-level login validation to the new validation middleware.
5. Refactored controllers to use try/catch + next(err) and normalized status codes (401/403/404/409/422/500).
6. Added explicit payroll service checks for missing employee and invalid salary.

## 6) Phase 2, 3, 4 and Suggested Backlog Status (Completed)

Completed on: 2026-03-27

### Phase 2: Complete Functional Scope
1. Added missing routes for register, employee profile get/update, leave apply/get, and auth refresh/logout.
2. Added admin leave listing and approval/rejection endpoint with role-based access.
3. Added notification read-one and read-all endpoints.
4. Added pagination/filtering for leaves, notifications, attendance report, and payroll report records.

### Phase 3: Security and Governance
1. Added global and login-specific in-memory rate limiting.
2. Added login lockout policy based on failed attempts per email+IP.
3. Implemented JWT access/refresh token flow with refresh token revocation on rotate/logout.
4. Added role constants and applied role matrix consistently in routes.
5. Added audit logging service and integrated logging for payroll generation and leave decisions.

### Phase 4: Data and Domain Accuracy
1. Enforced month validation (1-12) in payroll generation/reporting.
2. Added leave request date validation and overlap prevention.
3. Added DB-level attendance uniqueness guard (employee_id + date).
4. Updated payroll deduction policy to deduct only approved UNPAID leaves.
5. Prevented negative net salary.

### Suggested Immediate Backlog Items Implemented
1. Leave approval endpoint with role-based access implemented.
2. Tests added for login flow service, clock-in/out guard behavior, and payroll duplicate/month validation.
3. API documentation added in OpenAPI format.
4. Postman collection added for core flows.

## 7) Phase 5 Status (Completed)

Completed on: 2026-03-27

1. Added integration tests for route-level validation/auth/not-found/CORS behavior.
2. Added DB migration and seed structure with executable scripts (`npm run migrate`, `npm run seed`).
3. Added complete frontend-facing API documentation for all endpoints.
4. Expanded OpenAPI spec to include every route currently exposed by the backend.
5. Added environment setup documentation with CORS configuration guidance.
6. Hardened CORS configuration to allow explicit origin control via `CORS_ORIGINS`.
