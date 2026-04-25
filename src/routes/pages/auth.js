// Authenticated EJS page routes (dashboard, upload); protected by session requireAuth.
import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { renderDashboard } from '../../controllers/pages/dashboardController.js';
import { renderUpload } from '../../controllers/pages/uploadController.js';

const router = Router();

router.get('/dashboard', requireAuth, asyncHandler(async (req, res) => renderDashboard(req, res)));

router.get('/upload', requireAuth, (req, res) => renderUpload(req, res));

export default router;
