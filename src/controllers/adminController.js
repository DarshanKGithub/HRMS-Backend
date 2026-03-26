const authService = require("../services/authService");

exports.login = async (req, res) => {
  try {
    const token = await authService.login(
      req.body.email,
      req.body.password
    );
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};