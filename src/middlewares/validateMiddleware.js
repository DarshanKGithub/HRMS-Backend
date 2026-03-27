module.exports = (schema, source = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const err = new Error(error.details.map((d) => d.message).join(", "));
      err.status = 422;
      err.details = error.details.map((d) => ({
        message: d.message,
        path: d.path,
      }));
      return next(err);
    }

    req[source] = value;
    next();
  };
};