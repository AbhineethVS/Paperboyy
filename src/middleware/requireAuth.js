// Express guard for signed-in HTML routes: redirects anonymous users to the local login page.
export function requireAuth(req, res, next) {
  if (!req.session.userId) {
    res.redirect('/login');
    return;
  }
  next();
}
