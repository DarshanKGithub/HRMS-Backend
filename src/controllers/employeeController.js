const pool = require("../config/db");
const employeeService = require("../services/employeeService");

exports.getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.email
       FROM employees e
       JOIN users u ON e.user_id=u.id
       WHERE u.id=$1`,
      [req.user.id]
    );

    if (!result.rows[0]) {
      const err = new Error("Employee profile not found");
      err.status = 404;
      throw err;
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { phone, address } = req.body;

    const result = await pool.query(
      `UPDATE employees
       SET phone=$1, address=$2
       WHERE user_id=$3 RETURNING *`,
      [phone, address, req.user.id]
    );

    if (!result.rows[0]) {
      const err = new Error("Employee profile not found");
      err.status = 404;
      throw err;
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const result = await employeeService.createEmployee({
      actorUserId: req.user.id,
      payload: req.body,
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.message === "User already exists") {
      err.status = 409;
    }

    next(err);
  }
};

exports.listEmployees = async (req, res, next) => {
  try {
    const data = await employeeService.listEmployees(req.query);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};