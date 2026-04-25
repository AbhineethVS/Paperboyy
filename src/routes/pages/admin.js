// Minimal admin EJS page routes for manual question and answer entry.
import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { requireAdmin } from '../../middleware/adminAuth.js';
import {
  createAnswer,
  createQuestion,
  deleteAnswer,
  deleteQuestion,
  renderEditAnswer,
  renderEditQuestion,
  renderDashboard,
  renderNewAnswer,
  renderNewQuestion,
  updateAnswer,
  updateQuestion,
} from '../../controllers/adminController.js';

const router = Router();

router.get('/login', (req, res) => {
  req.session.isAdmin = true;
  res.redirect('/admin');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

router.use(requireAdmin);

router.get('/', asyncHandler(async (req, res) => renderDashboard(req, res)));

router.get('/question/new', asyncHandler(async (req, res) => renderNewQuestion(req, res)));

router.post('/question', asyncHandler(async (req, res) => createQuestion(req, res)));

router.get('/question/edit/:id', asyncHandler(async (req, res) => renderEditQuestion(req, res)));

router.post('/question/edit/:id', asyncHandler(async (req, res) => updateQuestion(req, res)));

router.post('/question/delete/:id', asyncHandler(async (req, res) => deleteQuestion(req, res)));

router.get('/answer/new', asyncHandler(async (req, res) => renderNewAnswer(req, res)));

router.post('/answer', asyncHandler(async (req, res) => createAnswer(req, res)));

router.get('/answer/edit/:id', asyncHandler(async (req, res) => renderEditAnswer(req, res)));

router.post('/answer/edit/:id', asyncHandler(async (req, res) => updateAnswer(req, res)));

router.post('/answer/delete/:id', asyncHandler(async (req, res) => deleteAnswer(req, res)));

export default router;
