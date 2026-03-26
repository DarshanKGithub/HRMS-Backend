const jwt = require("jsonwebtoken");

module.exports = (roles = []) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      console.log("TOKEN:", token);

      if (!token) return res.status(401).json({ msg: "No token" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log("DECODED:", decoded);
      console.log("REQUIRED ROLES:", roles);

      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role)) {
        console.log("ROLE FAILED");
        return res.status(403).json({ msg: "Forbidden" });
      }

      next();
    } catch (err) {
      console.log("ERROR:", err.message);
      res.status(401).json({ msg: "Invalid token" });
    }
  };
};