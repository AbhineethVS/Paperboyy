# Paperboyy — Rebuild Masterplan (Express + EJS)

## What We’re Building (V1)

Paperboyy is a high-contrast, engineering-grid styled archive for KTU exam papers where students can browse/search approved papers and bookmark them.

For uploads, we are **skipping OCR**: students upload documents to an **Admin Inbox**, and the **admin manually creates** the paper metadata, questions, and (optionally) answers.

## Non-Negotiables

- **Backend**: Node.js + Express
- **Views**: EJS (routes like `/browser`, not `*.html`)
- **Frontend/UI**: Tailwind, bundled with Vite (EJS server-rendered pages, minimal client JS)
- **Auth**: Clerk
- **Design system**: must match the provided schema and reference UI
  - `extras/DESIGN.md`
  - `extras/code.html`
  - `extras/screen.png`
- **Error handling**: custom 404/500 + consistent JSON errors for `/api/*`
- **Partials**: split boilerplate into EJS partial files (navbar/footer/head/etc)

## Tagline

_Engineered for precision._

---

## Updated Tech Stack

| Layer | Tooling |
| --- | --- |
| Runtime | Node.js |
| Backend | Express |
| Views | EJS |
| Styling | Tailwind CSS |
| Bundling | Vite (for CSS + minimal JS) |
| Database | MongoDB Atlas (Mongoose) |
| Auth | Clerk |
| File storage | Cloudinary (or S3 later) |
| Hosting | Render (or any Node host) |

---

## V1 Feature List (Rebuild)

### 1) Browse Archive (`/browser`)

- Archive cards grid as per design (“The Archive”).
- Filters (server-rendered + optional dynamic fetch):
  - course, branch, semester, year, paper type, subject
- Each paper has:
  - title/subject, metadata, question count, bookmark state

### 2) Search (`/search`)

- Hero search UI as per design.
- Search across paper titles + subjects + question text.

### 3) Paper Viewer (`/paper/:paperId`)

- Clean paper header with metadata.
- Questions list (question number, marks, module/part if available).
- Optional: show answers if present.

### 4) Auth + Redirect (`/dashboard`)

- Sign-in via Clerk.
- On successful sign-in, redirect user to `/dashboard`.

### 5) Dashboard (`/dashboard`)

Shows a user card with:
- course, branch, year, semester
- bookmarked papers (count + list)
- submissions summary (count + status chips)

**Suggested content**: optional and must stay simple.
- V1 rule: “Suggested papers” = papers matching the user’s `course/branch/semester`.
- If it becomes a headache, omit it entirely and only show “Browse your semester”.

### 6) Bookmarks

- Bookmark entire papers (V1).
- (Optional V1.1) Bookmark individual questions.

### 7) Upload → Admin Inbox (no OCR)

#### Student submission (`/upload`)
- Signed-in users upload a PDF/image as a **Submission**.
- They can optionally add minimal metadata (course/semester/year/subject) as a hint.
- Status: `pending` by default.

#### Admin Inbox (`/admin/inbox`)
- Admin sees all pending submissions.
- Admin can:
  - Reject with reason
  - Convert submission to an approved paper by manually entering:
    - paper metadata
    - questions
    - answers (optional; can be added later)

### 8) Admin Paper Editor (`/admin/papers/:paperId/edit`)

- Add/edit/delete questions.
- Add/edit answers per question.

---

## Data Model (MongoDB)

### `UserProfile` (local mirror of Clerk + academic profile)

```
{
  _id: ObjectId,
  clerkUserId: string,      // unique
  email: string,
  name: string,
  course: string,           // e.g. "btech"
  branch: string,           // e.g. "cse"
  year: number,             // e.g. 2026
  semester: number,         // 1-8
  bookmarkedPaperIds: [ObjectId],
  createdAt: date,
  updatedAt: date
}
```

### `Submission` (uploaded docs that admin converts)

```
{
  _id: ObjectId,
  uploaderClerkUserId: string,
  uploaderEmail: string,
  hint: {
    course?: string,
    branch?: string,
    semester?: number,
    year?: number,
    subject?: string
  },
  fileUrl: string,
  originalFilename: string,
  mimeType: string,
  status: "pending" | "rejected" | "converted",
  rejectReason?: string,
  adminNotes?: string,
  convertedPaperId?: ObjectId,
  createdAt: date,
  updatedAt: date
}
```

