const { DepartmentModel, HolidayModel, SalaryComponentModel, SalaryTemplateModel } = require("../models/phase2Models");
const db = require("../config/db");

// DEPARTMENT CONTROLLERS
exports.createDepartment = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can create departments");
      err.status = 403;
      return next(err);
    }

    const { name, description, manager_id, budget } = req.body;
    const department = await DepartmentModel.create(name, description, manager_id, budget);

    res.status(201).json({
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

exports.listDepartments = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await DepartmentModel.getAll(page, limit);

    res.status(200).json({
      data: result.departments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const department = await DepartmentModel.getById(id);

    if (!department) {
      const err = new Error("Department not found");
      err.status = 404;
      return next(err);
    }

    const employees = await DepartmentModel.getDepartmentEmployees(id);

    res.status(200).json({
      data: department,
      employees,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can update departments");
      err.status = 403;
      return next(err);
    }

    const { id } = req.params;
    const department = await DepartmentModel.update(id, req.body);

    if (!department) {
      const err = new Error("Department not found");
      err.status = 404;
      return next(err);
    }

    res.status(200).json({
      message: "Department updated successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can delete departments");
      err.status = 403;
      return next(err);
    }

    const { id } = req.params;

    // Check if department has employees
    const employees = await DepartmentModel.getDepartmentEmployees(id);
    if (employees.length > 0) {
      const err = new Error("Cannot delete department with active employees. Reassign employees first.");
      err.status = 400;
      return next(err);
    }

    const deleted = await DepartmentModel.delete(id);

    if (!deleted) {
      const err = new Error("Department not found");
      err.status = 404;
      return next(err);
    }

    res.status(200).json({
      message: "Department deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// HOLIDAY CONTROLLERS
exports.createHoliday = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can create holidays");
      err.status = 403;
      return next(err);
    }

    const { name, date_from, date_to, type } = req.body;
    const holiday = await HolidayModel.create(name, date_from, date_to, type);

    res.status(201).json({
      message: "Holiday created successfully",
      data: holiday,
    });
  } catch (error) {
    next(error);
  }
};

exports.listHolidays = async (req, res, next) => {
  try {
    const { page, limit, year, type, is_active } = req.query;
    const result = await HolidayModel.getAll(page, limit, { year: year ? parseInt(year) : null, type, is_active: is_active === 'true' });

    res.status(200).json({
      data: result.holidays,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateHoliday = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can update holidays");
      err.status = 403;
      return next(err);
    }

    const { id } = req.params;
    const holiday = await HolidayModel.update(id, req.body);

    if (!holiday) {
      const err = new Error("Holiday not found");
      err.status = 404;
      return next(err);
    }

    res.status(200).json({
      message: "Holiday updated successfully",
      data: holiday,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteHoliday = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can delete holidays");
      err.status = 403;
      return next(err);
    }

    const { id } = req.params;
    const deleted = await HolidayModel.delete(id);

    if (!deleted) {
      const err = new Error("Holiday not found");
      err.status = 404;
      return next(err);
    }

    res.status(200).json({
      message: "Holiday deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// SALARY COMPONENT CONTROLLERS
exports.createSalaryComponent = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can create salary components");
      err.status = 403;
      return next(err);
    }

    const { name, component_type, formula, is_fixed } = req.body;
    const component = await SalaryComponentModel.create(name, component_type, formula, is_fixed);

    res.status(201).json({
      message: "Salary component created successfully",
      data: component,
    });
  } catch (error) {
    next(error);
  }
};

exports.listSalaryComponents = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await SalaryComponentModel.getAll(page, limit);

    res.status(200).json({
      data: result.components,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSalaryComponentsByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const components = await SalaryComponentModel.getByType(type);

    res.status(200).json({
      data: components,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSalaryComponent = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can update salary components");
      err.status = 403;
      return next(err);
    }

    const { id } = req.params;
    const component = await SalaryComponentModel.update(id, req.body);

    if (!component) {
      const err = new Error("Salary component not found");
      err.status = 404;
      return next(err);
    }

    res.status(200).json({
      message: "Salary component updated successfully",
      data: component,
    });
  } catch (error) {
    next(error);
  }
};

// SALARY TEMPLATE CONTROLLERS
exports.createSalaryTemplate = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can create salary templates");
      err.status = 403;
      return next(err);
    }

    const { name, description, components } = req.body;
    const template = await SalaryTemplateModel.create(name, description);

    // Add components if provided
    if (components && components.length > 0) {
      for (let i = 0; i < components.length; i++) {
        await SalaryTemplateModel.addComponent(template.id, components[i], i + 1);
      }
    }

    res.status(201).json({
      message: "Salary template created successfully",
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

exports.listSalaryTemplates = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await SalaryTemplateModel.getAll(page, limit);

    res.status(200).json({
      data: result.templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSalaryTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const templateWithComponents = await SalaryTemplateModel.getById(id);

    if (!templateWithComponents || templateWithComponents.length === 0) {
      const err = new Error("Salary template not found");
      err.status = 404;
      return next(err);
    }

    const template = {
      id: templateWithComponents[0].id,
      name: templateWithComponents[0].name,
      description: templateWithComponents[0].description,
      is_active: templateWithComponents[0].is_active,
      component_count: templateWithComponents[0].component_count,
      components: templateWithComponents.filter(row => row.component_id).map(row => ({
        component_id: row.component_id,
        component_name: row.component_name,
        component_type: row.component_type,
        formula: row.formula,
        order_num: row.order_num,
      })),
    };

    res.status(200).json({
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

exports.addComponentToTemplate = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can modify templates");
      err.status = 403;
      return next(err);
    }

    const { id } = req.params;
    const { component_id, order_num } = req.body;

    const result = await SalaryTemplateModel.addComponent(id, component_id, order_num);

    if (!result) {
      const err = new Error("Could not add component to template");
      err.status = 400;
      return next(err);
    }

    res.status(200).json({
      message: "Component added to template successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeComponentFromTemplate = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can modify templates");
      err.status = 403;
      return next(err);
    }

    const { id, componentId } = req.params;
    const deleted = await SalaryTemplateModel.removeComponent(id, componentId);

    if (!deleted) {
      const err = new Error("Component not found in template");
      err.status = 404;
      return next(err);
    }

    res.status(200).json({
      message: "Component removed from template successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.assignSalaryTemplate = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can assign salary templates");
      err.status = 403;
      return next(err);
    }

    const { employeeId } = req.params;
    const { template_id, effective_from } = req.body;

    // Verify employee exists
    const empCheck = await db.query("SELECT id FROM employees WHERE id = $1", [employeeId]);
    if (empCheck.rows.length === 0) {
      const err = new Error("Employee not found");
      err.status = 404;
      return next(err);
    }

    const assignment = await SalaryTemplateModel.assignToEmployee(employeeId, template_id, effective_from);

    res.status(200).json({
      message: "Salary template assigned successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeSalaryTemplate = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const template = await SalaryTemplateModel.getEmployeeTemplate(employeeId);

    if (!template) {
      const err = new Error("No active salary template found for employee");
      err.status = 404;
      return next(err);
    }

    res.status(200).json({
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

// MANAGER ASSIGNMENT CONTROLLERS
exports.assignManager = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can assign managers");
      err.status = 403;
      return next(err);
    }

    const { user_id, manager_id } = req.body;

    // Verify both users exist
    const userCheck = await db.query("SELECT role FROM users WHERE id = $1", [user_id]);
    const managerCheck = await db.query("SELECT role FROM users WHERE id = $1", [manager_id]);

    if (userCheck.rows.length === 0 || managerCheck.rows.length === 0) {
      const err = new Error("User or manager not found");
      err.status = 404;
      return next(err);
    }

    // Update manager assignment
    const query = `UPDATE users SET manager_id = $1 WHERE id = $2 RETURNING *;`;
    const result = await db.query(query, [manager_id, user_id]);

    res.status(200).json({
      message: "Manager assigned successfully",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
