# SkillSync: Design Tradeoffs & Future Directions

This document explains the key design decisions, limitations, and future improvements for SkillSync.

---

## 1. Rules-Based Fallback: Why and How

### Why a Rules-Based Fallback?

SkillSync uses a **dual-path architecture**:

- **Primary:** OpenAI (GPT-4o-mini) for personalized recommendations when `OPENAI_API_KEY` is set.
- **Fallback:** A rules-based engine that runs when the API key is missing or the AI call fails.

**Reasons for the fallback:**

1. **Demo and CI-friendly** – The app works without any API key. Reviewers can run it locally and see results immediately. Tests run deterministically without calling OpenAI.
2. **Cost and reliability** – No ongoing API costs when the key is unset. No dependency on external service availability for the core flow.
3. **Baseline quality** – Even without AI, users get extracted skills, matched/missing skills, a roadmap, project ideas, learning recommendations, and interview questions from static role and resource data.
4. **Graceful degradation** – If the API fails (rate limits, downtime, invalid key), the app still returns useful output instead of an error screen.

### How the Rules-Based Fallback Works

1. **Skill extraction** – The same parser used for AI: substring matching against a known skill list (from roles and resources). The profile text and GitHub summary are concatenated and lowercased; any known skill that appears as a substring is extracted.
2. **Matching** – Extracted skills are compared to the role’s required and preferred skills. Matched = overlap; missing = role skills not in extracted.
3. **Recommendations** – Projects, courses, and certifications are pulled from role definitions (`roles.json`) and skill resources (`resources.json`). The fallback builds generic roadmap steps (e.g., “Assess your gap”, “Build foundation in X”, “Learn and build in parallel”, “Practice for interviews”) and fills in concrete projects and courses based on missing skills.
4. **Score** – A simple ratio: `(matched / totalRoleSkills) * 10`, clamped to 0–10.

---

## 2. Limitations of the Rules-Based Approach

### Skill Extraction

- **Literal matching only** – Skills are found by checking if the exact phrase exists in the text. “Worked with PyTorch for ML” matches “PyTorch” and “Machine Learning”, but “deep learning frameworks” or “neural networks” do not map to “PyTorch” unless those words appear literally.
- **No synonyms or paraphrasing** – “RESTful APIs” and “REST APIs” might both be in the known list, but “RESTful” alone may not match “REST APIs”. The parser does not understand that “API development” implies REST experience.
- **Fixed vocabulary** – Only skills in the known list are detected. New technologies or niche skills (e.g., “GraphQL”, “gRPC”) must be added manually to the data files.
- **No context or depth** – “Used Python for scripts” and “Led Python backend architecture” are treated the same. There is no notion of seniority, depth, or relevance.

### Recommendations

- **Generic, template-driven** – Roadmap steps and takeaways are templated (e.g., “Build foundation in {skill}”). They are not tailored to the specific profile the way AI responses can be.
- **Static resource pool** – Projects and courses come from JSON. They don’t adapt to the candidate’s background or recent trends; they are role- and skill-based only.
- **No holistic assessment** – The score is purely skill-overlap based. It does not consider narrative, years of experience, or project complexity.

### Summary Table

| Aspect              | Rules-based behavior                        | Limitation                                            |
|---------------------|---------------------------------------------|-------------------------------------------------------|
| Skill detection     | Substring match against known list          | No semantics; synonyms and paraphrases missed         |
| Scoring             | `matched / total` ratio                     | No context, seniority, or narrative understanding      |
| Roadmap             | Template steps per missing skill            | Not personalized beyond missing skills                |
| Projects/courses    | From role + resources JSON                  | Static; no semantic or relevance ranking              |

---

## 3. Future Direction: Vector Databases and Semantic Search

A natural next step is to replace or augment rules-based parsing with **semantic search** and **embeddings**, backed by a **vector database**.

### Why Vector DBs?

