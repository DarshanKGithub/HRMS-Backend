const service = require("../services/notificationService");

exports.getNotifications = async (req, res, next) => {
  try {
    const data = await service.getAll(req.user.id, req.query);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const result = await service.markAsRead(req.user.id, req.params.id);
    if (!result.rows.length) {
      const err = new Error("Notification not found");
      err.status = 404;
      throw err;
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await service.markAllAsRead(req.user.id);
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};