# Interview Master

InterviewAI — Master Build Prompt (for Lovable / Replit / Emergent)

Copy everything below into your AI builder of choice. This is a single, self-contained specification for a production-quality MVP.

0. ROLE INSTRUCTION FOR THE BUILDER AI

You are a senior full-stack product engineer and UI/UX designer. Before writing any code:

Analyze this entire prompt.

Identify any missing requirements or ambiguities and make sensible, clearly-stated assumptions (do not stall waiting for clarification).

Finalize the architecture based on the stack specified below.

Build a working, polished MVP — not placeholder/lorem-ipsum screens. Every screen must be functionally wired, not just visually mocked.

Prioritize a genuinely premium, modern AI-SaaS look and feel over generic templated UI.

1. PRODUCT OVERVIEW

Product name (placeholder): InterviewAI Tagline: "Practice Interviews. Get Better. Get Hired."

InterviewAI is an AI-powered mock interview platform. A candidate selects a role and interview type, and an AI interviewer conducts a realistic, adaptive interview — asking questions, generating dynamic follow-ups based on the candidate's actual answers, adjusting difficulty in real time, and finally producing a detailed performance report with category-wise scores and improvement recommendations.

MVP focus: MERN Stack / Full Stack Developer interviews (Technical, HR, Mixed, and Project/Resume-based). Architecture must be generic enough to expand to other IT roles later without rework.

Out of scope for MVP (build the architecture to support these later, but do not build them now): voice interview (speech-to-text/text-to-speech), live coding editor, webcam recording, company-specific interview modes (Google/Amazon-style), job-description-driven interviews. Leave clean extension points for these.

2. TECH STACK (do not deviate)

Frontend: React.js + Vite, Tailwind CSS, React Router, Axios, Framer Motion (for animations), Lucide React (icons)

Backend: Node.js + Express.js

Database: MongoDB + Mongoose

Auth: JWT + bcrypt (email/password signup & login)

AI Layer: Provider-agnostic abstraction — the frontend must NEVER call the AI provider directly, and no API key may ever be exposed client-side. All AI calls go through the backend.

/backend
  /ai
    aiProvider.js        <- swappable adapter (OpenAI / Claude / Gemini)
    interviewer.js        <- orchestrates the interview flow/state machine
    questionGenerator.js  <- generates next question given context
    evaluator.js          <- scores/analyzes candidate answers
    promptTemplates.js    <- all system prompts, centralized


Deployment target: Frontend on Vercel, backend on Render, DB on MongoDB Atlas (structure the code to deploy cleanly to these, using environment variables for all secrets/URLs).

3. INFORMATION ARCHITECTURE / PAGES

Public:

Landing Page

Features

How It Works

Login

Signup

Authenticated:

Dashboard (overview: recent interviews, avg score, quick "Start Interview" CTA)

Start Interview (role + interview-type + experience + difficulty + duration configuration)

Interview Room (the live chat/interview interface)

Interview Result (post-interview report)

Interview History (list + progress graph)

Profile / Settings

Resume Upload (stores resume text; used to enrich Project-Based interviews later)

Practice Topics (browse topics without a full formal interview — lighter "Practice Mode")

Admin (protected, role-gated):

Admin Panel to Add / Edit / Delete interview questions in the question bank (category, difficulty, expected concepts, evaluation criteria) — no redeploy needed to update content.

4. UI / UX DIRECTION

Do NOT build a generic "edtech" look. Build a modern AI SaaS product aesthetic:

Theme: dark navy / near-black background, purple-to-blue AI-accent gradients

Style: glassmorphism cards, clean modern typography (e.g. Inter/Satoshi-style), generous whitespace, subtle gradient glows behind key elements, soft shadows

Motion: smooth, purposeful micro-animations on load, hover, and state transitions (Framer Motion) — never gratuitous

Restraint: premium and confident, not flashy or over-decorated. The user should feel "this is a serious, professional AI product," not a toy.

Responsive: fully responsive across mobile, tablet, desktop — the Interview Room chat interface especially must work cleanly on mobile.

Empty/loading/error states: design real, polished states for every screen (empty history, interview loading, network error, AI-thinking indicator) — not blank screens.

Key screen details

Landing Page: Hero with headline + subheadline + primary CTA ("Start Mock Interview") + secondary CTA ("How It Works"). Below the fold: feature highlights (adaptive AI questions, real-time scoring, resume-based interviews, progress tracking), a "How It Works" 3–4 step visual, and a final CTA section.

Interview Room: Chat-style interface. AI interviewer messages appear on the left with a distinct avatar/badge; candidate answers on the right. A text input area at the bottom (voice button visually present but disabled/"coming soon" for MVP — do not wire it up). Show a subtle "AI is thinking" typing indicator between question and follow-up. Keep a persistent but unobtrusive progress indicator (e.g. question count / time elapsed).

Interview Result: Large overall score (e.g. circular progress ring), a category breakdown table/bar chart (Technical Knowledge, Problem Solving, Communication, and per-topic scores like JavaScript/React/Node.js/MongoDB), an AI-written narrative feedback paragraph, then three lists: Strengths, Areas to Improve, Recommended Practice Topics.

Interview History: List of past interviews (role, type, date, score) plus a line graph showing score progression over time.

5. DATABASE SCHEMA (MongoDB / Mongoose)

User

name, email (unique), passwordHash, role (user | admin), resumeText (optional), createdAt

