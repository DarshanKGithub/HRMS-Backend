const test = require("node:test");
const assert = require("node:assert/strict");

process.env.CORS_ORIGINS = "http://localhost:3000";

const app = require("../src/app");

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
});

test("returns 422 for invalid login payload", async () => {
  const response = await fetch(`${baseUrl}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "invalid-email" }),
  });

  assert.equal(response.status, 422);
  const body = await response.json();
  assert.equal(body.error.status, 422);
});

test("returns 401 for protected endpoint without token", async () => {
  const response = await fetch(`${baseUrl}/api/clock-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  assert.equal(response.status, 401);
});

test("returns 404 for unknown route", async () => {
  const response = await fetch(`${baseUrl}/api/does-not-exist`, {
    method: "GET",
  });

  assert.equal(response.status, 404);
});

test("returns CORS headers for allowed origin", async () => {
  const response = await fetch(`${baseUrl}/api/does-not-exist`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:3000",
      "Access-Control-Request-Method": "GET",
    },
  });

  assert.equal(response.status, 204);
  const origin = response.headers.get("access-control-allow-origin");
  assert.equal(origin, "http://localhost:3000");
});
