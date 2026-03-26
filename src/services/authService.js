const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

exports.login = async (email, password) => {
  const user = await userModel.findByEmail(email);
  if (!user.rows.length) throw new Error("User not found");

  const valid = await bcrypt.compare(password, user.rows[0].password);
  if (!valid) throw new Error("Invalid password");

  return jwt.sign(
    { id: user.rows[0].id, role: user.rows[0].role },
    process.env.JWT_SECRET
  );
};