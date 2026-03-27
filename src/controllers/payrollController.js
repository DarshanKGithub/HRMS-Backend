const service = require("../services/payrollService");
const generatePDF = require("../utils/generatePayslips");
const payrollModel = require("../models/payrollModel");
const auditService = require("../services/auditService");

exports.generate = async (req, res, next) => {
  try {
    const { employee_id, month } = req.body;

    if (!employee_id || month === undefined || month === null) {
      const err = new Error("employee_id and month are required");
      err.status = 422;
      throw err;
    }

    const data = await service.generate(employee_id, month);
    await auditService.log({
      actorUserId: req.user.id,
      action: "PAYROLL_GENERATED",
      targetType: "payroll",
      targetId: data.id,
      metadata: { employee_id, month },
    });
    res.status(200).json(data);
  } catch (err) {
    if (err.message === "Payroll already generated") err.status = 409;
    if (err.message === "Employee not found") err.status = 404;
    if (err.message === "Employee salary is invalid") err.status = 422;
    if (err.message === "Invalid month") err.status = 422;
    next(err);
  }
};

exports.downloadPayslip = async (req, res, next) => {
  try {
    const result = await payrollModel.findById(req.params.id);
    const data = result.rows[0];

    if (!data) {
      const err = new Error("Payslip not found");
      err.status = 404;
      throw err;
    }

    const pdf = await generatePDF({
      name: data.name,
      month: data.month,
      base: data.base_salary,
      deduction: data.deductions,
      net: data.net_salary,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.status(200).send(pdf);
  } catch (err) {
    next(err);
  }
};