const pool = require("../config/db");
const bcrypt = require("bcrypt");
const authService = require("../services/authService");
const loginAttemptService = require("../services/loginAttemptService");

exports.register = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users(email, password, role)
       VALUES($1,$2,$3) RETURNING *`,
      [email, hashed, role || "EMPLOYEE"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      err.status = 409;
      err.message = "User already exists";
    }

    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login(email, password);
    loginAttemptService.clearFailures(email, req.ip);

    res.status(200).json({
      token: data.accessToken,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });
  } catch (err) {
    if (err.message === "User not found" || err.message === "Invalid password") {
      loginAttemptService.recordFailure(req.body.email, req.ip);
      err.status = 401;
      err.message = "Invalid credentials";
    }

    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);
    res.status(200).json(tokens);
  } catch (err) {
    if (!err.status) err.status = 401;
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.status(200).json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};