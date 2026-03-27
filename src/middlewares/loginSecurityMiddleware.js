const loginAttemptService = require("../services/loginAttemptService");

module.exports = (req, res, next) => {
  try {
    loginAttemptService.ensureNotLocked(req.body.email, req.ip);
    next();
  } catch (err) {
    next(err);
  }
};