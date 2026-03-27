const test = require("node:test");
const assert = require("node:assert/strict");

const payrollService = require("../src/services/payrollService");
const pool = require("../src/config/db");

test("payrollService.generate blocks duplicate payroll generation", async () => {
  const originalQuery = pool.query;

  pool.query = async (queryText) => {
    if (queryText.includes("SELECT salary,user_id FROM employees")) {
      return { rows: [{ salary: 30000, user_id: 5 }] };
    }

    if (queryText.includes("SELECT COUNT(*)") && queryText.includes("FROM leaves")) {
      return { rows: [{ count: "1" }] };
    }

    if (queryText.includes("SELECT * FROM payroll")) {
      return { rows: [{ id: 99 }] };
    }

    return { rows: [] };
  };

  try {
    await assert.rejects(() => payrollService.generate(1, 3), /Payroll already generated/);
  } finally {
    pool.query = originalQuery;
  }
});

test("payrollService.generate rejects invalid month", async () => {
  await assert.rejects(() => payrollService.generate(1, 20), /Invalid month/);
});
