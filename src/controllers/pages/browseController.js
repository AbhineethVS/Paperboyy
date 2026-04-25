// Coordinates the guided browse flow from branch selection through filtered paper downloads.
import {
  getPaperWithQA,
  listDistinctSubjectsForBranchSemester,
  listPapersForBrowse,
} from '../../services/browsePapers.js';

export const BROWSE_BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];

function parseBranch(raw) {
  if (typeof raw !== 'string') {
    return null;
  }

  const branch = raw.trim().toUpperCase();
  return BROWSE_BRANCHES.includes(branch) ? branch : null;
}

function parseSemester(raw) {
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }

  const semester = Number(raw);
  if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
    return null;
  }

  return semester;
}

function parseSubject(raw) {
  if (typeof raw !== 'string') {
    return null;
  }

  const subject = raw.trim();
  return subject.length > 0 ? subject : null;
}

function parsePaperType(raw) {
  if (typeof raw !== 'string') {
    return null;
  }

  const type = raw.trim().toUpperCase();
  if (type === 'MODEL') {
    return { queryValue: 'MODEL', dbValue: 'model', label: 'Model papers' };
  }

  if (type === 'ENDSEM') {
    return { queryValue: 'ENDSEM', dbValue: 'endsem', label: 'Previous sem papers' };
  }

  return null;
}

export function renderBrowseBranch(req, res) {
  res.render('layouts/base', {
    title: 'Browse Papers',
    contentPartial: '../pages/browse-branch',
    branches: BROWSE_BRANCHES,
  });
}

export function renderBrowseSemester(req, res) {
  const branch = parseBranch(req.query.branch);
  if (!branch) {
    res.redirect('/browse');
    return;
  }

  res.render('layouts/base', {
    title: `${branch} Semesters`,
    contentPartial: '../pages/browse-semester',
    branch,
  });
}

export async function renderBrowseSubjects(req, res) {
  const branch = parseBranch(req.query.branch);
  if (!branch) {
    res.redirect('/browse');
    return;
  }

  const semester = parseSemester(req.query.semester);
  if (semester === null) {
    res.redirect(`/browse/semester?branch=${encodeURIComponent(branch)}`);
    return;
  }

  const subjects = await listDistinctSubjectsForBranchSemester(branch, semester);

  res.render('layouts/base', {
    title: `${branch} S${semester} Subjects`,
    contentPartial: '../pages/browse-subjects',
    branch,
    semester,
    subjects,
  });
}

export async function renderBrowsePapers(req, res) {
  const branch = parseBranch(req.query.branch);
  if (!branch) {
    res.redirect('/browse');
    return;
  }

  const semester = parseSemester(req.query.semester);
  if (semester === null) {
    res.redirect(`/browse/semester?branch=${encodeURIComponent(branch)}`);
    return;
  }

  const subject = parseSubject(req.query.subject);
  const paperType = parsePaperType(req.query.type);
  if (!subject || !paperType) {
    res.redirect(`/browse/subjects?branch=${encodeURIComponent(branch)}&semester=${semester}`);
    return;
  }

  const papers = await listPapersForBrowse({
    branch,
    semester,
    subject,
    paperType: paperType.dbValue,
  });

  res.render('layouts/base', {
    title: `${subject} ${paperType.label}`,
    contentPartial: '../pages/browse-papers',
    branch,
    semester,
    subject,
    paperType: paperType.queryValue,
    paperTypeLabel: paperType.label,
    papers,
  });
}

export async function renderPaperView(req, res) {
  const paperWithQA = await getPaperWithQA(req.params.id);
  if (!paperWithQA) {
    res.status(404).render('layouts/base', {
      title: 'Not found',
      contentPartial: '../errors/404',
    });
    return;
  }

  res.render('layouts/base', {
    title: paperWithQA.paper.subjectName || paperWithQA.paper.title || 'Paper',
    contentPartial: '../pages/paper-view',
    paper: paperWithQA.paper,
    questions: paperWithQA.questions,
    partA: paperWithQA.partA,
    partB: paperWithQA.partB,
  });
}
