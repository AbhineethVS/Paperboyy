// Express middleware that renders the custom 404 EJS page for unknown routes.
export function notFound(req, res) {
  res.status(404).render('layouts/base', {
    title: 'Not found',
    contentPartial: '../errors/404',
  });
}
