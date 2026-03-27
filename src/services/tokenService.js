const jwt = require("jsonwebtoken");

const accessExpiresIn = process.env.JWT_EXPIRES_IN || "15m";
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const activeRefreshTokens = new Set();

const issueTokens = (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: accessExpiresIn,
  });

  const refreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: refreshExpiresIn,
  });

  activeRefreshTokens.add(refreshToken);

  return { accessToken, refreshToken };
};

const verifyRefreshToken = (token) => {
  if (!activeRefreshTokens.has(token)) {
    const err = new Error("Refresh token is invalid or revoked");
    err.status = 401;
    throw err;
  }

  return jwt.verify(token, refreshSecret);
};

const revokeRefreshToken = (token) => {
  activeRefreshTokens.delete(token);
};

module.exports = {
  issueTokens,
  verifyRefreshToken,
  revokeRefreshToken,
};