### `Paper`

```
{
  _id: ObjectId,
  title: string,
  course: string,
  branch: string,
  semester: number,
  subject: string,
  subjectCode?: string,
  year: number,
  month?: string,
  paperType: string,        // "endsem" | "periodic" | "model"
  sourceSubmissionId?: ObjectId,
  status: "draft" | "approved",
  createdAt: date,
  updatedAt: date
}
```

### `Question`

```
{
  _id: ObjectId,
  paperId: ObjectId,
  questionNumber: string,   // "1", "1a", "2b"...
  text: string,
  marks?: number,
  module?: number,
  part?: string,
  createdAt: date,
  updatedAt: date
}
```

### `Answer` (optional in V1, first-class model for easy editing)

```
{
  _id: ObjectId,
  questionId: ObjectId,
  answerText: string,
  source: "admin_manual",   // future: "ai" etc
  createdAt: date,
  updatedAt: date
}
```

---

## Routes (Pages)

- `GET /` Landing
- `GET /browser` Archive browse
- `GET /search` Search experience
- `GET /paper/:paperId` Paper view
- `GET /dashboard` Signed-in landing page
- `GET /upload` Submission form (auth required)

### Admin (auth + admin-only)

- `GET /admin` Admin home
- `GET /admin/inbox` Submissions inbox
- `GET /admin/papers` Paper list
- `GET /admin/papers/:paperId/edit` Paper editor (questions/answers)

---

## Routes (API)

- `GET /api/papers` list approved papers (filters + pagination)
- `GET /api/papers/:paperId` paper + questions (+ answers if requested)
- `GET /api/search?q=` search papers/questions
- `POST /api/bookmarks/papers/:paperId` toggle bookmark (auth required)

### Submissions

- `POST /api/submissions` create submission (multipart) (auth required)
- `GET /api/submissions/me` list own submissions (auth required)

### Admin

- `GET /api/admin/submissions?status=pending` list submissions
- `POST /api/admin/submissions/:submissionId/reject` reject
- `POST /api/admin/submissions/:submissionId/convert` convert submission → create `Paper` + `Question`s (+ optional `Answer`s)

---

## Project Structure (Express + EJS + Vite)

```
paperboyy/
├── .cursorrules
├── .env
├── package.json
├── README.md
├── vite.config.(js|ts)
├── src/
│   ├── server.(js|ts)                 # server bootstrap
│   ├── app.(js|ts)                    # express app wiring
│   ├── config/
│   │   ├── env.(js|ts)                # env parsing/validation
│   │   ├── db.(js|ts)                 # mongodb connection
│   │   └── clerk.(js|ts)              # clerk config helpers
│   ├── middleware/
│   │   ├── requireAuth.(js|ts)        # Clerk auth guard
│   │   ├── requireAdmin.(js|ts)       # admin guard (by Clerk user id)
│   │   ├── asyncHandler.(js|ts)       # wraps async routes
│   │   ├── notFound.(js|ts)           # 404 handler
│   │   └── errorHandler.(js|ts)       # 500 handler (html + api json)
│   ├── models/
│   │   ├── UserProfile.(js|ts)
│   │   ├── Submission.(js|ts)
│   │   ├── Paper.(js|ts)
│   │   ├── Question.(js|ts)
│   │   └── Answer.(js|ts)
│   ├── routes/
│   │   ├── pages/                     # EJS pages
│   │   │   ├── public.(js|ts)         # /, /browser, /search, /paper/:id
│   │   │   ├── auth.(js|ts)           # /dashboard, /upload
│   │   │   └── admin.(js|ts)          # /admin/*
│   │   └── api/
│   │       ├── papers.(js|ts)
│   │       ├── search.(js|ts)
│   │       ├── bookmarks.(js|ts)
│   │       ├── submissions.(js|ts)
│   │       └── admin.(js|ts)
│   ├── services/
│   │   ├── storage.(js|ts)            # cloud upload helpers
│   │   ├── papers.(js|ts)             # query helpers
│   │   └── submissions.(js|ts)        # convert workflow
│   ├── views/
│   │   ├── layouts/
│   │   │   └── base.ejs
│   │   ├── partials/
│   │   │   ├── head.ejs
│   │   │   ├── navbar.ejs
│   │   │   ├── footer.ejs
│   │   │   └── scripts.ejs            # vite dev/prod loader
│   │   ├── pages/
│   │   │   ├── landing.ejs
│   │   │   ├── browser.ejs
│   │   │   ├── search.ejs
│   │   │   ├── paper.ejs
│   │   │   ├── dashboard.ejs
│   │   │   └── upload.ejs
│   │   └── errors/
│   │       ├── 404.ejs
│   │       └── 500.ejs
│   └── public/
│       ├── assets/
│       └── favicon.ico
└── ui/
    ├── main.css                        # tailwind entry
    └── main.js                         # small client JS if needed
```

