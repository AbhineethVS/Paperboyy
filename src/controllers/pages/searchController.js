// Renders the quick search page with question results and active filter state.
import { searchQuestions } from '../../services/browsePapers.js';

function normalizeTextFilter(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeAllFilter(value) {
  const normalized = normalizeTextFilter(value);
  return normalized === '' || normalized.toLowerCase() === 'all' ? null : normalized;
}

export async function searchPage(req, res) {
  const q = normalizeTextFilter(req.query.q);
  const semester = normalizeTextFilter(req.query.semester);
  const subject = normalizeTextFilter(req.query.subject);
  const type = normalizeTextFilter(req.query.type);

  const semesterFilter = normalizeAllFilter(req.query.semester);
  const subjectFilter = subject || null;
  const typeFilter = normalizeAllFilter(req.query.type);

  const results = await searchQuestions({
    keyword: q,
    semester: semesterFilter,
    subject: subjectFilter,
    type: typeFilter,
  });

  res.render('layouts/base', {
    title: 'Search',
    contentPartial: '../pages/search',
    results,
    filters: { q, semester, subject, type },
  });
}
