// Seeds development paper data so the guided browse flow can be tested locally.
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/db.js';
import Answer from '../src/models/Answer.js';
import Paper from '../src/models/Paper.js';
import Question from '../src/models/Question.js';

const subjects = [
  {
    subject: 'CS201',
    subjectName: 'Data Structures',
    modelFileUrl: 'https://example.com/ds-model.pdf',
    endsemFileUrl: 'https://example.com/ds-endsem.pdf',
  },
  {
    subject: 'CS202',
    subjectName: 'DBMS',
    modelFileUrl: 'https://example.com/dbms-model.pdf',
    endsemFileUrl: 'https://example.com/dbms-endsem.pdf',
  },
  {
    subject: 'CS203',
    subjectName: 'Operating Systems',
    modelFileUrl: 'https://example.com/os-model.pdf',
    endsemFileUrl: 'https://example.com/os-endsem.pdf',
  },
];

function buildPapers() {
  return subjects.flatMap((subject) => [
    {
      title: `${subject.subjectName} Model Paper`,
      course: 'KTU',
      branch: 'CSE',
      semester: 4,
      subject: subject.subject,
      subjectName: subject.subjectName,
      subjectCode: subject.subject,
      paperType: 'model',
      year: 2024,
      month: 'March',
      fileUrl: subject.modelFileUrl,
      status: 'approved',
    },
    {
      title: `${subject.subjectName} Endsem Paper`,
      course: 'KTU',
      branch: 'CSE',
      semester: 4,
      subject: subject.subject,
      subjectName: subject.subjectName,
      subjectCode: subject.subject,
      paperType: 'endsem',
      year: 2023,
      month: 'December',
      fileUrl: subject.endsemFileUrl,
      status: 'approved',
    },
  ]);
}

const questionTemplatesBySubject = {
  CS201: [
    {
      questionText: 'Define stack and list two common stack operations.',
      marks: 5,
      co: 'CO1',
      answerText:
        'A stack is a linear data structure that follows the Last In First Out principle.\nInsertion is called push and deletion is called pop.\nStacks are commonly used in expression evaluation, recursion, and undo operations.',
    },
    {
      questionText: 'Explain breadth-first search with a suitable example.',
      marks: 10,
      co: 'CO2',
      answerText:
        'Breadth-first search visits vertices level by level from the starting node.\nIt uses a queue to track the next vertex to explore.\nBFS is useful for finding shortest paths in unweighted graphs and for graph traversal problems.',
    },
    {
      questionText: 'Compare arrays and linked lists.',
      marks: 5,
      co: 'CO3',
      answerText:
        'Arrays store elements in contiguous memory and allow direct indexed access.\nLinked lists store nodes connected by pointers and grow dynamically.\nArrays are faster for random access, while linked lists are better for frequent insertions and deletions.',
    },
  ],
  CS202: [
    {
      questionText: 'What is normalization in DBMS?',
      marks: 5,
      co: 'CO1',
      answerText:
        'Normalization is the process of organizing database tables to reduce redundancy.\nIt divides large tables into smaller related tables.\nThis improves data consistency and reduces update, insertion, and deletion anomalies.',
    },
    {
      questionText: 'Explain primary key and foreign key with examples.',
      marks: 10,
      co: 'CO2',
      answerText:
        'A primary key uniquely identifies each record in a table.\nA foreign key refers to the primary key of another table.\nFor example, Student(id) can be referenced by Enrollment(studentId) to represent course registrations.',
    },
    {
      questionText: 'Describe the ACID properties of transactions.',
      marks: 10,
      co: 'CO3',
      answerText:
        'ACID stands for Atomicity, Consistency, Isolation, and Durability.\nAtomicity ensures a transaction completes fully or not at all.\nConsistency preserves database rules, isolation prevents interference, and durability keeps committed data permanent.',
    },
  ],
  CS203: [
    {
      questionText: 'Define process and process control block.',
      marks: 5,
      co: 'CO1',
      answerText:
        'A process is a program in execution with its own state and resources.\nThe process control block stores information such as process id, state, registers, and scheduling data.\nThe operating system uses it to manage context switching and process execution.',
    },
    {
      questionText: 'Explain round-robin CPU scheduling.',
      marks: 10,
      co: 'CO2',
      answerText:
        'Round-robin scheduling assigns each process a fixed time quantum.\nProcesses are placed in a ready queue and get CPU time in cyclic order.\nIt improves response time for time-sharing systems but performance depends on quantum size.',
    },
    {
      questionText: 'What is deadlock? List the necessary conditions.',
      marks: 10,
      co: 'CO3',
      answerText:
        'Deadlock occurs when processes wait indefinitely for resources held by each other.\nThe necessary conditions are mutual exclusion, hold and wait, no preemption, and circular wait.\nIf all four conditions hold together, a deadlock can occur.',
    },
  ],
};

function buildQuestionsForPaper(paper) {
  const templates = questionTemplatesBySubject[paper.subject] ?? questionTemplatesBySubject.CS201;

  return templates.map((template, index) => ({
    paperId: paper._id,
    questionText: template.questionText,
    part: index === 0 ? 'A' : 'B',
    module: index === 0 ? undefined : 1,
    questionNumber: index === 0 ? 1 : 9,
    subPart: index === 0 ? undefined : String.fromCharCode(96 + index),
    order: index + 1,
    marks: template.marks,
    co: template.co,
    answerText: template.answerText,
  }));
}

async function seed() {
  await connectDatabase();
  await Answer.deleteMany({});
  await Question.deleteMany({});
  await Paper.deleteMany({});

  const papers = await Paper.insertMany(buildPapers());
  const questionSeeds = papers.flatMap((paper) => buildQuestionsForPaper(paper));
  const questions = await Question.insertMany(
    questionSeeds.map(({ answerText, ...question }) => question),
  );
  const answers = await Answer.insertMany(
    questions.map((question, index) => ({
      questionId: question._id,
      answerText: questionSeeds[index].answerText,
      source: 'manual',
    })),
  );

  console.log('Seed data inserted successfully');
  console.log(
    `${papers.length} papers, ${questions.length} questions, ${answers.length} answers inserted`,
  );
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
