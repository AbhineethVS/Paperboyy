// Wraps async Express route handlers so rejected promises reach the centralized error middleware.
export function asyncHandler(fn) {
  return function asyncHandlerWrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
