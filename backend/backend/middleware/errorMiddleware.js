// Catches any request that didn't match a route
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Final error handler — every thrown/forwarded error ends up here.
// Keeps error response shape consistent across the whole API.
const errorHandler = (err, req, res, next) => {
  // If a route/middleware set res.status already, keep it; otherwise default to 500
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Server error";

  // Mongoose bad ObjectId (e.g. /api/records/abc123)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Mongoose duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field ? field : "Field"} already in use`;
  }

  console.error(err);

  res.status(statusCode).json({
    message,
    // stack only in development, never leak it in production
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
};

module.exports = { notFound, errorHandler };
