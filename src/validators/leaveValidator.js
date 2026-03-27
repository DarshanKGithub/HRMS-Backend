const Joi = require("joi");

exports.applyLeaveSchema = Joi.object({
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().required(),
  reason: Joi.string().allow("", null).optional(),
  type: Joi.string().valid("PAID", "UNPAID", "SICK", "CASUAL").required(),
});

exports.updateLeaveStatusSchema = Joi.object({
  status: Joi.string().valid("APPROVED", "REJECTED").required(),
});