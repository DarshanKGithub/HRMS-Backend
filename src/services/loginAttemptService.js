const attempts = new Map();

const MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS || 5);
const LOCK_MS = Number(process.env.LOGIN_LOCK_MS || 15 * 60 * 1000);

const getKey = (email, ip) => `${(email || "").toLowerCase()}::${ip || "unknown"}`;

const getState = (key) => {
  const state = attempts.get(key);
  if (!state) return { count: 0, lockedUntil: 0 };
  return state;
};

const ensureNotLocked = (email, ip) => {
  const key = getKey(email, ip);
  const state = getState(key);

  if (state.lockedUntil && Date.now() < state.lockedUntil) {
    const err = new Error("Too many failed login attempts. Try again later.");
    err.status = 429;
    throw err;
  }
};

const recordFailure = (email, ip) => {
  const key = getKey(email, ip);
  const state = getState(key);
  const nextCount = state.count + 1;

  const nextState = {
    count: nextCount,
    lockedUntil: nextCount >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0,
  };

  attempts.set(key, nextState);
};

const clearFailures = (email, ip) => {
  const key = getKey(email, ip);
  attempts.delete(key);
};

module.exports = {
  ensureNotLocked,
  recordFailure,
  clearFailures,
};