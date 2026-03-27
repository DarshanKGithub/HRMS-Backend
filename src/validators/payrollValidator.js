const Joi = require("joi");

exports.generatePayrollSchema = Joi.object({
  employee_id: Joi.number().integer().positive().required(),
  month: Joi.number().integer().min(1).max(12).required(),
});