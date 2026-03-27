const test = require("node:test");
const assert = require("node:assert/strict");

const authService = require("../src/services/authService");
const userModel = require("../src/models/userModel");
const bcrypt = require("bcrypt");
const tokenService = require("../src/services/tokenService");

test("authService.login returns access and refresh tokens", async () => {
  const originalFindByEmail = userModel.findByEmail;
  const originalCompare = bcrypt.compare;
  const originalIssueTokens = tokenService.issueTokens;

  userModel.findByEmail = async () => ({
    rows: [{ id: 7, email: "emp@example.com", role: "EMPLOYEE", password: "hash" }],
  });
  bcrypt.compare = async () => true;
  tokenService.issueTokens = () => ({
    accessToken: "access-token",
    refreshToken: "refresh-token",
  });

  try {
    const data = await authService.login("emp@example.com", "password123");

    assert.equal(data.accessToken, "access-token");
    assert.equal(data.refreshToken, "refresh-token");
    assert.equal(data.user.id, 7);
    assert.equal(data.user.role, "EMPLOYEE");
  } finally {
    userModel.findByEmail = originalFindByEmail;
    bcrypt.compare = originalCompare;
    tokenService.issueTokens = originalIssueTokens;
  }
});

test("authService.login throws for invalid password", async () => {
  const originalFindByEmail = userModel.findByEmail;
  const originalCompare = bcrypt.compare;

  userModel.findByEmail = async () => ({
    rows: [{ id: 7, email: "emp@example.com", role: "EMPLOYEE", password: "hash" }],
  });
  bcrypt.compare = async () => false;

  try {
    await assert.rejects(
      () => authService.login("emp@example.com", "wrong-pass"),
      /Invalid password/
    );
  } finally {
    userModel.findByEmail = originalFindByEmail;
    bcrypt.compare = originalCompare;
  }
});
