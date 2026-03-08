/** Single roadmap step with goal, how it helps, and a concrete takeaway */
export interface RoadmapStep {
  step: string;
  goal: string;
  howItHelps: string;
  takeaway: string;
}

/** Project idea with takeaway and how to find/use it (1-2 sentences) */
export interface ProjectRecommendation {
  name: string;
  takeaway: string;
  howToFindOrUse: string;
}

/** Course/cert with takeaway and how to find/use it (1-2 sentences) */
export interface LearningRecommendation {
  name: string;
  takeaway: string;
  howToFindOrUse: string;
}

export interface AnalysisResult {
  targetRole: string;
  extractedSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  /** Legacy flat steps; used when roadmapSteps is absent (e.g. old fallback) */
  roadmap: string[];
  /** Rich roadmap steps (goal, how, takeaway). When present, prefer over roadmap. */
  roadmapSteps?: RoadmapStep[];
  /** Project ideas (rich: name, takeaway, howToFindOrUse) or legacy string list */
  projects: string[] | ProjectRecommendation[];
  /** Learning/certs (rich or legacy string list) */
  learningRecommendations: string[] | LearningRecommendation[];
  interviewQuestions: string[];
  /** Fit score 0–10 for the target role (rule-based or AI). */
  score: number;
  /** Personalized feedback on how far the candidate is from being a fit (AI only). */
  personalizedFeedback?: string;
  usedFallback: boolean;
  fallbackReason?: "api_key_missing" | "api_error";
}

export interface RoleDefinition {
  id: string;
  name: string;
  requiredSkills: string[];
  preferredSkills: string[];
  commonCertifications: string[];
  suggestedProjects: string[];
  interviewTopics: string[];
}

export interface SkillResource {
  skill: string;
  projects: string[];
  courses: string[];
  certifications: string[];
  interviewTopics: string[];
  difficulty: string;
  estimatedEffort: string;
}

export interface ResourcesData {
  skillResources: SkillResource[];
}