- **Meaning over keywords** – Embeddings capture meaning. “Built APIs with FastAPI” and “REST API development in Python” can be close in vector space, even without shared keywords.
- **Similarity search** – Instead of exact substring matching, we can embed the profile and job requirements and retrieve the most relevant skills, roles, and resources by similarity.
- **Evolving vocabulary** – New skills and roles can be added without hardcoding every synonym; the model’s embeddings handle variation.

### Possible Design

1. **Embed roles, skills, and resources** – Precompute embeddings for each role definition, skill, and resource. Store in a vector DB (e.g., Pinecone, pgvector, Chroma).
2. **Embed candidate profiles** – At analysis time, embed the profile text and optional GitHub summary.
3. **Retrieve by similarity** – Run k-NN search to find the most relevant skills, roles, and resources for the candidate.
4. **Rank and recommend** – Use similarity scores to rank recommendations and generate roadmaps instead of pure substring matching and static lookup.

This would reduce reliance on rigid rules while improving relevance and handling paraphrasing.

---

## 4. Security Considerations

### Current State

- **No user authentication** – The app is anonymous. Anyone with access to the URL can use it.
- **No persistent storage** – Results are stored only in `localStorage` in the browser. No data is sent to a database. Each session is independent.
- **Input handling** – Profile text, GitHub summary, and file uploads are validated (Zod for JSON, file type/size checks for uploads). PDF/text parsing uses `pdf-parse`, which processes binary content.
- **API key handling** – `OPENAI_API_KEY` is read from the server environment (e.g., `.env.local`). It is not exposed to the client. Requests to OpenAI are made server-side only.
- **File upload limits** – PDF and text uploads are capped (e.g., 5 MB) to limit resource usage and denial-of-service risk.
- **Rate limiting** – `/api/analyze` and `/api/parse-resume` are rate limited per IP (in-memory, fixed window). Analyze: 10 requests per minute; parse-resume: 15 per minute. Returns 429 with `Retry-After` when exceeded.

### Risk Profile

| Risk                    | Current mitigation                          | Remaining concern                                  |
|-------------------------|---------------------------------------------|----------------------------------------------------|
| PII in resumes          | Data stays in browser/localStorage           | User could paste sensitive data; not stored server-side |
| API key exposure        | Server-side only                            | Low if env vars are not committed                  |
| Malicious PDFs          | `pdf-parse` library; standard PDF parsing   | Supply-chain and parsing vulnerabilities possible  |
| Unauthenticated abuse   | Per-IP rate limiting on API routes          | In-memory limits are per instance in serverless   |

### How to Secure Further (If Users Retain Data)

If the app later stores user data (e.g., saved analyses, history):

1. **User authentication** – Add auth (e.g., NextAuth, Clerk, Auth0) so only signed-in users can save or access data.
2. **Authorization** – Tie saved analyses to user IDs; users see only their own data.
3. **Data persistence** – Store results in a database (Postgres, etc.) instead of `localStorage`. Encrypt sensitive fields if needed.
4. **Audit and retention** – Define retention and deletion policies for resume/profile data.
5. **Rate limiting** – For multi-instance deployments, use a shared store (e.g. Redis) so limits are global per IP/user.
6. **Input sanitization** – Sanitize and validate all user input to reduce injection and parsing risks.

---

## 5. Summary

| Topic          | Current approach              | Limitation                         | Future direction                          |
|----------------|-------------------------------|------------------------------------|-------------------------------------------|
| Recommendations| AI when key set; else rules   | Rules are literal and generic      | Vector DB + semantic search                |
| Skill parsing  | Substring match on known list | No semantics; synonyms missed     | Embeddings and similarity search           |
| Data storage   | `localStorage` only           | No history; session-scoped         | DB + auth for saved analyses               |
| Security       | No auth; per-IP rate limiting on API | No per-user controls               | Auth, encrypted storage, Redis for global rate limits     |

SkillSync is designed as a prototype that works without external dependencies and remains testable and demo-friendly. The rules-based fallback provides a useful baseline; future iterations can improve quality with semantic search and better security with auth and proper data storage.