---

## Error Handling (must-have)

### Page errors
- Unknown route → render `views/errors/404.ejs`
- Unexpected error → render `views/errors/500.ejs`

### API errors
- For `/api/*`, return JSON in a consistent shape:

```
{
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable message",
    "requestId": "uuid-or-short-id"
  }
}
```

### Safety
- No unhandled rejections.
- Every async route must be wrapped with `asyncHandler`.

---

## EJS Partials (required)

- `views/layouts/base.ejs`: outer HTML skeleton
- `views/partials/head.ejs`: meta, fonts, Tailwind/Vite css
- `views/partials/navbar.ejs`: top nav
- `views/partials/footer.ejs`: footer
- `views/partials/scripts.ejs`: Vite dev/prod scripts loader

---

## Design Implementation Notes (from design references)

- Monochrome palette, no gradients/shadows, sharp corners.
- Engineering grid background (minor 8px, major 32px).
- Typography: Public Sans, heavy uppercase headings.
- Hover/active states are **inversion** (white ↔ black).
- Use the nav/hero/search/archive-card patterns from `extras/code.html`.

---

## Cursor Prompts (Rebuild Runbook)

Use these prompts in order when rebuilding the codebase.

### Prompt 1 — Scaffold (Express + EJS + Vite + Tailwind)

```
Read .cursorrules fully. Scaffold Paperboyy using Express + EJS with routes
/, /browser, /search, /paper/:paperId, /dashboard, /upload, /admin/*.
Set up Vite + Tailwind so EJS pages load compiled CSS/JS.
Create the EJS layout + partials (head/navbar/footer/scripts) and wire them.
Do not implement business logic yet; only structure + minimal health route.
```

### Prompt 2 — Database + Models

```
Add Mongoose connection and implement models:
UserProfile, Submission, Paper, Question, Answer.
Add indexes for common queries (paper filters, submission status, clerkUserId).
```

### Prompt 3 — Clerk Auth + Dashboard Redirect

```
Implement Clerk verification middleware for Express.
Ensure signed-in users get redirected to /dashboard after sign-in.
Create /dashboard page showing the user card (course/branch/year/semester),
bookmarks, and submissions summary.
```

### Prompt 4 — Browse + Search (Server pages + API)

```
Implement /browser and /search pages matching the provided design language.
Implement /api/papers and /api/search with filters and pagination.
```

### Prompt 5 — Paper Viewer

```
Implement /paper/:paperId page and /api/papers/:paperId endpoint.
Render questions list and show answers if present.
```

### Prompt 6 — Bookmarks

```
Implement bookmarking of papers (toggle) and show bookmarks in /dashboard.
```

### Prompt 7 — Submissions (Upload → Admin Inbox)

```
Implement /upload (signed-in) to create a Submission with file upload.
Store file in Cloudinary (or stub storage service with placeholders).
Implement /admin/inbox to list pending submissions.
Implement admin convert flow: submission -> create Paper + Questions (+ Answers).
```

### Prompt 8 — Admin Paper Editor

```
Implement /admin/papers and /admin/papers/:paperId/edit.
Allow admin to add/edit/delete questions and edit answers.
```

### Prompt 9 — Error Handling + Polish

```
Add custom 404/500 EJS pages and centralized error middleware.
Ensure /api/* errors follow the standard JSON shape.
Ensure EJS partials are used everywhere (no duplicated boilerplate).
Avoid emojis.
```

