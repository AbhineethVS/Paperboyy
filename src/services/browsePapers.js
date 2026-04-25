// Approved-paper queries for browse UI: distinct subjects and filtered paper lists for server-rendered archive pages.
import mongoose from 'mongoose';
import Answer from '../models/Answer.js';
import Paper from '../models/Paper.js';
import Question from '../models/Question.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {number} semester
 * @returns {Promise<{ subject: string, subjectName: string }[]>}
 */
export async function listDistinctSubjectsForSemester(semester) {
  return Paper.aggregate([
    {
      $match: {
        status: 'approved',
        semester,
        subject: { $exists: true, $nin: [null, ''] },
      },
    },
    {
      $group: {
        _id: '$subject',
        subjectName: { $first: { $ifNull: ['$subjectName', '$title'] } },
      },
    },
    { $project: { _id: 0, subject: '$_id', subjectName: 1 } },
    { $sort: { subjectName: 1, subject: 1 } },
  ]);
}

/**
 * @param {number} semester
 * @param {string} subject
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listPapersForSemesterAndSubject(semester, subject) {
  return Paper.find({
    status: 'approved',
    semester,
    subject,
  })
    .sort({ year: -1, month: -1, title: 1 })
    .lean()
    .exec();
}

/**
 * @param {string} branch
 * @param {number} semester
 * @returns {Promise<{ subject: string, subjectName: string, subjectCode: string }[]>}
 */
export async function listDistinctSubjectsForBranchSemester(branch, semester) {
  const rows = await Paper.find({
    status: 'approved',
    branch,
    semester,
    subject: { $exists: true, $nin: [null, ''] },
  })
    .select('subject subjectName subjectCode title')
    .sort({ subjectName: 1, subject: 1 })
    .lean()
    .exec();

  const subjects = new Map();

  for (const row of rows) {
    const subject = typeof row.subject === 'string' ? row.subject.trim() : '';
    if (!subject || subjects.has(subject)) {
      continue;
    }

    subjects.set(subject, {
      subject,
      subjectName: row.subjectName || row.title || subject,
      subjectCode: row.subjectCode || subject,
    });
  }

  return [...subjects.values()].sort((a, b) => {
    const nameCompare = a.subjectName.localeCompare(b.subjectName);
    return nameCompare === 0 ? a.subject.localeCompare(b.subject) : nameCompare;
  });
}

