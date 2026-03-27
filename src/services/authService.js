const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const tokenService = require("./tokenService");

exports.login = async (email, password) => {
  const user = await userModel.findByEmail(email);
  if (!user.rows.length) throw new Error("User not found");

  const valid = await bcrypt.compare(password, user.rows[0].password);
  if (!valid) throw new Error("Invalid password");

  const payload = { id: user.rows[0].id, role: user.rows[0].role };
  const { accessToken, refreshToken } = tokenService.issueTokens(payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.rows[0].id,
      email: user.rows[0].email,
      role: user.rows[0].role,
    },
  };
};

exports.refreshAccessToken = async (refreshToken) => {
  const decoded = tokenService.verifyRefreshToken(refreshToken);
  const tokens = tokenService.issueTokens({ id: decoded.id, role: decoded.role });
  tokenService.revokeRefreshToken(refreshToken);
  return tokens;
};

exports.logout = async (refreshToken) => {
  tokenService.revokeRefreshToken(refreshToken);
};