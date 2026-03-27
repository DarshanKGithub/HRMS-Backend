const notFound = (req, res, next) => {
  const err = new Error("Route not found");
  err.status = 404;
  next(err);
};

const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message =
    status === 500 ? "Internal server error" : err.message || "Request failed";

  const payload = {
    error: {
      status,
      message,
    },
  };

  if (err.details) {
    payload.error.details = err.details;
  }

  res.status(status).json(payload);
};

module.exports = { notFound, errorHandler };