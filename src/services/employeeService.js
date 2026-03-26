const employeeModel = require("../models/employeeModel");

exports.getProfile = async (userId) => {
  return await employeeModel.findByUserId(userId);
};