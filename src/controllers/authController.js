const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { email, password, role } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users(email, password, role)
     VALUES($1,$2,$3) RETURNING *`,
    [email, hashed, role || "EMPLOYEE"]
  );

  res.json(result.rows[0]);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  if (!user.rows.length)
    return res.status(400).json({ msg: "User not found" });

  const valid = await bcrypt.compare(password, user.rows[0].password);

  if (!valid)
    return res.status(400).json({ msg: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.rows[0].id, role: user.rows[0].role },
    process.env.JWT_SECRET
  );

  res.json({ token });
};