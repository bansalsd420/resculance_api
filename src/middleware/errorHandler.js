const { AppError } = require('./auth');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // MySQL duplicate key error
  if (err.code === 'ER_DUP_ENTRY') {
    const field = err.sqlMessage.match(/for key '(\w+)'/)?.[1] || 'field';
    error = new AppError(`Duplicate value for ${field}. Please use another value.`, 400);
  }

  // MySQL foreign key constraint error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error = new AppError('Referenced record does not exist.', 400);
  }

  // MySQL data too long error
  if (err.code === 'ER_DATA_TOO_LONG') {
    error = new AppError('Data provided is too long for the field.', 400);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    error = new AppError(`Invalid input data: ${errors.join(', ')}`, 400);
  }

  // JWT errors (already handled in auth middleware, but as backup)
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your token has expired. Please log in again.', 401);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