Question

text, category (e.g. JavaScript, React, Node.js, MongoDB, HTML/CSS, System Design, HR, Behavioral), difficulty (easy | medium | hard), expectedConcepts (array of strings), evaluationCriteria (array of strings), interviewType (technical | hr | mixed | project), createdBy (admin ref)

Interview

userId (ref), role, experienceLevel (fresher | 0-1 | 1-3 | 3-5), interviewType, difficultyMode (easy | medium | hard | adaptive), durationMinutes, status (in_progress | completed | abandoned), startedAt, completedAt

InterviewMessage (the conversation log for one interview)

interviewId (ref), sender (ai | candidate), messageText, questionCategory, difficultyAtTime, createdAt

InterviewResult

interviewId (ref), overallScore (0–100), categoryScores (map of category → score), strengths (array), areasToImprove (array), recommendedTopics (array), aiFeedbackSummary (text)

6. AI INTERVIEW ENGINE — CORE LOGIC (this is the heart of the product)

Build this as a clear state machine on the backend, not ad-hoc prompt calls:

Interview Configuration
        ↓
Question Generation  (topic-weighted, difficulty-aware, avoids repeats)
        ↓
Candidate Answer submitted
        ↓
Answer Analysis        (correctness, depth, clarity — via AI provider)
        ↓
Difficulty Adjustment  (if adaptive mode: strong answer → escalate difficulty;
                         weak/vague answer → hold or step down)
        ↓
Follow-up Question     (AI decides: probe deeper on same topic, OR move to
                         next topic — based on the answer just given)
        ↓
Repeat until duration/question-count limit reached
        ↓
Final Evaluation       (aggregate all Q&A into category scores + narrative feedback)


Follow-up questions must be genuinely dynamic — generated from the candidate's actual last answer via the AI provider, not picked from a static tree. Example: if candidate says "I used JWT" → AI should follow up "Where did you store the token, and why?" and then push further based on THAT answer.

Difficulty adjustment (adaptive mode): track a running per-topic and overall performance signal; use it to bias the next question's difficulty.

System prompts (in promptTemplates.js) must define, per interview type:

interviewer persona and tone (professional, encouraging but rigorous — never rude, never gives away answers during Interview Mode)

which topics to draw from

how to decide "probe deeper" vs "move on"

how to score an answer against expectedConcepts / evaluationCriteria

when to end the interview

distinct behavior for Interview Mode (no hints, evaluative) vs. Practice Mode (tutor-style, gives hints/nudges) — build Practice Mode as a lighter, separate flow reachable from "Practice Topics"

Resume-based / Project interviews: when the user has uploaded a resume, extract key project/tech mentions and feed them into the question-generation prompt so questions reference the candidate's actual stated experience (e.g. "You mentioned building an e-commerce app with MERN — how did you implement authentication?").

7. API DESIGN (Express)

Design clean REST endpoints, roughly:

POST /api/auth/signup, POST /api/auth/login, GET /api/auth/me

POST /api/interviews — create/configure a new interview

POST /api/interviews/:id/message — submit candidate answer, get next AI question back

POST /api/interviews/:id/complete — end interview, trigger final evaluation

GET /api/interviews — list user's interview history

GET /api/interviews/:id/result — get the result report

POST /api/resume — upload/parse resume text

GET /api/questions (admin) / POST /api/questions (admin) / PUT /api/questions/:id (admin) / DELETE /api/questions/:id (admin)

All routes except auth/signup/login must be protected by JWT middleware; admin routes additionally gated by role check.

8. NON-FUNCTIONAL REQUIREMENTS

No AI provider API key ever appears in frontend code or network responses.

Handle AI provider errors gracefully (retry once, then show a friendly in-chat error, never a raw crash).

Loading states for every async action (question generation, evaluation, page loads).

Form validation with clear inline error messages (signup/login/interview config).

Basic rate-limiting / abuse protection on the message endpoint (an interview shouldn't allow unlimited spam messages).

Clean, componentized React code (no giant single-file pages); shared UI primitives (Button, Card, Badge, Modal, ScoreRing, ProgressBar) built once and reused everywhere.

9. BUILD ORDER (build in this sequence, confirm each step renders/works before moving on)

Design system: Tailwind theme config (colors, fonts, spacing) + shared UI components

Public pages: Landing, Features, How It Works

Auth: Signup, Login, JWT flow

Dashboard shell + navigation

Start Interview configuration flow

Backend: DB schemas + AI engine (aiProvider.js stubbed to a single provider first, e.g. OpenAI) + interview API endpoints

Interview Room (live chat UI wired to backend)

Final evaluation logic + Interview Result page

Interview History page + progress graph

Resume upload + Project-based interview question enrichment

Admin Panel (question bank CRUD)

Polish pass: animations, empty/error states, responsive QA

10. FUTURE ROADMAP (do not build now — just don't architect against it)

Voice interview (Speech-to-Text → LLM → Text-to-Speech)

Live coding round with embedded code editor

Webcam-based interview + communication analysis

Company-specific interview styles (Google/Amazon/Microsoft/startup)

Job-description-driven custom interviews

Fine-tuning a custom model (only if a large anonymized dataset justifies it later)

Build the MVP now, end-to-end, with real working functionality — not a static design mockup.  please ui achha banana

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/136542f6-44e8-4b70-95e2-58f61676ab08).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
