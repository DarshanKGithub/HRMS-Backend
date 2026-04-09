const db = require("../config/db");
const { HolidayModel } = require("../models/phase2Models");

// DEPARTMENT SERVICE
class DepartmentService {
  static async validateManagerExists(managerId) {
    const result = await db.query("SELECT id FROM users WHERE id = $1 AND role = 'MANAGER'", [managerId]);
    return result.rows.length > 0;
  }

  static async getManagerCount(departmentId) {
    const result = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE manager_id = (SELECT manager_id FROM departments WHERE id = $1)",
      [departmentId]
    );
    return result.rows[0].count;
  }
}

// HOLIDAY SERVICE  
class HolidayService {
  static async isHolidayDate(date) {
    return await HolidayModel.isHoliday(date);
  }

  static async getHolidaysInRange(startDate, endDate) {
    return await HolidayModel.getHolidaysByDateRange(startDate, endDate);
  }

  static async excludeHolidaysFromLeave(leaveStartDate, leaveEndDate, leaveDays) {
    try {
      const holidays = await this.getHolidaysInRange(leaveStartDate, leaveEndDate);
      
      // Count holidays within leave period
      let holidaysCount = 0;
      const currentDate = new Date(leaveStartDate);
      
      while (currentDate <= new Date(leaveEndDate)) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isHoliday = holidays.some(h => {
          const hStart = new Date(h.date_from).toISOString().split('T')[0];
          const hEnd = new Date(h.date_to).toISOString().split('T')[0];
          return dateStr >= hStart && dateStr <= hEnd;
        });
        
        if (isHoliday) holidaysCount++;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return Math.max(0, leaveDays - holidaysCount);
    } catch (error) {
      return leaveDays; // If error, return original count
    }
  }

  static async getUpcomingHolidays(days = 30) {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const query = `
      SELECT * FROM holidays
      WHERE is_active = TRUE
      AND date_from >= $1
      AND date_from <= $2
      ORDER BY date_from ASC;
    `;
    const result = await db.query(query, [today, futureDateStr]);
    return result.rows;
  }
}

// SALARY COMPONENT SERVICE
class SalaryComponentService {
  static async calculateComponent(componentId, salary, otherComponents = {}) {
    const query = `SELECT * FROM salary_components WHERE id = $1`;
    const result = await db.query(query, [componentId]);
    
    if (result.rows.length === 0) throw new Error("Salary component not found");
    
    const component = result.rows[0];
    let amount = 0;

    if (component.is_fixed) {
      amount = component.formula ? parseFloat(component.formula) : 0;
    } else if (component.formula) {
      // Simple formula evaluation (e.g., "salary * 0.12" for PF)
      try {
        // WARNING: eval is dangerous in production. Use safer expression parser in real code.
        const formulaContext = { salary, ...otherComponents };
        amount = this.evaluateFormula(component.formula, formulaContext);
      } catch (error) {
        amount = 0;
      }
    }

    return { component_id: componentId, name: component.name, amount };
  }

  static evaluateFormula(formula, context) {
    // Safe formula evaluation - only allows basic math operations
    const allowedVars = Object.keys(context).join('|');
    const pattern = new RegExp(`^[\\d\\s\\+\\-\\*/\\.\\(\\)${allowedVars}]*$`);
    
    if (!pattern.test(formula)) {
      throw new Error("Invalid formula");
    }

    // Replace variables with values
    let evalFormula = formula;
    for (const [key, value] of Object.entries(context)) {
      evalFormula = evalFormula.replace(new RegExp(key, 'g'), value);
    }

    return Function('"use strict"; return (' + evalFormula + ')')();
  }

  static async getComponentsByType(type) {
    const query = `
      SELECT * FROM salary_components
      WHERE component_type = $1 AND is_active = TRUE
      ORDER BY name;
    `;
    const result = await db.query(query, [type]);
    return result.rows;
  }
}

// SALARY TEMPLATE SERVICE
class SalaryTemplateService {
  static async calculateNetSalary(templateId, baseSalary) {
    const query = `
      SELECT stc.component_id, sc.name, sc.component_type, 
             sc.formula, sc.is_fixed
      FROM salary_template_components stc
      JOIN salary_components sc ON stc.component_id = sc.id
      WHERE stc.template_id = $1
      ORDER BY stc.order_num;
    `;
    const result = await db.query(query, [templateId]);
    
    let totalEarnings = baseSalary;
    let totalDeductions = 0;
    let totalTaxes = 0;
    const breakdown = [];

    for (const row of result.rows) {
      const amount = SalaryComponentService.calculateComponent(
        row.component_id,
        baseSalary,
        { earnings: totalEarnings, deductions: totalDeductions }
      );

      breakdown.push(amount);

      if (row.component_type === "EARNING") {
        totalEarnings += amount.amount;
      } else if (row.component_type === "DEDUCTION") {
        totalDeductions += amount.amount;
      } else if (row.component_type === "TAX") {
        totalTaxes += amount.amount;
      }
    }

    return {
      base_salary: baseSalary,
      earnings: totalEarnings,
      deductions: totalDeductions,
      taxes: totalTaxes,
      net_salary: totalEarnings - totalDeductions - totalTaxes,
      breakdown,
    };
  }

