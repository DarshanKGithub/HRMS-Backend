const Joi = require("joi");

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

exports.registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("ADMIN", "EMPLOYEE").optional(),
});

exports.refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

exports.logoutSchema = Joi.object({
  refreshToken: Joi.string().required(),
});