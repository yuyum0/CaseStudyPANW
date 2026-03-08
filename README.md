# SkillSync

AI-assisted career navigation platform that helps early-career technical candidates understand the gap between their current skills and the requirements of a target technical role.

SkillSync analyzes a candidate's profile (resume text, GitHub-style summary, or experience description) and compares it against role requirements or a job description. The system then generates a clear roadmap of next steps including skills to learn, projects to build, learning resources, and mock interview questions.

The goal is to convert an ambiguous career goal into a **concrete, actionable development path**.

---

# Demo

Link

---

# Quick Start

1. `npm install`
2. Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` if you want AI recommendations.
3. `npm run dev` then open http://localhost:3000

## Run Commands

- `npm run dev` – Start Next.js dev server
- `npm run build` – Production build
- `npm run start` – Start production server
- `npm run lint` – Run ESLint

## Test Commands

- `npm test` – Run Vitest once
- `npm run test:watch` – Run Vitest in watch mode

## Testing

Tests are written with **Vitest** and live in `__tests__/`. There are two suites:

### Types of tests

| Type | File | What it tests |
|------|------|----------------|
| **Unit** | `parser.test.ts` | The `extractSkillsFromProfile` function in isolation—no API, no mocks. |
| **Integration** | `analyze.test.ts` | The full `POST /api/analyze` route: request → validation → parsing → recommendation (AI or fallback) → response. The route handler is invoked directly with a `Request` object. |

- **Unit test:** One function, controlled input, assert on output. Fast and easy to reason about.
- **Integration test:** The real API path runs end-to-end (Zod validation, parser, role lookup, fallback when no API key). No server is started; we call the exported `POST` with a fake `Request`. When `OPENAI_API_KEY` is unset (e.g. in CI), the fallback path runs, so tests are deterministic and free of API calls.

### What each suite covers

**`parser.test.ts`**
- **Happy path:** Profile text that mentions known skills (e.g. Python, SQL, React, Git) → parser returns those skills.
- **Edge case:** Empty profile string → parser returns an empty array.

**`analyze.test.ts`**
- **Happy path:** Valid `profileText` and `targetRole` → 200 response with `extractedSkills`, `matchedSkills`, `missingSkills`, `roadmap`, `projects`, `learningRecommendations`, `interviewQuestions`, and `usedFallback`. Asserts that expected skills appear and the response shape is complete.
- **Edge case:** Empty `profileText` (invalid input) → 400 response with an `error` message. This exercises **Zod validation**: the schema requires non-empty profile text, so the API rejects the request and returns a clear error instead of proceeding.

See [Tradeoffs.md](./Tradeoffs.md) for design decisions, limitations of the rules-based fallback, and future directions (vector DBs, security).

---

# Scenario Chosen

**Skill-Bridge Career Navigator**

This system helps early-career professionals understand how to move from their current skill set to a desired technical role.

Target audiences include:

- Recent graduates
- Career switchers
- Mentors guiding mentees

---

# Problem Statement

Students and early-career professionals often find a "skills gap" between
their academic knowledge and the specific technical requirements of job postings. Navigating multiple job boards and certification sites makes it difficult to see a clear path from their current skill set to their "dream role."

Common issues include:

| Challenge | Impact |
|---|---|
| Unclear skill requirements for jobs | Candidates don't know what to learn next |
| Generic career advice | Recommendations lack relevance |
| Difficulty interpreting job descriptions | Hard to translate job listings into actionable skills |
| Fragmented learning resources | Courses and certifications are scattered |

Even when candidates know their desired role, they often lack a clear answer to:

> "What should I do next to become competitive for this role?"

---

# Solution

SkillSync converts unstructured career information into structured development guidance.

The system:

1. Parses candidate profiles
2. Extracts technical skills
3. Parses job descriptions
4. Identifies skill gaps
5. Generates a personalized roadmap

Outputs include:

- skill gap analysis
- prioritized learning roadmap
- recommended projects to implement
- learning or certification suggestions
- mock interview questions for specific roles

---

# System Architecture

```
User Interface (Next.js Dashboard)
↓
Skill Parsing + Gap Analysis
↓
Recommendation Engine (AI + Fallback)
```

---

# Tech Stack

**Frontend**

- Next.js (React)
- TypeScript
- Tailwind CSS

**Backend**

- Next.js API routes
- OpenAI API for roadmap generation

**Data Layer**

- Local JSON datasets
- Synthetic job descriptions
- Synthetic user profiles

**Testing**

- Vitest

**Validation**

- Zod

---

# Core Features

## Profile Parsing

Users paste:

- resume text
- GitHub-style summary
- technical experience

The system extracts skills such as:

- Python
- SQL
- React
- Docker

---

## Skill Gap Analysis

The system compares:

- `candidateSkills` vs `jobRequirements`

Results are categorized as:

| Category | Description |
|---|---|
| matchedSkills | Skills already possessed |
| missingSkills | Skills required but absent |
| optionalSkills | Beneficial but not required |

---

## AI-Generated Career Roadmap

Using structured inputs, the AI generates:

- prioritized learning steps
- project suggestions
- learning recommendations
- mock interview questions

Example roadmap:

1. Learn feature engineering techniques
2. Build a machine learning pipeline
3. Deploy a model using FastAPI
4. Study experiment tracking tools

---

## Mock Interview Questions

Interview questions are tailored to the candidate's skill gaps.

Example:

- What techniques can be used for feature engineering in tabular datasets?
- How would you deploy a trained machine learning model as an API?
- Explain the bias-variance tradeoff.
- What tools are used for machine learning experiment tracking?
- How would you evaluate a classification model before deployment?

---

# AI Integration

SkillSync uses AI only for the **recommendation layer**.

The deterministic system performs:

- skill extraction
- job requirement parsing
- skill comparison

AI is used for:

- roadmap generation
- project ideas
- learning suggestions
- interview questions

Structured prompt example:

```
targetRole: Machine Learning Engineer
candidateSkills: ["Python","SQL"]
missingSkills: ["Feature Engineering","Model Deployment"]
```

---

# Fallback System

If the AI service fails, SkillSync switches to deterministic logic.

Fallback logic includes:

- keyword skill matching
- predefined project suggestions
- role-based recommendation datasets

Example fallback recommendation:

> Build a feature engineering pipeline using a Kaggle dataset.

This ensures the application remains functional even without AI.

---

# Data Model

## Role Model

```ts
export type Role = {
  id: string;
  name: string;
  requiredSkills: string[];
  preferredSkills: string[];
  certifications: string[];
  interviewTopics: string[];
};
```

## Learning Resource Model

```ts
export type LearningResource = {
  skill: string;
  type: "course" | "project" | "certification";
  title: string;
  difficulty: "beginner" | "intermediate";
  estimatedHours?: number;
};
```

## Skill Analysis Output

```ts
export type SkillAnalysis = {
  extractedSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  roadmap: string[];
  projects: string[];
  learningRecommendations: string[];
  interviewQuestions: string[];
};
```


## AI Disclosure

- **Where AI is used:** The OpenAI API (gpt-4o-mini) is used only for the recommendation layer: roadmap, project ideas, learning/certification suggestions, and mock interview questions. Skill extraction and role matching are rule-based.
- **API key:** Set `OPENAI_API_KEY` in `.env.local` and ensure it is valid. If the key is missing or the API call fails, the app uses a rule-based fallback. The results page shows why fallback was used (`api_key_missing` or `api_error`); server logs show the actual error when the API fails.
- **Fallback:** Rule-based fallback uses keyword matching and local data from `data/roles.json` and `data/resources.json`.
