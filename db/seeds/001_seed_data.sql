INSERT INTO users(email, password, role)
VALUES
  ('admin@example.com', '$2b$10$Ct5NL70WYV0htykEttshj.0J7.FBYCjK0plp41Jlob6ABElDn0rGa', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users(email, password, role)
VALUES
  ('employee@example.com', '$2b$10$Ct5NL70WYV0htykEttshj.0J7.FBYCjK0plp41Jlob6ABElDn0rGa', 'EMPLOYEE')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees(user_id, name, phone, address, department, position, salary, leave_balance)
SELECT u.id, 'System Admin', '9800000000', 'Head Office', 'Management', 'Admin', 90000, 20
FROM users u
WHERE u.email='admin@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM employees e WHERE e.user_id = u.id
  );

INSERT INTO employees(user_id, name, phone, address, department, position, salary, leave_balance)
SELECT u.id, 'Sample Employee', '9811111111', 'Kathmandu', 'Engineering', 'Developer', 50000, 20
FROM users u
WHERE u.email='employee@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM employees e WHERE e.user_id = u.id
  );
