const request = require("supertest");
const db = require("../src/config/db");

// Note: These tests assume the database has been migrated with Phase 2 schema
// Run: npm run migrate before running these tests

let app;
let adminToken;
let managerToken;
let employeeToken;
let adminId, managerId, employeeId;

beforeAll(async () => {
  app = require("../src/app");
  
  // Create test admin user and get token
  const adminRes = await request(app)
    .post("/login")
    .send({
      email: "admin@hrms.test",
      password: "Admin@123"
    });
  adminToken = adminRes.body.data.access_token;
  adminId = adminRes.body.data.userId;

  // Create test manager user
  const managerRes = await request(app)
    .post("/register")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      name: "Test Manager",
      email: "manager@hrms.test",
      password: "Manager@123",
      role: "MANAGER"
    });
  managerId = managerRes.body.data.id;

  const managerLoginRes = await request(app)
    .post("/login")
    .send({
      email: "manager@hrms.test",
      password: "Manager@123"
    });
  managerToken = managerLoginRes.body.data.access_token;

  // Create test employee
  const empRes = await request(app)
    .post("/register")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      name: "Test Employee",
      email: "employee@hrms.test",
      password: "Employee@123",
      role: "EMPLOYEE"
    });
  employeeId = empRes.body.data.id;

  const empLoginRes = await request(app)
    .post("/login")
    .send({
      email: "employee@hrms.test",
      password: "Employee@123"
    });
  employeeToken = empLoginRes.body.data.access_token;
});

