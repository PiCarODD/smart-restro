const { AppError } = require('../utils/errors');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('Error:', err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Duplicate entry',
      field: err.errors[0]?.path,
      message: 'This value already exists'
    });
  }

  // Sequelize foreign key errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Invalid reference',
      message: 'The referenced record does not exist'
    });
  }

  // Custom application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.errors && { errors: err.errors })
    });
  }

  // Default server error
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};

