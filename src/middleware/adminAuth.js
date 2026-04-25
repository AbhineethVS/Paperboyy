// Session-based admin guard for protecting manual admin tools.
export function requireAdmin(req, res, next) {
  if (req.session?.isAdmin === true) {
    next();
    return;
  }

  res.redirect('/');
}
