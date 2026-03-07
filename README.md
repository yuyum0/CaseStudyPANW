# SkillSync – Career Navigation for Early-Career Candidates

**Candidate Name:** [Your Name]  
**Scenario Chosen:** Skill-Bridge Career Navigator  
**Estimated Time Spent:** [X hours]

## Quick Start

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

## AI Disclosure

- **Where AI is used:** The OpenAI API (gpt-4o-mini) is used only for the recommendation layer: roadmap, project ideas, learning/certification suggestions, and mock interview questions. Skill extraction and role matching are rule-based.
- **API key:** Set `OPENAI_API_KEY` in `.env.local` and ensure it is valid. If the key is missing or the API call fails, the app uses a rule-based fallback. The results page shows why fallback was used (`api_key_missing` or `api_error`); server logs show the actual error when the API fails.
- **Fallback:** Rule-based fallback uses keyword matching and local data from `data/roles.json` and `data/resources.json`.

## Tradeoffs & Prioritization

- Single flow, synthetic data only, no auth or database.
- AI only for recommendations; fallback when key missing or API fails.

## Known Limitations

- Skill extraction is keyword-based. Fallback recommendations are less personalized than AI.

## Future Improvements

- Broader skill synonyms, save/export analysis, optional job description comparison.
