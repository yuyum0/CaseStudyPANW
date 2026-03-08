import type { AnalysisResult, RoleDefinition, SkillResource } from "./types";
import { extractSkillsFromProfile } from "./parser";

interface RolesData {
  roles: RoleDefinition[];
}

interface ResourcesData {
  skillResources: SkillResource[];
}

export function runFallback(
  profileText: string,
  githubSummary: string | undefined,
  targetRoleName: string,
  rolesData: RolesData,
  resourcesData: ResourcesData
): AnalysisResult {
  const role = rolesData.roles.find((r) => r.name.toLowerCase() === targetRoleName.toLowerCase());
  if (!role) {
    return buildFallbackResult(targetRoleName, [], [], ["Unknown role"], rolesData, resourcesData);
  }
  const allSkills = Array.from(new Set([...role.requiredSkills, ...role.preferredSkills])).concat(
    resourcesData.skillResources.map((r) => r.skill)
  );
  const extracted = extractSkillsFromProfile(profileText, githubSummary, allSkills);
  const roleSkills = [...role.requiredSkills, ...role.preferredSkills];
  const matched = extracted.filter((s) => roleSkills.some((r) => r.toLowerCase() === s.toLowerCase()));
  const missing = roleSkills.filter((s) => !extracted.some((e) => e.toLowerCase() === s.toLowerCase()));
  return buildFallbackResult(role.name, extracted, matched, missing, rolesData, resourcesData, role);
}

function buildFallbackResult(
  targetRole: string,
  extracted: string[],
  matched: string[],
  missing: string[],
  _rolesData: RolesData,
  resourcesData: ResourcesData,
  role?: RoleDefinition
): AnalysisResult {
  const roadmap: string[] = [];
  if (missing.length > 0) {
    roadmap.push(`Focus on filling gaps for ${targetRole}.`);
    missing.slice(0, 5).forEach((s, i) => roadmap.push(`${i + 1}. Build foundation in ${s}`));
    roadmap.push("Then practice with projects and mock interviews.");
  } else {
    roadmap.push("Your skills align well. Deepen expertise and add portfolio projects.");
  }
  const projects: string[] = role?.suggestedProjects ? [...role.suggestedProjects] : [];
  for (const skill of missing.slice(0, 3)) {
    const res = resourcesData.skillResources.find((r) => r.skill.toLowerCase() === skill.toLowerCase());
    if (res?.projects?.length) projects.push(res.projects[0]);
  }
  const uniqueProjects = Array.from(new Set(projects)).slice(0, 3);
  const learningRecommendations: string[] = [];
  if (role?.commonCertifications?.length) learningRecommendations.push(...role.commonCertifications.slice(0, 2));
  for (const skill of missing.slice(0, 2)) {
    const res = resourcesData.skillResources.find((r) => r.skill.toLowerCase() === skill.toLowerCase());
    if (res?.courses?.length) learningRecommendations.push(res.courses[0]);
    if (res?.certifications?.length) learningRecommendations.push(res.certifications[0]);
  }
  const uniqueLearning = Array.from(new Set(learningRecommendations)).slice(0, 3);
  const interviewQuestions: string[] = [];
  if (role?.interviewTopics?.length) {
    role.interviewTopics.slice(0, 5).forEach((t) => interviewQuestions.push(`Explain ${t} and how you've applied it.`));
  }
  if (interviewQuestions.length < 5) {
    interviewQuestions.push("Describe a technical challenge you solved recently.", "How do you approach learning a new technology?");
  }
  return {
    targetRole,
    extractedSkills: extracted,
    matchedSkills: matched,
    missingSkills: missing,
    roadmap,
    projects: uniqueProjects,
    learningRecommendations: uniqueLearning,
    interviewQuestions: interviewQuestions.slice(0, 5),
    usedFallback: true,
  };
}
