// JSON endpoints for hybrid browse: distinct subjects by semester and paper cards filtered by semester + subject code.
import crypto from 'node:crypto';
import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  listDistinctSubjectsForSemester,
  listPapersForSemesterAndSubject,
} from '../../services/browsePapers.js';

const router = Router();

function parseSemesterParam(raw) {
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 8) {
    return null;
  }
  return n;
}

function sendApiError(res, status, code, message) {
  res.status(status).json({
    error: {
      code,
      message,
      requestId: crypto.randomUUID(),
    },
  });
}

router.get(
  '/subjects',
  asyncHandler(async (req, res) => {
    const semester = parseSemesterParam(req.query.semester);
    if (semester === null) {
      sendApiError(res, 400, 'INVALID_SEMESTER', 'Query parameter semester must be an integer from 1 to 8.');
      return;
    }
    const rows = await listDistinctSubjectsForSemester(semester);
    res.json(rows);
  }),
);

router.get(
  '/papers',
  asyncHandler(async (req, res) => {
    const semester = parseSemesterParam(req.query.semester);
    if (semester === null) {
      sendApiError(res, 400, 'INVALID_SEMESTER', 'Query parameter semester must be an integer from 1 to 8.');
      return;
    }
    const subjectRaw = req.query.subject;
    if (typeof subjectRaw !== 'string' || !subjectRaw.trim()) {
      sendApiError(res, 400, 'INVALID_SUBJECT', 'Query parameter subject is required.');
      return;
    }
    const subject = subjectRaw.trim();
    const papers = await listPapersForSemesterAndSubject(semester, subject);
    res.json(
      papers.map((p) => ({
        _id: p._id,
        subject: p.subject,
        subjectName: p.subjectName ?? p.title,
        year: p.year,
        month: p.month ?? null,
        paperType: p.paperType ?? null,
        fileUrl: p.fileUrl ?? null,
        title: p.title,
      })),
    );
  }),
);

export default router;
