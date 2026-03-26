const service = require("../services/attendanceService");
const getEmpId = require("../utils/getEmployeeId");

exports.clockIn = async (req, res) => {
  try {
    const id = await getEmpId(req.user.id);
    res.json(await service.clockIn(id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.clockOut = async (req, res) => {
  try {
    const id = await getEmpId(req.user.id);
    res.json(await service.clockOut(id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};