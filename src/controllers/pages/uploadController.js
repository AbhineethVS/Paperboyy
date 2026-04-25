// Renders the upload page shell; submission flow and storage are implemented in a later prompt.
export function renderUpload(req, res) {
  res.render('layouts/base', {
    title: 'Upload',
    contentPartial: '../pages/upload',
  });
}
