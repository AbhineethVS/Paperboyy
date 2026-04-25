// Minimal JSON health check for verifying the API surface is mounted (no shared error envelope yet).
import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';

const router = Router();

router.get(
  '/health',
  asyncHandler(async (req, res) => {
    res.json({ ok: true });
  }),
);

export default router;
