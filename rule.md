# HRMS Backend Rules and Edge Cases

Date: 2026-03-27

## 1) Global API Rules

1. Every protected endpoint must require Authorization: Bearer <token>.
2. Missing token must return 401.
3. Invalid or expired token must return 401.
4. Valid token with insufficient role must return 403.
5. Validation errors must return 422 with field-level details.
6. Resource not found must return 404.
7. Conflict scenarios (duplicate action) must return 409.
8. Unexpected server failures must return 500 without exposing internal stack traces.
9. All write endpoints should be idempotency-safe where possible.
10. All date/time operations should use a consistent timezone policy.

## 2) Authentication Edge Cases

1. Login with unknown email.
2. Login with wrong password.
3. Login with malformed email format.
4. Login with empty password.
5. Login brute force attempts from same IP.
6. Token signed with wrong secret.
7. Token with missing role claim.
8. Token for deleted/disabled user.
9. Token replay from another device/session if session invalidation is introduced.

## 3) Employee Mapping Edge Cases

1. Authenticated user exists in users table but no employees row.
2. Multiple employee rows accidentally linked to same user_id.
3. employee_id requested does not exist during payroll generation.
4. Employee salary is null or <= 0.

## 4) Attendance Edge Cases

1. Multiple clock-in attempts on same day.
2. Clock-out attempted before clock-in.
3. Clock-out attempted after already clocked out.
4. Clock-in near midnight and clock-out next day.
5. Timezone mismatch causing wrong CURRENT_DATE.
6. Negative or unrealistic work_hours due to server time drift.
7. Concurrent requests producing duplicate attendance records.
8. Attendance record missing clock_in but has clock_out due to manual DB edits.

## 5) Leave Edge Cases

1. start_date is after end_date.
2. start_date equals end_date (single-day leave) should be clearly allowed/denied by policy.
3. Leave request overlaps an existing pending/approved leave.
4. Leave type is invalid (not in allowed enum).
5. Leave reason empty when policy requires it.
6. Leave applied with no leave_balance left.
7. leave_balance goes negative due to race condition.
8. Applying leave for past dates beyond allowed backdate window.
9. Applying leave across month/year boundaries.
10. Payroll month generated before leave approval finalization.

## 6) Payroll Edge Cases

1. Payroll generation for same employee and month twice.
2. Payroll generation for invalid month format/value.
3. Employee has no salary configured.
4. Leave count query includes leave outside target month due to boundary conditions.
5. Deduction exceeds base salary (net becomes negative).
6. Approved leave counted for deduction even when leave type is paid leave.
7. Payroll generated before all attendance/leave records are finalized.
8. Concurrent payroll requests create duplicate rows.
9. Payslip download for non-existing payroll id.
10. Payslip download by unauthorized user accessing another employee payroll.

## 7) Reports Edge Cases

1. month query missing for monthly reports.
2. month query not numeric or out of 1-12 range.
3. Reports returning null sums when no data exists.
4. Very large datasets causing slow aggregation.
5. Inconsistent report totals due to late data updates after payroll generation.

## 8) Notification Edge Cases

1. Notifications query for user with no notifications.
2. Notification records with invalid user_id references.
3. High-volume notifications without pagination.
4. Missing read/unread transition API causing repeated unread UX issues.

## 9) Database and Transaction Rules

1. Use transactions for multi-step writes (example: leave approval + balance update + notification).
2. Enforce DB unique/index constraints for business invariants where possible.
3. Add check constraints (salary >= 0, month format, valid status values).
4. Use foreign keys with clear ON DELETE/ON UPDATE behavior.
5. Guard against race conditions with row locks or conflict-safe queries in critical flows.

## 10) Operational Edge Cases

1. Missing environment variables (DB credentials, JWT secret).
2. DB unavailable at startup or runtime.
3. Partial outage where reads succeed and writes fail.
4. Large request payloads and malformed JSON bodies.
5. Graceful shutdown handling for in-flight requests.
6. Insufficient logging context to debug production issues.

## 11) Recommended Rule Enforcement Checklist

1. Central request validation middleware for body/query/params.
2. Central error handler with consistent response schema.
3. Role/permission matrix and endpoint guard tests.
4. DB constraints for uniqueness and validity.
5. Automated tests for all edge cases listed above.
