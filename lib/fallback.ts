import type {
  AnalysisResult,
  LearningRecommendation,
  ProjectRecommendation,
  RoleDefinition,
  RoadmapStep,
  SkillResource,
} from "./types";
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
  const roadmapSteps: RoadmapStep[] = [];
  if (missing.length > 0) {
    roadmapSteps.push({
      step: "Assess your gap",
      goal: "Know exactly which skills you need to build for this role.",
      howItHelps: "Comparing your profile to the role highlights missing competencies so you can prioritize.",
      takeaway: `Focus on these ${missing.length} areas first: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? " and more." : "."}`,
    });
    missing.slice(0, 3).forEach((s) => {
      roadmapSteps.push({
        step: `Build foundation in ${s}`,
        goal: `Gain practical ability in ${s}.`,
        howItHelps: `This skill is required or preferred for ${targetRole}; building it strengthens your profile.`,
        takeaway: `Use courses and a small project (see recommendations below) to learn and apply ${s}.`,
      });
    });
    roadmapSteps.push({
      step: "Learn and build in parallel",
      goal: "Combine learning with hands-on projects.",
      howItHelps: "Taking a course while doing a side project reinforces skills and gives you portfolio evidence.",
      takeaway: "Pick one course and one project from the recommendations; do the course modules and apply them in the project.",
    });
    roadmapSteps.push({
      step: "Practice for interviews",
      goal: "Get ready to discuss your skills and projects.",
      howItHelps: "Mock questions below are aligned to this role so you can practice clear, structured answers.",
      takeaway: "Answer each question out loud and tie your answers to projects or learning you completed.",
    });
  } else {
    roadmapSteps.push(
      {
        step: "Deepen expertise",
        goal: "Strengthen your existing skills and add portfolio proof.",
        howItHelps: "Your skills already align; adding projects and certs makes you more competitive.",
        takeaway: "Use the project and learning recommendations below to build 1–2 strong portfolio pieces.",
      },
      {
        step: "Practice for interviews",
        goal: "Prepare to discuss your experience.",
        howItHelps: "Role-specific mock questions help you articulate what you know.",
        takeaway: "Practice the interview questions below and link answers to your projects.",
      }
    );
  }
  const roadmap = roadmapSteps.map((s) => s.step);

  const projects: ProjectRecommendation[] = [];
  const seen = new Set<string>();
  if (role?.suggestedProjects?.length) {
    role.suggestedProjects.slice(0, 3).forEach((p) => {
      if (!seen.has(p)) {
        seen.add(p);
        projects.push({
          name: p,
          takeaway: "Demonstrates skills relevant to this role; good for your portfolio.",
          howToFindOrUse: "Search for tutorials or starter repos by project name; build incrementally and document your approach in the README.",
        });
      }
    });
  }
  for (const skill of missing) {
    if (projects.length >= 3) break;
    const res = resourcesData.skillResources.find((r) => r.skill.toLowerCase() === skill.toLowerCase());
    const name = res?.projects?.[0];
    if (name && !seen.has(name)) {
      seen.add(name);
      projects.push({
        name,
        takeaway: `Builds hands-on experience in ${skill}.`,
        howToFindOrUse: "Look up the project idea on GitHub or YouTube; follow a short tutorial then extend it on your own.",
      });
    }
  }
  const uniqueProjects = projects.slice(0, 3);

  const learningRecommendations: LearningRecommendation[] = [];
  const seenL = new Set<string>();
  if (role?.commonCertifications?.length) {
    role.commonCertifications.slice(0, 2).forEach((c) => {
      if (!seenL.has(c)) {
        seenL.add(c);
        learningRecommendations.push({
          name: c,
          takeaway: "Adds a recognized credential for this role.",
          howToFindOrUse: "Search the certification name to find the official provider (e.g. Coursera, AWS Training); many offer free audit or trial.",
        });
      }
    });
  }
  for (const skill of missing) {
    if (learningRecommendations.length >= 3) break;
    const res = resourcesData.skillResources.find((r) => r.skill.toLowerCase() === skill.toLowerCase());
    const course = res?.courses?.[0];
    if (course && !seenL.has(course)) {
      seenL.add(course);
      learningRecommendations.push({
        name: course,
        takeaway: `Structured learning for ${skill}.`,
        howToFindOrUse: "Search on Coursera, Udemy, or edX; use free audit where available, or check the provider’s official site.",
      });
    }
    const cert = res?.certifications?.[0];
    if (cert && !seenL.has(cert) && learningRecommendations.length < 3) {
      seenL.add(cert);
      learningRecommendations.push({
        name: cert,
        takeaway: `Validates ${skill} knowledge.`,
        howToFindOrUse: "Find the official certification page; take practice exams first, then schedule the proctored exam when ready.",
      });
    }
  }
  const uniqueLearning = learningRecommendations.slice(0, 3);

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
    roadmapSteps,
    projects: uniqueProjects,
    learningRecommendations: uniqueLearning,
    interviewQuestions: interviewQuestions.slice(0, 5),
    usedFallback: true,
  };
}
