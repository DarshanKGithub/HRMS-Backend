const Joi = require("joi");

exports.createOfferLetterSchema = Joi.object({
  employee_id: Joi.number().integer().required().messages({
    "number.base": "Employee ID must be a number",
    "any.required": "Employee ID is required",
  }),
  position: Joi.string().max(100).required().messages({
    "string.max": "Position must be less than 100 characters",
    "any.required": "Position is required",
  }),
  department: Joi.string().max(100).allow("").optional(),
  salary: Joi.number().positive().required().messages({
    "number.positive": "Salary must be a positive number",
    "any.required": "Salary is required",
  }),
  offer_date: Joi.date().iso().required().messages({
    "date.iso": "Offer date must be in ISO format (YYYY-MM-DD)",
    "any.required": "Offer date is required",
  }),
  joining_date: Joi.date().iso().min(Joi.ref("offer_date")).required().messages({
    "date.iso": "Joining date must be in ISO format (YYYY-MM-DD)",
    "date.min": "Joining date must be after offer date",
    "any.required": "Joining date is required",
  }),
  template_id: Joi.number().integer().optional(),
  validity_days: Joi.number().integer().default(30).min(1).max(365).optional(),
});

exports.updateOfferLetterSchema = Joi.object({
  position: Joi.string().max(100).optional(),
  department: Joi.string().max(100).optional(),
  salary: Joi.number().positive().optional(),
  letter_content: Joi.string().optional(),
}).min(1);

exports.updateOfferStatusSchema = Joi.object({
  status: Joi.string()
    .valid("DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED")
    .required()
    .messages({
      "any.only": "Invalid status",
      "any.required": "Status is required",
    }),
  notes: Joi.string().optional(),
});

exports.rejectOfferSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
});

exports.createTemplateSchema = Joi.object({
  name: Joi.string().max(100).required().messages({
    "string.max": "Template name must be less than 100 characters",
    "any.required": "Template name is required",
  }),
  content: Joi.string().required().messages({
    "any.required": "Template content is required",
  }),
});

exports.listOffersQuerySchema = Joi.object({
  page: Joi.number().integer().default(1).min(1),
  limit: Joi.number().integer().default(10).min(1).max(100),
  status: Joi.string()
    .valid("DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED")
    .optional(),
  employee_id: Joi.number().integer().optional(),
});
