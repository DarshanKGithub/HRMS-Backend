const pool = require("../config/db");

exports.findByEmail = (email) =>
  pool.query("SELECT * FROM users WHERE email=$1", [email]);

exports.createUser = (email, password, role) =>
  pool.query(
    "INSERT INTO users(email,password,role) VALUES($1,$2,$3) RETURNING *",
    [email, password, role]
  );