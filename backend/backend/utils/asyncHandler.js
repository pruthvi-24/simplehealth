// Wraps an async route handler so any rejected promise / thrown error
// is automatically forwarded to Express's error-handling middleware,
// instead of every route needing its own try/catch.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
