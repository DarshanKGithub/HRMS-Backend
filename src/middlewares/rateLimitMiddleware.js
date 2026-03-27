const buckets = new Map();

const createRateLimiter = ({ windowMs, max, keySelector, message }) => {
  return (req, res, next) => {
    const key = keySelector ? keySelector(req) : req.ip;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      const err = new Error(message || "Too many requests");
      err.status = 429;
      return next(err);
    }

    bucket.count += 1;
    return next();
  };
};

module.exports = createRateLimiter;