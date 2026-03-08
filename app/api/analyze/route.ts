import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rateLimit";
import { extractSkillsFromProfile } from "@/lib/parser";
import { runFallback } from "@/lib/fallback";
import { generateWithAI } from "@/lib/recommend";
import type { RoleDefinition, ResourcesData } from "@/lib/types";
import rolesData from "@/data/roles.json";
import resourcesData from "@/data/resources.json";

const AnalyzeSchema = z.object({
  profileText: z.string().min(1, "Profile or resume text is required"),
  githubSummary: z.string().optional(),
  targetRole: z.enum([
    "Frontend Engineer",
    "Backend Engineer",
    "ML Engineer",
    "Cloud Engineer",
  ]),
});

export async function POST(request: Request) {
  const rateLimitResponse = checkRateLimit(request, { maxRequests: 10, windowMs: 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
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
  const allSkillNames = [
    ...new Set([
      ...(role?.requiredSkills ?? []),
      ...(role?.preferredSkills ?? []),
      ...resources.skillResources.map((r) => r.skill),
    ]),
  ];
  const extractedSkills = extractSkillsFromProfile(
    profileText,
    githubSummary,
    allSkillNames
  );
  const roleSkills = [...(role?.requiredSkills ?? []), ...(role?.preferredSkills ?? [])];
  const matchedSkills = extractedSkills.filter((s) =>
    roleSkills.some((r) => r.toLowerCase() === s.toLowerCase())
  );
  const missingSkills = roleSkills.filter(
    (s) => !extractedSkills.some((e) => e.toLowerCase() === s.toLowerCase())
  );

  const apiKey = process.env.OPENAI_API_KEY;
  const requiredSkills = role?.requiredSkills ?? [];
  const preferredSkills = role?.preferredSkills ?? [];
  const aiResult =
    apiKey &&
    (await generateWithAI(
      targetRole,
      profileText,
      githubSummary,
      extractedSkills,
      missingSkills,
      requiredSkills,
      preferredSkills,
      apiKey
    ));

  if (aiResult) {
    const totalRoleSkills = requiredSkills.length + preferredSkills.length;
    const ruleBasedScore =
      totalRoleSkills > 0
        ? Math.min(10, Math.max(0, Math.round((matchedSkills.length / totalRoleSkills) * 10 * 10) / 10))
        : 0;
    const score = aiResult.score ?? ruleBasedScore;

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
      score,
      personalizedFeedback: aiResult.personalizedFeedback,
      usedFallback: false,
    });
  }

  const fallbackResult = runFallback(
    profileText,
    githubSummary,
    targetRole,
    roles,
    resources
  );
  return NextResponse.json(fallbackResult);
}
