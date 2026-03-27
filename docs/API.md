# HRMS Backend API Guide

This document lists every API currently available in the backend and how frontend apps should integrate.

## Base URL

- Local: http://localhost:5000
- API prefix: /api

Example full URL: http://localhost:5000/api/login

## Authentication Model

- Access token: JWT in `Authorization: Bearer <token>` header.
- Refresh token: returned from login, used at `/api/auth/refresh-token`.
- Logout: revokes refresh token at `/api/auth/logout`.

## Common Response Rules

- Success status codes: 200, 201.
- Error payload format:

```json
{
  "error": {
    "status": 422,
    "message": "Validation message",
    "details": []
  }
}
```

## Pagination Rules

- Supported query parameters where applicable:
  - `page` (default 1)
  - `limit` (default 10, max 100)
- Paginated response shape:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 37
  }
}
```

## CORS Integration

- Configure backend env var `CORS_ORIGINS` as comma-separated origins.
- Example:

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

- If `CORS_ORIGINS=*`, any origin is allowed.
- Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS.
- Allowed headers: Content-Type, Authorization.

## Endpoints

### 1) Auth

#### POST /api/login
- Public.
- Body:

```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

- Response 200:

```json
{
  "token": "<accessToken>",
  "accessToken": "<accessToken>",
  "refreshToken": "<refreshToken>",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

#### POST /api/auth/refresh-token
- Public.
- Body:

```json
{
  "refreshToken": "<refreshToken>"
}
```

- Response 200:

```json
{
  "accessToken": "<newAccessToken>",
  "refreshToken": "<newRefreshToken>"
}
```

#### POST /api/auth/logout
- Protected.
- Body:

```json
{
  "refreshToken": "<refreshToken>"
}
```

- Response 200:

```json
{
  "message": "Logged out"
}
```

#### POST /api/register
- Protected (ADMIN only).
- Body:

```json
{
  "email": "user@example.com",
  "password": "Password123",
  "role": "EMPLOYEE"
}
```

### 2) Attendance

#### POST /api/clock-in
- Protected.
- Response: attendance row.

#### POST /api/clock-out
- Protected.
- Response: attendance row with `clock_out` and `work_hours`.

### 3) Employee Profile

#### GET /api/employee/profile
- Protected (EMPLOYEE, ADMIN).
- Response: employee profile.

#### PUT /api/employee/profile
- Protected (EMPLOYEE, ADMIN).
- Body:

```json
{
  "phone": "9876543210",
  "address": "Kathmandu"
}
```

### 3.1) Admin Employee Management

#### POST /api/admin/employees
- Protected (ADMIN).
- Creates both `users` and `employees` records in one transaction.
- Body:

```json
{
  "email": "john.doe@example.com",
  "password": "Employee@123",
  "role": "EMPLOYEE",
  "name": "John Doe",
  "phone": "9800000000",
  "address": "Kathmandu, Nepal",
  "department": "Engineering",
  "position": "Software Engineer",
  "salary": 1200,
  "leave_balance": 20
}
```

- Response 201:

```json
{
  "user": {
    "id": 10,
    "email": "john.doe@example.com",
    "role": "EMPLOYEE"
  },
  "employee": {
    "id": 5,
    "user_id": 10,
    "name": "John Doe",
    "phone": "9800000000",
    "address": "Kathmandu, Nepal",
    "department": "Engineering",
    "position": "Software Engineer",
    "salary": "1200",
    "leave_balance": 20
  }
}
```

#### GET /api/admin/employees
- Protected (ADMIN).
- Query params: `page`, `limit`, `search`, `department`, `role`.
- Response follows paginated response shape.

### 4) Leave

#### POST /api/leaves
- Protected (EMPLOYEE, ADMIN).
- Body:

```json
{
  "start_date": "2026-04-01",
  "end_date": "2026-04-03",
  "reason": "Medical",
  "type": "SICK"
}
```

#### GET /api/leaves/my
- Protected (EMPLOYEE, ADMIN).
- Query params: `status`, `type`, `page`, `limit`.

#### GET /api/admin/leaves
- Protected (ADMIN).
- Query params: `status`, `type`, `employee_id`, `page`, `limit`.

#### PATCH /api/admin/leaves/:id/status
- Protected (ADMIN).
- Body:

```json
{
  "status": "APPROVED"
}
```

### 5) Payroll

#### POST /api/admin/payroll
- Protected (ADMIN).
- Body:

```json
{
  "employee_id": 2,
  "month": 3
}
```

#### GET /api/payroll/:id/payslip
- Protected.
- Response: PDF binary (`Content-Type: application/pdf`).

### 6) Reports

#### GET /api/admin/reports/attendance
- Protected (ADMIN).
- Query params: `month` (required), `employee_name`, `page`, `limit`.

#### GET /api/admin/reports/leave
- Protected (ADMIN).
- Response: grouped leave status counts.

#### GET /api/admin/reports/payroll
- Protected (ADMIN).
- Query params: `month` (required), `employee_id`, `page`, `limit`.

### 7) Notifications

#### GET /api/notifications
- Protected.
- Query params: `is_read` (`true` or `false`), `page`, `limit`.

#### PATCH /api/notifications/:id/read
- Protected.
- Marks one notification as read.

#### PATCH /api/notifications/read-all
- Protected.
- Marks all current user notifications as read.

## Frontend Integration Checklist

1. Store `accessToken` and `refreshToken` after login.
2. Send `Authorization` header on all protected endpoints.
3. On 401 from protected routes, call refresh endpoint and retry request.
4. Implement global API error handler using `error.message`.
5. Use paginated responses with server pagination metadata.
