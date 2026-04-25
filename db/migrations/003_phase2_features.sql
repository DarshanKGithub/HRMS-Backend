-- Migration: Department Management & Role Enhancements
-- Description: Add department management and manager role support

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  budget DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add manager_id to users for hierarchy
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 3. Update employees to link to department
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;

-- 4. Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  type VARCHAR(20) DEFAULT 'NATIONAL', -- NATIONAL, OPTIONAL, RESTRICTED
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date_from, date_to)
);

-- 5. Create salary components table
CREATE TABLE IF NOT EXISTS salary_components (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  component_type VARCHAR(20) NOT NULL, -- EARNING, DEDUCTION, TAX
  formula TEXT, -- e.g., "base_salary * 0.12"
  is_fixed BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, component_type)
);

-- 6. Create salary templates table
CREATE TABLE IF NOT EXISTS salary_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Junction table: salary template components
CREATE TABLE IF NOT EXISTS salary_template_components (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES salary_templates(id) ON DELETE CASCADE,
  component_id INTEGER NOT NULL REFERENCES salary_components(id) ON DELETE CASCADE,
  order_num INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(template_id, component_id)
);

-- 8. Employee salary structure mapping
CREATE TABLE IF NOT EXISTS employee_salary_structures (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  template_id INTEGER NOT NULL REFERENCES salary_templates(id),
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Update leave calculation to exclude holidays
CREATE TABLE IF NOT EXISTS leave_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date_from ON holidays(date_from);
CREATE INDEX IF NOT EXISTS idx_holidays_active ON holidays(is_active);
CREATE INDEX IF NOT EXISTS idx_salary_templates_default ON salary_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_employee_salary_structures_employee_id ON employee_salary_structures(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_salary_structures_effective_from ON employee_salary_structures(effective_from);

-- Insert default salary components
INSERT INTO salary_components (name, component_type, is_fixed, is_active) VALUES
('Basic Salary', 'EARNING', FALSE, TRUE),
('House Rent Allowance', 'EARNING', FALSE, TRUE),
('Dearness Allowance', 'EARNING', FALSE, TRUE),
('Provident Fund', 'DEDUCTION', FALSE, TRUE),
('Income Tax', 'TAX', FALSE, TRUE),
('Professional Tax', 'TAX', FALSE, TRUE)
ON CONFLICT DO NOTHING;

-- Insert default salary template
INSERT INTO salary_templates (name, description, is_default, is_active) VALUES
('Standard Salary Template', 'Default salary structure for all employees', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- Link components to default template
INSERT INTO salary_template_components (template_id, component_id, order_num)
SELECT (SELECT id FROM salary_templates WHERE is_default = TRUE LIMIT 1),
       id,
       ROW_NUMBER() OVER (ORDER BY id)
FROM salary_components
WHERE is_active = TRUE
ON CONFLICT DO NOTHING;

-- Insert default leave settings
INSERT INTO leave_settings (setting_key, setting_value, description) VALUES
('exclude_holidays', 'true', 'Exclude holidays from leave calculations'),
('exclude_weekends', 'true', 'Exclude weekends from leave calculations'),
('default_leave_balance', '20', 'Default annual leave balance for new employees'),
('leave_year_start_month', '1', 'Month when leave year starts (1-12)')
ON CONFLICT DO NOTHING;
