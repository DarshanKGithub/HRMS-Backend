const service = require("../services/notificationService");

exports.getNotifications = async (req, res) => {
  const data = await service.getAll(req.user.id);
  res.json(data.rows);
};