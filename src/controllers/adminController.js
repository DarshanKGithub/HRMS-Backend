const authService = require("../services/authService");

exports.login = async (req, res, next) => {
  try {
    const token = await authService.login(
      req.body.email,
      req.body.password
    );
    res.status(200).json({ token });
  } catch (err) {
    if (err.message === "User not found" || err.message === "Invalid password") {
      err.status = 401;
      err.message = "Invalid credentials";
    }
    next(err);
  }
};