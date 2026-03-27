const Joi = require("joi");

exports.createEmployeeSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("ADMIN", "EMPLOYEE").default("EMPLOYEE"),
  name: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().trim().max(15).allow("", null).default(""),
  address: Joi.string().trim().max(255).allow("", null).default(""),
  department: Joi.string().trim().max(50).allow("", null).default(""),
  position: Joi.string().trim().max(50).allow("", null).default(""),
  salary: Joi.number().min(0).default(0),
  leave_balance: Joi.number().integer().min(0).max(365).default(20),
});

exports.listEmployeesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow("", null),
  department: Joi.string().trim().max(50).allow("", null),
  role: Joi.string().valid("ADMIN", "EMPLOYEE").allow("", null),
});
