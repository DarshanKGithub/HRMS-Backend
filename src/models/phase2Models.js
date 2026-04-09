const db = require("../config/db");

class DepartmentModel {
  static async create(name, description, manager_id, budget) {
    const query = `
      INSERT INTO departments (name, description, manager_id, budget)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await db.query(query, [name, description, manager_id, budget]);
    return result.rows[0];
  }

  static async getAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT d.*, u.email as manager_email, u.name as manager_name,
             COUNT(*) OVER() AS total
      FROM departments d
      LEFT JOIN users u ON d.manager_id = u.id
      ORDER BY d.created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const result = await db.query(query, [limit, offset]);
    return { departments: result.rows, total: result.rows[0]?.total || 0 };
  }

  static async getById(id) {
    const query = `
      SELECT d.*, u.email as manager_email, u.name as manager_name,
             COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN users u ON d.manager_id = u.id
      LEFT JOIN employees e ON d.id = e.department_id
      WHERE d.id = $1
      GROUP BY d.id, u.email, u.name;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, updates) {
    const fields = [], values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'description', 'manager_id', 'budget'].includes(key)) {
        fields.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return null;
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE departments SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *;`;
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = `DELETE FROM departments WHERE id = $1 RETURNING id;`;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async getDepartmentEmployees(departmentId) {
    const query = `
      SELECT e.*, u.email, u.role
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.department_id = $1;
    `;
    const result = await db.query(query, [departmentId]);
    return result.rows;
  }
}

class HolidayModel {
  static async create(name, date_from, date_to, type = 'NATIONAL') {
    const query = `
      INSERT INTO holidays (name, date_from, date_to, type, is_active)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING *;
    `;
    const result = await db.query(query, [name, date_from, date_to, type]);
    return result.rows[0];
  }

  static async getAll(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT *, COUNT(*) OVER() AS total
      FROM holidays
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.year) {
      query += ` AND EXTRACT(YEAR FROM date_from) = $${paramCount++}`;
      params.push(filters.year);
    }

    if (filters.type) {
      query += ` AND type = $${paramCount++}`;
      params.push(filters.type);
    }

    if (filters.is_active !== undefined) {
      query += ` AND is_active = $${paramCount++}`;
      params.push(filters.is_active);
    }

    query += ` ORDER BY date_from ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return { holidays: result.rows, total: result.rows[0]?.total || 0 };
  }

  static async isHoliday(date) {
    const query = `
      SELECT * FROM holidays
      WHERE is_active = TRUE
      AND date_from <= $1
      AND date_to >= $1;
    `;
    const result = await db.query(query, [date]);
    return result.rows.length > 0;
  }

  static async getHolidaysByDateRange(startDate, endDate) {
    const query = `
      SELECT * FROM holidays
      WHERE is_active = TRUE
      AND date_from <= $2
      AND date_to >= $1;
    `;
    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  }

  static async update(id, updates) {
    const fields = [], values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'date_from', 'date_to', 'type', 'is_active'].includes(key)) {
        fields.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return null;
    values.push(id);

    const query = `UPDATE holidays SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *;`;
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = `DELETE FROM holidays WHERE id = $1 RETURNING id;`;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

class SalaryComponentModel {
  static async create(name, component_type, formula, is_fixed) {
    const query = `
      INSERT INTO salary_components (name, component_type, formula, is_fixed, is_active)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING *;
    `;
    const result = await db.query(query, [name, component_type, formula, is_fixed]);
    return result.rows[0];
  }

  static async getAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT *, COUNT(*) OVER() AS total
      FROM salary_components
      WHERE is_active = TRUE
      ORDER BY component_type, name
      LIMIT $1 OFFSET $2;
    `;
    const result = await db.query(query, [limit, offset]);
    return { components: result.rows, total: result.rows[0]?.total || 0 };
  }

  static async getByType(type) {
    const query = `
      SELECT * FROM salary_components
      WHERE component_type = $1 AND is_active = TRUE
      ORDER BY name;
    `;
    const result = await db.query(query, [type]);
    return result.rows;
  }

  static async update(id, updates) {
    const fields = [], values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'formula', 'is_fixed', 'is_active'].includes(key)) {
        fields.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return null;
    values.push(id);

    const query = `UPDATE salary_components SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *;`;
    const result = await db.query(query, values);
    return result.rows[0];
  }
}

class SalaryTemplateModel {
  static async create(name, description) {
    const query = `
      INSERT INTO salary_templates (name, description, is_active)
      VALUES ($1, $2, TRUE)
      RETURNING *;
    `;
    const result = await db.query(query, [name, description]);
    return result.rows[0];
  }

  static async getAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT st.*, COUNT(stc.id) as component_count,
             COUNT(*) OVER() AS total
      FROM salary_templates st
      LEFT JOIN salary_template_components stc ON st.id = stc.template_id
      WHERE st.is_active = TRUE
      GROUP BY st.id
      ORDER BY st.name
      LIMIT $1 OFFSET $2;
    `;
    const result = await db.query(query, [limit, offset]);
    return { templates: result.rows, total: result.rows[0]?.total || 0 };
  }

  static async getById(id) {
    const query = `
      SELECT st.*, stc.component_id, stc.order_num, sc.name as component_name,
             sc.component_type, sc.formula
      FROM salary_templates st
      LEFT JOIN salary_template_components stc ON st.id = stc.template_id
      LEFT JOIN salary_components sc ON stc.component_id = sc.id
      WHERE st.id = $1
      ORDER BY stc.order_num;
    `;
    const result = await db.query(query, [id]);
    return result.rows;
  }

  static async addComponent(templateId, componentId, orderNum) {
    const query = `
      INSERT INTO salary_template_components (template_id, component_id, order_num)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
      RETURNING *;
    `;
    const result = await db.query(query, [templateId, componentId, orderNum]);
    return result.rows[0];
  }

  static async removeComponent(templateId, componentId) {
    const query = `
      DELETE FROM salary_template_components
      WHERE template_id = $1 AND component_id = $2
      RETURNING id;
    `;
    const result = await db.query(query, [templateId, componentId]);
    return result.rows[0];
  }

  static async assignToEmployee(employeeId, templateId, effectiveFrom) {
    const query = `
      INSERT INTO employee_salary_structures (employee_id, template_id, effective_from)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await db.query(query, [employeeId, templateId, effectiveFrom]);
    return result.rows[0];
  }

  static async getEmployeeTemplate(employeeId) {
    const query = `
      SELECT ess.*, st.name as template_name
      FROM employee_salary_structures ess
      JOIN salary_templates st ON ess.template_id = st.id
      WHERE ess.employee_id = $1
      AND (ess.effective_to IS NULL OR ess.effective_to >= CURRENT_DATE)
      ORDER BY ess.effective_from DESC
      LIMIT 1;
    `;
    const result = await db.query(query, [employeeId]);
    return result.rows[0];
  }
}

module.exports = { DepartmentModel, HolidayModel, SalaryComponentModel, SalaryTemplateModel };
