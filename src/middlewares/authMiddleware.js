const jwt = require("jsonwebtoken");

module.exports = (roles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || "";
      const [scheme, token] = authHeader.split(" ");

      if (scheme !== "Bearer" || !token) {
        const err = new Error("Authentication token missing or malformed");
        err.status = 401;
        return next(err);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role)) {
        const err = new Error("Forbidden");
        err.status = 403;
        return next(err);
      }

      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        err.status = 401;
        err.message = "Token expired";
      } else if (err.name === "JsonWebTokenError") {
        err.status = 401;
        err.message = "Invalid token";
      }

      if (!err.status) err.status = 401;
      next(err);
    }
  };
};