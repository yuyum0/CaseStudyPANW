import type { AnalysisResult } from "./types";

const SYSTEM_PROMPT = `You are a career advisor for early-career technical candidates. Given a target role, the candidate's extracted skills, and missing skills for that role, respond with a JSON object only (no markdown, no code fence) with these exact keys:
- roadmap: array of 4-6 short, ordered steps (strings) for a beginner-friendly learning path
- projects: array of exactly 3 concrete project ideas (strings)
- learningRecommendations: array of exactly 3 learning or certification suggestions (strings)
- interviewQuestions: array of exactly 5 mock interview questions (strings)
Keep suggestions practical and appropriate for the target role. Be concise.`;

export async function generateWithAI(
  targetRole: string,
  extractedSkills: string[],
  missingSkills: string[],
  apiKey: string
): Promise<Omit<AnalysisResult, "extractedSkills" | "matchedSkills" | "missingSkills" | "targetRole" | "usedFallback"> | null> {
  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey });
    const userContent = `Target role: ${targetRole}. Extracted skills: ${extractedSkills.join(", ") || "None"}. Missing skills for this role: ${missingSkills.join(", ") || "None"}.`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1024,
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { roadmap?: string[]; projects?: string[]; learningRecommendations?: string[]; interviewQuestions?: string[] };
    return {
      roadmap: Array.isArray(parsed.roadmap) ? parsed.roadmap : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects.slice(0, 3) : [],
      learningRecommendations: Array.isArray(parsed.learningRecommendations) ? parsed.learningRecommendations.slice(0, 3) : [],
      interviewQuestions: Array.isArray(parsed.interviewQuestions) ? parsed.interviewQuestions.slice(0, 5) : [],
    };
  } catch (err) {
    console.error("OpenAI recommendation failed:", err);
    return null;
  }
}
