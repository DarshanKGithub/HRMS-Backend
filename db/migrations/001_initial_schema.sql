CREATE TABLE IF NOT EXISTS users(
   id SERIAL PRIMARY KEY,
   email VARCHAR(100) UNIQUE NOT NULL,
   password TEXT NOT NULL,
   role VARCHAR(20) DEFAULT 'EMPLOYEE'
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    name VARCHAR(100),
    phone VARCHAR(15),
    address TEXT,
    department VARCHAR(50),
    position VARCHAR(50),
    salary NUMERIC,
    leave_balance INT DEFAULT 20
);

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    work_hours NUMERIC,
    date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS leaves (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    start_date DATE,
    end_date DATE,
    reason TEXT,
    type VARCHAR(20),
    status VARCHAR(20) DEFAULT 'PENDING'
);

CREATE TABLE IF NOT EXISTS payroll (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    base_salary NUMERIC,
    deductions NUMERIC,
    net_salary NUMERIC,
    month VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    actor_user_id INT,
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(50),
    target_id INT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS attendance_employee_date_unique
ON attendance(employee_id, date);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leaves_status_check'
  ) THEN
    ALTER TABLE leaves
    ADD CONSTRAINT leaves_status_check
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payroll_month_check'
  ) THEN
    ALTER TABLE payroll
    ADD CONSTRAINT payroll_month_check
    CHECK (month ~ '^(?:[1-9]|1[0-2])$');
  END IF;
END $$;
