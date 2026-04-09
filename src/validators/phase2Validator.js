const Joi = require("joi");

// DEPARTMENT VALIDATORS
exports.createDepartmentSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().allow("").optional(),
  manager_id: Joi.number().integer().optional(),
  budget: Joi.number().positive().optional(),
});

exports.updateDepartmentSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  description: Joi.string().allow("").optional(),
  manager_id: Joi.number().integer().optional(),
  budget: Joi.number().positive().optional(),
}).min(1);

exports.listDepartmentsQuerySchema = Joi.object({
  page: Joi.number().integer().default(1).min(1),
  limit: Joi.number().integer().default(10).min(1).max(100),
});

// HOLIDAY VALIDATORS
exports.createHolidaySchema = Joi.object({
  name: Joi.string().max(100).required(),
  date_from: Joi.date().iso().required(),
  date_to: Joi.date().iso().min(Joi.ref("date_from")).required(),
  type: Joi.string().valid("NATIONAL", "OPTIONAL", "RESTRICTED").default("NATIONAL"),
});

exports.updateHolidaySchema = Joi.object({
  name: Joi.string().max(100).optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  type: Joi.string().valid("NATIONAL", "OPTIONAL", "RESTRICTED").optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

exports.listHolidaysQuerySchema = Joi.object({
  page: Joi.number().integer().default(1).min(1),
  limit: Joi.number().integer().default(10).min(1).max(100),
  year: Joi.number().integer().min(2000).max(2100).optional(),
  type: Joi.string().valid("NATIONAL", "OPTIONAL", "RESTRICTED").optional(),
  is_active: Joi.boolean().optional(),
});

// SALARY COMPONENT VALIDATORS
exports.createSalaryComponentSchema = Joi.object({
  name: Joi.string().max(100).required(),
  component_type: Joi.string().valid("EARNING", "DEDUCTION", "TAX").required(),
  formula: Joi.string().optional(),
  is_fixed: Joi.boolean().default(false),
});

exports.updateSalaryComponentSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  formula: Joi.string().optional(),
  is_fixed: Joi.boolean().optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

exports.listSalaryComponentsQuerySchema = Joi.object({
  page: Joi.number().integer().default(1).min(1),
  limit: Joi.number().integer().default(10).min(1).max(100),
});

// SALARY TEMPLATE VALIDATORS
exports.createSalaryTemplateSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().optional(),
  components: Joi.array()
    .items(Joi.number().integer())
    .optional(),
});

exports.updateSalaryTemplateSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  description: Joi.string().optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

exports.addSalaryComponentSchema = Joi.object({
  component_id: Joi.number().integer().required(),
  order_num: Joi.number().integer().required(),
});

exports.assignSalaryTemplateSchema = Joi.object({
  template_id: Joi.number().integer().required(),
  effective_from: Joi.date().iso().required(),
});

exports.listSalaryTemplatesQuerySchema = Joi.object({
  page: Joi.number().integer().default(1).min(1),
  limit: Joi.number().integer().default(10).min(1).max(100),
});

// BULK IMPORT/EXPORT VALIDATORS
exports.bulkImportEmployeesSchema = Joi.object({
  employees: Joi.array()
    .items(Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
      department_id: Joi.number().integer().required(),
      position: Joi.string().required(),
      salary: Joi.number().positive().required(),
    }))
    .required()
    .min(1),
});

// MANAGER ROLE ASSIGNMENT VALIDATORS
exports.assignManagerSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  manager_id: Joi.number().integer().required().messages({
    "number.base": "Manager ID must be a number",
  }),
});
