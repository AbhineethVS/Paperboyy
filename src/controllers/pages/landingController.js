// Renders the public landing page, or redirects signed-in users to the dashboard.
export function renderLanding(req, res) {
  if (req.session.userId) {
    res.redirect('/dashboard');
    return;
  }

  res.render('layouts/base', {
    contentPartial: '../pages/landing',
  });
}
