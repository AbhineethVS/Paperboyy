// Public EJS page routes: landing, legacy archive, guided browse, search, and paper viewer placeholders.
import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  renderBrowseBranch,
  renderBrowsePapers,
  renderBrowseSemester,
  renderBrowseSubjects,
  renderPaperView,
} from '../../controllers/pages/browseController.js';
import { renderLanding } from '../../controllers/pages/landingController.js';
import { searchPage } from '../../controllers/pages/searchController.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => renderLanding(req, res)));

router.get(
  '/browser',
  asyncHandler(async (req, res) => {
    res.render('layouts/base', {
      title: 'Archive',
      contentPartial: '../pages/browser',
    });
  }),
);

router.get(
  '/browse',
  asyncHandler(async (req, res) => renderBrowseBranch(req, res)),
);

router.get(
  '/browse/semester',
  asyncHandler(async (req, res) => renderBrowseSemester(req, res)),
);

router.get(
  '/browse/subjects',
  asyncHandler(async (req, res) => renderBrowseSubjects(req, res)),
);

router.get(
  '/browse/papers',
  asyncHandler(async (req, res) => renderBrowsePapers(req, res)),
);

router.get(
  '/search',
  asyncHandler(async (req, res) => searchPage(req, res)),
);

router.get(
  '/paper/:id',
  asyncHandler(async (req, res) => renderPaperView(req, res)),
);

export default router;
