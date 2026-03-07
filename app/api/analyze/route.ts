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

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const aiResult = apiKey && (await generateWithAI(targetRole, extractedSkills, missingSkills, apiKey));

  if (aiResult) {
    return NextResponse.json({
      targetRole,
      extractedSkills,
      matchedSkills,
      missingSkills,
      roadmap: aiResult.roadmap,
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
