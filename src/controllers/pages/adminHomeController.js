// Renders the admin home page shell; inbox and paper tools are added in later prompts.
export function renderAdminHome(req, res) {
  res.render('layouts/base', {
    title: 'Admin',
    contentPartial: '../pages/admin',
  });
}
