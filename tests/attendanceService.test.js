const test = require("node:test");
const assert = require("node:assert/strict");

const attendanceService = require("../src/services/attendanceService");
const attendanceModel = require("../src/models/attendanceModel");

test("attendanceService.clockIn throws on duplicate clock in", async () => {
  const originalFindToday = attendanceModel.findToday;

  attendanceModel.findToday = async () => ({ rows: [{ id: 1 }] });

  try {
    await assert.rejects(() => attendanceService.clockIn(10), /Already clocked in/);
  } finally {
    attendanceModel.findToday = originalFindToday;
  }
});

test("attendanceService.clockOut throws when no clock in exists", async () => {
  const originalFindToday = attendanceModel.findToday;

  attendanceModel.findToday = async () => ({ rows: [] });

  try {
    await assert.rejects(() => attendanceService.clockOut(10), /No clock-in found/);
  } finally {
    attendanceModel.findToday = originalFindToday;
  }
});
