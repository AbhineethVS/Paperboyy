// Central Express error middleware: renders the 500 EJS page (API JSON errors come later).
import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  console.error(err);

  const status = Number(err.status ?? err.statusCode) || 500;
  const safeMessage =
    env.isProduction ? 'Something went wrong.' : err.message || 'Something went wrong.';
  const errorDetails = env.isProduction ? '' : String(err.stack || '');

  res.status(status).render('layouts/base', {
    title: 'Error',
    contentPartial: '../errors/500',
    errorMessage: safeMessage,
    errorDetails,
  });
}