  static async validateTemplateComponents(templateId) {
    const query = `
      SELECT COUNT(*) as total FROM salary_template_components
      WHERE template_id = $1;
    `;
    const result = await db.query(query, [templateId]);
    return result.rows[0].total > 0;
  }
}

// MANAGER SERVICE
class ManagerService {
  static async getDirectReports(managerId) {
    const query = `
      SELECT u.id, u.email, u.name, u.role, e.department_id
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      WHERE u.manager_id = $1;
    `;
    const result = await db.query(query, [managerId]);
    return result.rows;
  }

  static async getManagerHierarchy(userId) {
    const query = `
      WITH RECURSIVE manager_path AS (
        SELECT id, manager_id, name, email, 1 as level
        FROM users WHERE id = $1
        UNION ALL
        SELECT u.id, u.manager_id, u.name, u.email, mp.level + 1
        FROM users u
        JOIN manager_path mp ON u.id = mp.manager_id
        WHERE mp.level < 10
      )
      SELECT id, manager_id, name, email, level FROM manager_path;
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async getPendingApprovals(managerId, type = "LEAVE") {
    let query = ``;
    
    if (type === "LEAVE") {
      query = `
        SELECT l.id, l.employee_id, l.start_date, l.end_date, l.leave_type,
               l.status, u.name as employee_name, u.email
        FROM leaves l
        JOIN users u ON l.employee_id = u.id
        WHERE u.manager_id = $1 AND l.status = 'PENDING'
        ORDER BY l.created_at DESC;
      `;
    }

    const result = await db.query(query, [managerId]);
    return result.rows;
  }

  static async canApproveLeave(managerId, leaveId) {
    const query = `
      SELECT l.id FROM leaves l
      JOIN users u ON l.employee_id = u.id
      WHERE l.id = $1 AND u.manager_id = $2;
    `;
    const result = await db.query(query, [leaveId, managerId]);
    return result.rows.length > 0;
  }
}

// LEAVE SETTINGS SERVICE
class LeaveSettingsService {
  static async getLeaveSettings(departmentId = null) {
    let query = `SELECT * FROM leave_settings`;
    const params = [];

    if (departmentId) {
      query += ` WHERE department_id = $1`;
      params.push(departmentId);
    }

    const result = await db.query(query, params);
    return result.rows[0] || this.getDefaultSettings();
  }

  static getDefaultSettings() {
    return {
      casual_leaves_annual: 12,
      sick_leaves_annual: 10,
      earned_leaves_annual: 20,
      maternity_leaves_annual: 180,
      paternity_leaves_annual: 15,
      exclude_weekends: true,
      exclude_holidays: true,
    };
  }

  static async updateLeaveSettings(settings, departmentId = null) {
    const query = `
      INSERT INTO leave_settings (
        department_id, casual_leaves_annual, sick_leaves_annual,
        earned_leaves_annual, maternity_leaves_annual, paternity_leaves_annual,
        exclude_weekends, exclude_holidays
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (department_id) DO UPDATE SET
        casual_leaves_annual = $2,
        sick_leaves_annual = $3,
        earned_leaves_annual = $4,
        maternity_leaves_annual = $5,
        paternity_leaves_annual = $6,
        exclude_weekends = $7,
        exclude_holidays = $8
      RETURNING *;
    `;
    const result = await db.query(query, [
      departmentId,
      settings.casual_leaves_annual,
      settings.sick_leaves_annual,
      settings.earned_leaves_annual,
      settings.maternity_leaves_annual,
      settings.paternity_leaves_annual,
      settings.exclude_weekends,
      settings.exclude_holidays,
    ]);
    return result.rows[0];
  }

  static async calculateAvailableLeaves(employeeId, leaveType) {
    const settings = await this.getLeaveSettings();
    
    // Get already taken leaves
    const query = `
      SELECT COUNT(*) as taken FROM leaves
      WHERE employee_id = $1
      AND leave_type = $2
      AND status IN ('APPROVED', 'TAKEN')
      AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    `;
    const result = await db.query(query, [employeeId, leaveType]);
    const taken = result.rows[0].taken;

    const allocation = settings[`${leaveType.toLowerCase()}_leaves_annual`] || 0;
    return Math.max(0, allocation - taken);
  }
}

module.exports = {
  DepartmentService,
  HolidayService,
  SalaryComponentService,
  SalaryTemplateService,
  ManagerService,
  LeaveSettingsService,
};
