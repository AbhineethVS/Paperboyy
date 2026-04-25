// Renders the signed-in dashboard using the local user profile from the session (Mongo user id).
import UserProfile from '../../models/UserProfile.js';

export async function renderDashboard(req, res) {
  const userId = req.session.userId;
  const profile = userId ? await UserProfile.findById(userId).lean() : null;

  const userEmail = typeof profile?.email === 'string' ? profile.email : null;

  res.render('layouts/base', {
    title: 'Dashboard',
    contentPartial: '../pages/dashboard',
    userId: typeof userId === 'string' ? userId : null,
    userEmail,
  });
}
