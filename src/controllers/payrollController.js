const service = require("../services/payrollService");
const generatePDF = require("../utils/generatePayslips");
const payrollModel = require("../models/payrollModel");

exports.generate = async (req, res) => {
  const data = await service.generate(
    req.body.employee_id,
    req.body.month
  );
  res.json(data);
};

exports.downloadPayslip = async (req, res) => {
  const result = await payrollModel.findById(req.params.id);
  const data = result.rows[0];

  const pdf = await generatePDF({
    name: data.name,
    month: data.month,
    base: data.base_salary,
    deduction: data.deductions,
    net: data.net_salary
  });

  res.setHeader("Content-Type", "application/pdf");
  res.send(pdf);
};