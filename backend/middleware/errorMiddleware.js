// =====================================================================
// middleware/errorMiddleware.js — FIXED
// =====================================================================

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  // If headers already sent (e.g. during stream), delegate to Express default
  if (res.headersSent) {
    return next(err);
  }
  


  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
  };

  // ✅ FIX: Do NOT include `stack: null` in production — it's noise.
  // Only include stack in development where it's actually useful.
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};