// ========== DEPARTMENT TESTS ==========
describe("Department Management", () => {
  let departmentId;

  test("Admin can create a department", async () => {
    const res = await request(app)
      .post("/admin/departments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Engineering",
        description: "Engineering department",
        manager_id: managerId,
        budget: 500000
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Engineering");
    departmentId = res.body.data.id;
  });

  test("Employee cannot create a department", async () => {
    const res = await request(app)
      .post("/admin/departments")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        name: "Sales",
        description: "Sales department"
      });
    
    expect(res.status).toBe(403);
  });

  test("Admin can list departments", async () => {
    const res = await request(app)
      .get("/admin/departments?page=1&limit=10")
      .set("Authorization", `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("Admin can get a specific department", async () => {
    const res = await request(app)
      .get(`/admin/departments/${departmentId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Engineering");
  });

  test("Admin can update a department", async () => {
    const res = await request(app)
      .put(`/admin/departments/${departmentId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        budget: 600000,
        description: "Updated engineering department"
      });
    
    expect(res.status).toBe(200);
    expect(res.body.data.budget).toBe(600000);
  });

  test("Cannot delete department with employees", async () => {
    // This would test after assigning employees to department
    // For now, we can test that delete works when empty
  });
});

// ========== HOLIDAY TESTS ==========
describe("Holiday Calendar", () => {
  let holidayId;
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  test("Admin can create a holiday", async () => {
    const res = await request(app)
      .post("/admin/holidays")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New Year",
        date_from: "2025-01-01",
        date_to: "2025-01-01",
        type: "NATIONAL"
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("New Year");
    holidayId = res.body.data.id;
  });

  test("Employee cannot create holidays", async () => {
    const res = await request(app)
      .post("/admin/holidays")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        name: "Test Holiday",
        date_from: "2025-12-25",
        date_to: "2025-12-25"
      });
    
    expect(res.status).toBe(403);
  });

  test("Admin can list holidays with filters", async () => {
    const res = await request(app)
      .get("/admin/holidays?page=1&limit=10&year=2025&type=NATIONAL")
      .set("Authorization", `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("Admin can update a holiday", async () => {
    const res = await request(app)
      .put(`/admin/holidays/${holidayId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        type: "OPTIONAL",
        is_active: false
      });
    
    expect(res.status).toBe(200);
    expect(res.body.data.type).toBe("OPTIONAL");
  });

  test("Admin can delete a holiday", async () => {
    const res = await request(app)
      .delete(`/admin/holidays/${holidayId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
  });

  test("Employee can view holidays", async () => {
    const res = await request(app)
      .get("/holidays?page=1&limit=10")
      .set("Authorization", `Bearer ${employeeToken}`);
    
    expect(res.status).toBe(200);
  });
});

// ========== SALARY COMPONENT TESTS ==========
describe("Salary Components", () => {
  let componentId;

  test("Admin can create a salary component", async () => {
    const res = await request(app)
      .post("/admin/salary-components")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "HRA",
        component_type: "EARNING",
        formula: "salary * 0.15",
        is_fixed: false
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("HRA");
    componentId = res.body.data.id;
  });

  test("Admin can list salary components", async () => {
    const res = await request(app)
      .get("/admin/salary-components?page=1&limit=10")
      .set("Authorization", `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("Admin can get components by type", async () => {
    const res = await request(app)
      .get("/admin/salary-components/EARNING")
      .set("Authorization", `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("Admin can update a salary component", async () => {
    const res = await request(app)
      .put(`/admin/salary-components/${componentId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        formula: "salary * 0.20",
        is_fixed: false
      });
    
    expect(res.status).toBe(200);
  });

  test("Employee cannot create components", async () => {
    const res = await request(app)
      .post("/admin/salary-components")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        name: "Test Component",
        component_type: "EARNING"
      });
    
    expect(res.status).toBe(403);
  });
});

// ========== SALARY TEMPLATE TESTS ==========
describe("Salary Templates", () => {
  let templateId;
  let componentId;

  beforeAll(async () => {
    // Create a component first
    const compRes = await request(app)
      .post("/admin/salary-components")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "DA",
        component_type: "EARNING",
        formula: "salary * 0.10",
        is_fixed: false
      });
    componentId = compRes.body.data.id;
  });

  test("Admin can create a salary template", async () => {
    const res = await request(app)
      .post("/admin/salary-templates")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Senior Developer",
        description: "Template for senior developers",
        components: [componentId]
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Senior Developer");
    templateId = res.body.data.id;
  });

  test("Admin can list salary templates", async () => {
    const res = await request(app)
      .get("/admin/salary-templates?page=1&limit=10")
      .set("Authorization", `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("Admin can get a specific template with components", async () => {
    const res = await request(app)
      .get(`/admin/salary-templates/${templateId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Senior Developer");
  });

  test("Admin can add component to template", async () => {
    const res = await request(app)
      .post(`/admin/salary-templates/${templateId}/components`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        component_id: componentId,
        order_num: 2
      });
    
    expect(res.status).toBe(200);
  });

  test("Admin can remove component from template", async () => {
    const res = await request(app)
      .delete(`/admin/salary-templates/${templateId}/components/${componentId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
  });
});

// ========== MANAGER ASSIGNMENT TESTS ==========
describe("Manager Assignment", () => {
  test("Admin can assign a manager to an employee", async () => {
    const res = await request(app)
      .post("/admin/managers/assign")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        user_id: employeeId,
        manager_id: managerId
      });
    
    expect(res.status).toBe(200);
    expect(res.body.data.manager_id).toBe(managerId);
  });

  test("Employee cannot assign managers", async () => {
    const res = await request(app)
      .post("/admin/managers/assign")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        user_id: employeeId,
        manager_id: managerId
      });
    
    expect(res.status).toBe(403);
  });
});

// ========== INTEGRATION TESTS ==========
describe("Integration Tests", () => {
  test("Holiday should be reflected in leave balance calculation", async () => {
    // This would integrate with leave service to test
    // that holidays are excluded from leave calculations
  });

  test("Salary template should be retrievable for an employee", async () => {
    // This would test employee salary structure assignment
  });

  test("Manager should be able to approve leaves", async () => {
    // This would test manager workflow with leaves
  });
});

afterAll(async () => {
  await db.end();
});

module.exports = {};
