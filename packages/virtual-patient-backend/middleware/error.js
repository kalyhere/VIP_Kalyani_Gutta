export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't expose internal error details to client
  const safeError = {
    error: 'An internal server error occurred',
    requestId: req.id,
    status: err.status || 500
  };

  // Add validation errors if present
  if (err.errors && Array.isArray(err.errors)) {
    safeError.validation = err.errors.map(e => ({
      field: e.param,
      message: e.msg
    }));
  }

  res.status(safeError.status).json(safeError);
}; 