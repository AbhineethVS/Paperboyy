// Minimal server-rendered admin controller for manually adding questions and answers.
import mongoose from 'mongoose';
import Answer from '../models/Answer.js';
import Question from '../models/Question.js';

function stringValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalNumber(value) {
  const raw = stringValue(value);
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function requiredNumber(value) {
  const parsed = optionalNumber(value);
  return parsed === undefined ? null : parsed;
}

function subPartOffset(subPart) {
  if (!subPart) {
    return 0;
  }

  const normalized = subPart.toLowerCase();
  const code = normalized.charCodeAt(0);
  return code >= 97 && code <= 122 ? code - 96 : 0;
}

function computeOrder({ part, module, questionNumber, subPart }) {
  if (part === 'B') {
    return (module || 0) * 1000 + questionNumber * 10 + subPartOffset(subPart);
  }

  return questionNumber * 10 + subPartOffset(subPart);
}

function questionFormOptions(overrides = {}) {
  return {
    title: overrides.title ?? 'New Question',
    heading: overrides.heading ?? 'Add question',
    action: overrides.action ?? '/admin/question',
    submitLabel: overrides.submitLabel ?? 'Save question',
  };
}

function answerFormOptions(overrides = {}) {
  return {
    title: overrides.title ?? 'New Answer',
    heading: overrides.heading ?? 'Add answer',
    action: overrides.action ?? '/admin/answer',
    submitLabel: overrides.submitLabel ?? 'Save answer',
    showForm: overrides.showForm ?? true,
  };
}

function renderQuestionForm(res, values = {}, error = null, options = {}) {
  const form = questionFormOptions(options);
  res.render('layouts/base', {
    title: form.title,
    contentPartial: '../pages/admin-question-form',
    values,
    error,
    form,
  });
}

function renderAnswerForm(res, values = {}, error = null, options = {}) {
  const form = answerFormOptions(options);
  res.render('layouts/base', {
    title: form.title,
    contentPartial: '../pages/admin-answer-form',
    values,
    questionId: values.questionId ?? '',
    question: values.question ?? null,
    error,
    form,
  });
}

function renderNotFound(res) {
  res.status(404).render('layouts/base', {
    title: 'Not found',
    contentPartial: '../errors/404',
  });
}

function buildQuestionPayload(values) {
  const paperId = stringValue(values.paperId);
  const part = stringValue(values.part).toUpperCase();
  const module = optionalNumber(values.module);
  const questionNumber = requiredNumber(values.questionNumber);
  const subPart = stringValue(values.subPart).toLowerCase();
  const questionText = stringValue(values.questionText);
  const marks = optionalNumber(values.marks);
  const co = stringValue(values.co).toUpperCase();

  if (!mongoose.isValidObjectId(paperId)) {
    return { error: 'Paper id must be a valid MongoDB ObjectId.' };
  }

  if (!['A', 'B'].includes(part)) {
    return { error: 'Part must be A or B.' };
  }

  if (part === 'B' && module === undefined) {
    return { error: 'Module is required for Part B questions.' };
  }

  if (questionNumber === null) {
    return { error: 'Question number is required.' };
  }

  if (!questionText) {
    return { error: 'Question text is required.' };
  }

  return {
    payload: {
      paperId,
      part,
      module: part === 'B' ? module : undefined,
      questionNumber,
      subPart: subPart || undefined,
      questionText,
      marks,
      co: co || undefined,
      order: computeOrder({ part, module, questionNumber, subPart }),
    },
  };
}

function questionToFormValues(question) {
  return {
    paperId: String(question.paperId),
    part: question.part,
    module: question.module ?? '',
    questionNumber: question.questionNumber,
    subPart: question.subPart ?? '',
    questionText: question.questionText,
    marks: question.marks ?? '',
    co: question.co ?? '',
  };
}

export function renderDashboard(req, res) {
  res.render('layouts/base', {
    title: 'Admin',
    contentPartial: '../pages/admin-dashboard',
  });
}

export function renderNewQuestion(req, res) {
  renderQuestionForm(res);
}

export async function createQuestion(req, res) {
  const values = req.body;
  const { payload, error } = buildQuestionPayload(values);
  if (error) {
    renderQuestionForm(res, values, error);
    return;
  }

  const question = await Question.create(payload);

  res.redirect(`/admin/answer/new?questionId=${question._id}`);
}

export async function renderEditQuestion(req, res) {
  const question = await Question.findById(req.params.id).lean().exec();
  if (!question) {
    renderNotFound(res);
    return;
  }

  renderQuestionForm(res, questionToFormValues(question), null, {
    title: 'Edit Question',
    heading: 'Edit question',
    action: `/admin/question/edit/${question._id}`,
    submitLabel: 'Update question',
  });
}

export async function updateQuestion(req, res) {
  const question = await Question.findById(req.params.id).lean().exec();
  if (!question) {
    renderNotFound(res);
    return;
  }

  const values = req.body;
  const { payload, error } = buildQuestionPayload(values);
  const formOptions = {
    title: 'Edit Question',
    heading: 'Edit question',
    action: `/admin/question/edit/${req.params.id}`,
    submitLabel: 'Update question',
  };

  if (error) {
    renderQuestionForm(res, values, error, formOptions);
    return;
  }

  await Question.findByIdAndUpdate(req.params.id, payload).exec();
  res.redirect(`/paper/${payload.paperId}`);
}

export async function deleteQuestion(req, res) {
  const question = await Question.findById(req.params.id).lean().exec();
  if (!question) {
    renderNotFound(res);
    return;
  }

  await Answer.deleteMany({ questionId: question._id }).exec();
  await Question.findByIdAndDelete(question._id).exec();
  res.redirect(`/paper/${question.paperId}`);
}

export async function renderNewAnswer(req, res) {
  const questionId = stringValue(req.query.questionId);

  if (!mongoose.isValidObjectId(questionId)) {
    renderAnswerForm(res, { questionId }, 'Question not found', {
      showForm: false,
    });
    return;
  }

  const question = await Question.findById(questionId).lean().exec();
  if (!question) {
    renderAnswerForm(res, { questionId }, 'Question not found', {
      showForm: false,
    });
    return;
  }

  renderAnswerForm(res, {
    questionId,
    question,
  });
}

export async function createAnswer(req, res) {
  const values = req.body;
  const questionId = stringValue(values.questionId);
  const answerText = stringValue(values.answerText);

  if (!mongoose.isValidObjectId(questionId)) {
    renderAnswerForm(res, values, 'Question id must be a valid MongoDB ObjectId.');
    return;
  }

  if (!answerText) {
    renderAnswerForm(res, values, 'Answer text is required.');
    return;
  }

  const question = await Question.findById(questionId).lean().exec();
  if (!question) {
    renderAnswerForm(res, values, 'Question not found', {
      showForm: false,
    });
    return;
  }

  await Answer.create({
    questionId,
    answerText,
    source: 'manual',
  });

  res.redirect(`/paper/${question.paperId}?focus=question-${question._id}`);
}

export async function renderEditAnswer(req, res) {
  const answer = await Answer.findById(req.params.id).lean().exec();
  if (!answer) {
    renderNotFound(res);
    return;
  }

  renderAnswerForm(
    res,
    {
      questionId: String(answer.questionId),
      answerText: answer.answerText,
    },
    null,
    {
      title: 'Edit Answer',
      heading: 'Edit answer',
      action: `/admin/answer/edit/${answer._id}`,
      submitLabel: 'Update answer',
    },
  );
}

export async function updateAnswer(req, res) {
  const answer = await Answer.findById(req.params.id).lean().exec();
  if (!answer) {
    renderNotFound(res);
    return;
  }

  const questionId = stringValue(req.body.questionId);
  const answerText = stringValue(req.body.answerText);
  const formOptions = {
    title: 'Edit Answer',
    heading: 'Edit answer',
    action: `/admin/answer/edit/${req.params.id}`,
    submitLabel: 'Update answer',
  };

  if (!mongoose.isValidObjectId(questionId)) {
    renderAnswerForm(res, req.body, 'Question id must be a valid MongoDB ObjectId.', formOptions);
    return;
  }

  if (!answerText) {
    renderAnswerForm(res, req.body, 'Answer text is required.', formOptions);
    return;
  }

  const question = await Question.findById(questionId).lean().exec();
  if (!question) {
    renderAnswerForm(res, req.body, 'Question not found.', formOptions);
    return;
  }

  await Answer.findByIdAndUpdate(req.params.id, { questionId, answerText, source: 'manual' }).exec();
  res.redirect(`/paper/${question.paperId}?focus=question-${question._id}`);
}

export async function deleteAnswer(req, res) {
  const answer = await Answer.findById(req.params.id).lean().exec();
  if (!answer) {
    renderNotFound(res);
    return;
  }

  const question = await Question.findById(answer.questionId).lean().exec();
  await Answer.findByIdAndDelete(answer._id).exec();
  res.redirect(question ? `/paper/${question.paperId}?focus=question-${question._id}` : '/admin');
}