/**
 * @param {{ branch: string, semester: number, subject: string, paperType: string }} filters
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listPapersForBrowse(filters) {
  return Paper.find({
    status: 'approved',
    branch: filters.branch,
    semester: filters.semester,
    subject: filters.subject,
    paperType: filters.paperType,
  })
    .sort({ year: -1 })
    .lean()
    .exec();
}

/**
 * @param {{ keyword?: string, semester?: string | number, subject?: string, type?: string }} filters
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function searchQuestions({ keyword, semester, subject, type }) {
  const questionQuery = {};
  const normalizedKeyword = typeof keyword === 'string' ? keyword.trim() : '';
  const normalizedSemester = semester !== undefined && semester !== null ? Number(semester) : NaN;
  const normalizedSubject = typeof subject === 'string' ? subject.trim() : '';
  const normalizedType = typeof type === 'string' ? type.trim().toUpperCase() : '';
  const isKeywordEmpty = normalizedKeyword === '';
  const hasSemesterFilter =
    Number.isInteger(normalizedSemester) && normalizedSemester >= 1 && normalizedSemester <= 8;
  const hasSubjectFilter = normalizedSubject !== '';
  const hasTypeFilter = normalizedType === 'MODEL' || normalizedType === 'ENDSEM';
  const isNoFilters = !hasSemesterFilter && !hasSubjectFilter && !hasTypeFilter;

  if (isKeywordEmpty && isNoFilters) {
    return [];
  }

  if (normalizedKeyword) {
    questionQuery.$or = [
      { questionText: { $regex: escapeRegex(normalizedKeyword), $options: 'i' } },
    ];
  }

  const paperQuery = { status: 'approved' };
  if (hasSemesterFilter) {
    paperQuery.semester = normalizedSemester;
  }

  if (hasSubjectFilter) {
    paperQuery.$or = [
      { subjectCode: normalizedSubject },
      { subject: normalizedSubject },
    ];
  }

  if (normalizedType === 'MODEL') {
    paperQuery.paperType = 'model';
  } else if (normalizedType === 'ENDSEM') {
    paperQuery.paperType = 'endsem';
  }

  const papers = await Paper.find(paperQuery).select('_id').lean().exec();
  if (papers.length === 0) {
    return [];
  }

  questionQuery.paperId = { $in: papers.map((paper) => paper._id) };

  const questions = await Question.find(questionQuery)
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()
    .exec();

  const questionIds = questions.map((question) => question._id);
  const paperIds = questions.map((question) => question.paperId);

  const [answers, fullPapers] = await Promise.all([
    Answer.find({ questionId: { $in: questionIds } }).lean().exec(),
    Paper.find({ _id: { $in: paperIds } })
      .select('_id subjectName semester year paperType type')
      .lean()
      .exec(),
  ]);

  const answerMap = new Map(
    answers.map((answer) => [String(answer.questionId), answer]),
  );
  const paperMap = new Map(
    fullPapers.map((paper) => [
      String(paper._id),
      {
        ...paper,
        type: paper.type || paper.paperType || '',
      },
    ]),
  );

  return questions.map((question) => ({
    ...question,
    answer: answerMap.get(String(question._id)) || null,
    paper: paperMap.get(String(question.paperId)) || null,
  }));
}

function normalizeQuestion(question, answersByQuestionId) {
  const fallbackNumber = Number.isFinite(question.questionNumber)
    ? question.questionNumber
    : question.order;

  return {
    _id: question._id,
    questionText: question.questionText,
    order: question.order,
    part: question.part || 'A',
    module: question.module ?? null,
    questionNumber: fallbackNumber,
    subPart: question.subPart || null,
    marks: question.marks,
    co: question.co,
    answer: answersByQuestionId.get(String(question._id)) ?? null,
  };
}

function groupPartBQuestions(questions) {
  const modulesByNumber = new Map();

  for (const question of questions) {
    const moduleNumber = question.module ?? 0;
    if (!modulesByNumber.has(moduleNumber)) {
      modulesByNumber.set(moduleNumber, new Map());
    }

    const questionsByNumber = modulesByNumber.get(moduleNumber);
    if (!questionsByNumber.has(question.questionNumber)) {
      questionsByNumber.set(question.questionNumber, {
        questionNumber: question.questionNumber,
        subParts: [],
      });
    }

    questionsByNumber.get(question.questionNumber).subParts.push(question);
  }

  return [...modulesByNumber.entries()]
    .sort(([a], [b]) => a - b)
    .map(([moduleNumber, questionsByNumber]) => ({
      module: moduleNumber || null,
      questions: [...questionsByNumber.values()]
        .map((questionGroup) => ({
          ...questionGroup,
          subParts: questionGroup.subParts.sort((a, b) => a.order - b.order),
        }))
        .sort((a, b) => a.questionNumber - b.questionNumber),
    }));
}

/**
 * @param {string} paperId
 * @returns {Promise<{ paper: Record<string, unknown>, questions: Record<string, unknown>[], partA: Record<string, unknown>[], partB: { modules: Record<string, unknown>[] } } | null>}
 */
export async function getPaperWithQA(paperId) {
  if (!mongoose.isValidObjectId(paperId)) {
    return null;
  }

  const paper = await Paper.findById(paperId).lean().exec();
  if (!paper) {
    return null;
  }

  const questions = await Question.find({ paperId: paper._id }).sort({ order: 1 }).lean().exec();
  const questionIds = questions.map((question) => question._id);
  const answers = await Answer.find({ questionId: { $in: questionIds } }).lean().exec();
  const answersByQuestionId = new Map(
    answers.map((answer) => [
      String(answer.questionId),
      { _id: answer._id, answerText: answer.answerText },
    ]),
  );
  const normalizedQuestions = questions.map((question) =>
    normalizeQuestion(question, answersByQuestionId),
  );
  const partA = normalizedQuestions
    .filter((question) => question.part !== 'B')
    .sort((a, b) => a.order - b.order);
  const partBQuestions = normalizedQuestions
    .filter((question) => question.part === 'B')
    .sort((a, b) => a.order - b.order);

  return {
    paper,
    questions: normalizedQuestions,
    partA,
    partB: {
      modules: groupPartBQuestions(partBQuestions),
    },
  };
}
