// Local email/password auth routes: registration, login, and session logout using bcrypt.
import { Router } from 'express';
import bcrypt from 'bcrypt';
import UserProfile from '../../models/UserProfile.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function validateEmailFormat(email) {
  return typeof email === 'string' && email.includes('@') && EMAIL_REGEX.test(email.trim());
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

router.get(
  '/register',
  asyncHandler(async (req, res) => {
    res.render('layouts/base', {
      title: 'Register',
      contentPartial: '../pages/register',
      authError: null,
    });
  }),
);

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const emailRaw = req.body.email;
    const password = req.body.password;

    if (!validateEmailFormat(emailRaw ?? '')) {
      res.status(400).render('layouts/base', {
        title: 'Register',
        contentPartial: '../pages/register',
        authError: 'Enter a valid email address.',
      });
      return;
    }

    if (!validatePassword(password)) {
      res.status(400).render('layouts/base', {
        title: 'Register',
        contentPartial: '../pages/register',
        authError: 'Password must be at least 6 characters.',
      });
      return;
    }

    const email = normalizeEmail(emailRaw);

    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await UserProfile.create({
        email,
        passwordHash,
      });
      req.session.userId = user.id;
      res.redirect('/dashboard');
    } catch (err) {
      const code = typeof err === 'object' && err !== null ? err.code : undefined;
      if (code === 11000) {
        res.status(409).render('layouts/base', {
          title: 'Register',
          contentPartial: '../pages/register',
          authError: 'An account with this email already exists.',
        });
        return;
      }
      throw err;
    }
  }),
);

router.get(
  '/login',
  asyncHandler(async (req, res) => {
    res.render('layouts/base', {
      title: 'Login',
      contentPartial: '../pages/login',
      authError: null,
    });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const emailRaw = req.body.email;
    const password = req.body.password;

    if (!validateEmailFormat(emailRaw ?? '') || typeof password !== 'string') {
      res.status(400).render('layouts/base', {
        title: 'Login',
        contentPartial: '../pages/login',
        authError: 'Enter a valid email and password.',
      });
      return;
    }

    const email = normalizeEmail(emailRaw);
    const user = await UserProfile.findOne({ email }).select('+passwordHash').exec();

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).render('layouts/base', {
        title: 'Login',
        contentPartial: '../pages/login',
        authError: 'Invalid email or password.',
      });
      return;
    }

    req.session.userId = user.id;
    res.redirect('/dashboard');
  }),
);

router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      next(err);
      return;
    }
    res.redirect('/');
  });
});

export default router;
