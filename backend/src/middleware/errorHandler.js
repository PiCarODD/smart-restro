const { AppError, ValidationError } = require('../utils/errors');

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
      message: 'Please check the form for errors',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path;
    return res.status(409).json({
      error: 'Duplicate entry',
      message: `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'This value'} already exists`,
      details: [
        {
          field: field || 'unknown',
          message: 'This value already exists'
        }
      ]
    });
  }

  // Sequelize foreign key errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Invalid reference',
      message: 'The referenced record does not exist',
      details: [
        {
          field: 'reference',
          message: 'The referenced record does not exist'
        }
      ]
    });
  }

  // Joi validation errors (if using Joi)
  if (err.isJoi || err.name === 'ValidationError') {
    const details = err.details?.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message
    })) || [];
    
    return res.status(400).json({
      error: 'Validation error',
      message: err.message || 'Please check the form for errors',
      details
    });
  }

  // Custom application errors
  if (err instanceof AppError) {
    const response = {
      error: err.message,
      message: err.message
    };
    
    // Include field-level errors if available
    if (err.errors && Array.isArray(err.errors)) {
      response.details = err.errors;
    } else if (err.errors) {
      response.details = [err.errors];
    }
    
    return res.status(err.statusCode).json(response);
  }

  // Default server error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred. Please try again later.' 
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

