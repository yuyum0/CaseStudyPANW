import type {
  AnalysisResult,
  LearningRecommendation,
  ProjectRecommendation,
  RoadmapStep,
} from "./types";

const SYSTEM_PROMPT = `You are a senior resume reviewer and technical recruiter at a big tech company (e.g. FAANG). You evaluate candidate profiles for fit against specific engineering roles. Given a target role, the role's required and preferred skills, and the candidate's parsed resume/profile data, respond with a JSON object only (no markdown, no code fence) with these exact keys:

- roadmapSteps: array of 4-6 ordered steps. Each step is an object with:
  - step: short label (e.g. "Assess your gap")
  - goal: what the user achieves at this step (one sentence)
  - howItHelps: how this step moves them toward the role (1 sentence)
  - takeaway: one concrete, actionable takeaway the user can use immediately

- projects: array of exactly 3 concrete project ideas. Each is an object with:
  - name: project title or idea (e.g. "Build a REST API for a task manager")
  - takeaway: what the user will learn or prove from this project (1 sentence)
  - howToFindOrUse: 1-2 sentences on where to find a tutorial, starter repo, or how to approach it (e.g. "Search 'FastAPI task API tutorial' or use the official FastAPI docs; start with a single GET/POST endpoint and add auth later.")

- learningRecommendations: array of exactly 3 learning or certification suggestions. Each is an object with:
  - name: course or cert name (e.g. "AWS Cloud Practitioner Essentials")
  - takeaway: what skill or credential the user gains (1 sentence)
  - howToFindOrUse: 1-2 sentences on where to find it and how to use it (e.g. "Free on AWS Skill Builder; take the practice exam before the paid certification.")

- interviewQuestions: array of exactly 5 mock interview questions (strings), specific to the target role.

- score: a number from 0 to 10 representing your assessment of how likely this candidate would succeed in the target role at a big tech company. Act as a recruiter: evaluate their resume/profile holistically—skills alignment, experience depth, project relevance, and gaps. 0 = would not advance past resume screen; 10 = strong hire signal, likely to succeed. Be rigorous but fair.

- personalizedFeedback: a string of 2–3 sentences written as a recruiter giving feedback after reviewing their resume. Compare their profile to the role requirements. Mention specific strengths, critical gaps, and your honest assessment of where they stand (e.g. "close to interview-ready", "significant ground to cover"). Be encouraging but direct.

Be practical and specific. For howToFindOrUse, name real platforms (Coursera, Udemy, official docs, YouTube) when relevant. Keep each field concise but useful.`;

function normalizeRoadmapStep(raw: unknown): RoadmapStep | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const step = typeof o.step === "string" ? o.step : "";
  const goal = typeof o.goal === "string" ? o.goal : "";
  const howItHelps = typeof o.howItHelps === "string" ? o.howItHelps : "";
  const takeaway = typeof o.takeaway === "string" ? o.takeaway : "";
  if (!step) return null;
  return { step, goal, howItHelps, takeaway };
}

function normalizeProject(raw: unknown): ProjectRecommendation | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name : "";
  const takeaway = typeof o.takeaway === "string" ? o.takeaway : "";
  const howToFindOrUse = typeof o.howToFindOrUse === "string" ? o.howToFindOrUse : "";
  if (!name) return null;
  return { name, takeaway, howToFindOrUse };
}

function normalizeLearning(raw: unknown): LearningRecommendation | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name : "";
  const takeaway = typeof o.takeaway === "string" ? o.takeaway : "";
  const howToFindOrUse = typeof o.howToFindOrUse === "string" ? o.howToFindOrUse : "";
  if (!name) return null;
  return { name, takeaway, howToFindOrUse };
}

export async function generateWithAI(
  targetRole: string,
  profileText: string,
  githubSummary: string | undefined,
  extractedSkills: string[],
  missingSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[],
  apiKey: string
): Promise<Omit<AnalysisResult, "extractedSkills" | "matchedSkills" | "missingSkills" | "targetRole" | "usedFallback" | "score"> & { score?: number } | null> {
  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey });
    const roleContext = `Required skills: ${requiredSkills.join(", ") || "None"}. Preferred skills: ${preferredSkills.join(", ") || "None"}.`;
    const candidateContext = `Resume/profile:\n${profileText}${githubSummary ? `\n\nGitHub summary:\n${githubSummary}` : ""}`;
    const parsedContext = `Skills we parsed from their profile: ${extractedSkills.join(", ") || "None"}. Skills missing for this role: ${missingSkills.join(", ") || "None"}.`;
    const userContent = `You are evaluating a candidate for the role of ${targetRole}.\n\n${roleContext}\n\n${candidateContext}\n\n${parsedContext}\n\nReview their resume as a big tech recruiter. Compare their profile to the role requirements and assess how likely they would succeed in this role. Provide your score (0-10) and personalized feedback.`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048,
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      roadmapSteps?: unknown[];
      projects?: unknown[];
      learningRecommendations?: unknown[];
      interviewQuestions?: string[];
      score?: number;
      personalizedFeedback?: string;
    };

    const roadmapSteps = Array.isArray(parsed.roadmapSteps)
      ? parsed.roadmapSteps.map(normalizeRoadmapStep).filter((s): s is RoadmapStep => s !== null)
      : [];
    const roadmap = roadmapSteps.length > 0 ? roadmapSteps.map((s) => s.step) : [];
    const projects = Array.isArray(parsed.projects)
      ? parsed.projects.map(normalizeProject).filter((p): p is ProjectRecommendation => p !== null).slice(0, 3)
      : [];
    const learningRecommendations = Array.isArray(parsed.learningRecommendations)
      ? parsed.learningRecommendations.map(normalizeLearning).filter((l): l is LearningRecommendation => l !== null).slice(0, 3)
      : [];
    const interviewQuestions = Array.isArray(parsed.interviewQuestions) ? parsed.interviewQuestions.slice(0, 5) : [];
    const rawScore = typeof parsed.score === "number" ? parsed.score : undefined;
    const score = rawScore !== undefined ? Math.min(10, Math.max(0, Math.round(rawScore * 10) / 10)) : undefined;
    const personalizedFeedback = typeof parsed.personalizedFeedback === "string" ? parsed.personalizedFeedback.trim() || undefined : undefined;

    return {
      roadmap,
      roadmapSteps: roadmapSteps.length > 0 ? roadmapSteps : undefined,
      projects,
      learningRecommendations,
      interviewQuestions,
      score,
      personalizedFeedback,
    };
  } catch (err) {
    console.error("OpenAI recommendation failed:", err);
    return null;
  }
}
