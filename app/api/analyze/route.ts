import { NextResponse } from "next/server";
import { z } from "zod";
import { extractSkillsFromProfile } from "@/lib/parser";
import { runFallback } from "@/lib/fallback";
import { generateWithAI } from "@/lib/recommend";
import type { RoleDefinition, ResourcesData } from "@/lib/types";
import rolesData from "@/data/roles.json";
import resourcesData from "@/data/resources.json";

const AnalyzeSchema = z.object({
  profileText: z.string().min(1, "Profile or resume text is required"),
  githubSummary: z.string().optional(),
  targetRole: z.enum(["Frontend Engineer", "Backend Engineer", "ML Engineer", "Cloud Engineer"]),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }
  const parsed = AnalyzeSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join("; ") || "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const { profileText, githubSummary, targetRole } = parsed.data;
  const roles = rolesData as { roles: RoleDefinition[] };
  const resources = resourcesData as ResourcesData;
  const role = roles.roles.find((r) => r.name === targetRole);
  const allSkillNames = Array.from(
    new Set([
      ...(role?.requiredSkills ?? []),
      ...(role?.preferredSkills ?? []),
      ...resources.skillResources.map((r) => r.skill),
    ])
  );
  const extractedSkills = extractSkillsFromProfile(profileText, githubSummary, allSkillNames);
  const roleSkills = [...(role?.requiredSkills ?? []), ...(role?.preferredSkills ?? [])];
  const matchedSkills = extractedSkills.filter((s) => roleSkills.some((r) => r.toLowerCase() === s.toLowerCase()));
  const missingSkills = roleSkills.filter((s) => !extractedSkills.some((e) => e.toLowerCase() === s.toLowerCase()));

  // #region agent log
  const rawVal = process.env.OPENAI_API_KEY;
  fetch('http://127.0.0.1:7518/ingest/ce71aede-daeb-4d2f-b8af-f3a7e794442b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'39d146'},body:JSON.stringify({sessionId:'39d146',location:'app/api/analyze/route.ts',message:'OPENAI_API_KEY env check',data:{hasKey:!!rawVal,keyLength:rawVal?.length??0,keyTrimmedLength:rawVal?.trim().length??0,cwd:process.cwd(),openaiRelatedKeys:Object.keys(process.env).filter(k=>k.includes('OPENAI'))},timestamp:Date.now(),hypothesisId:'A_B_C_D'})}).catch(()=>{});
  // #endregion

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const aiResult = apiKey && (await generateWithAI(targetRole, extractedSkills, missingSkills, apiKey));

  if (aiResult) {
    return NextResponse.json({
      targetRole,
      extractedSkills,
      matchedSkills,
      missingSkills,
      roadmap: aiResult.roadmap,
      roadmapSteps: aiResult.roadmapSteps,
      projects: aiResult.projects,
      learningRecommendations: aiResult.learningRecommendations,
      interviewQuestions: aiResult.interviewQuestions,
      usedFallback: false,
    });
  }
  const fallbackResult = runFallback(profileText, githubSummary, targetRole, roles, resources);
  const fallbackReason = !apiKey ? "api_key_missing" : "api_error";
  return NextResponse.json({ ...fallbackResult, fallbackReason });
}
