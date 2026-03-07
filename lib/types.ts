export interface AnalysisResult {
  targetRole: string;
  extractedSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  roadmap: string[];
  projects: string[];
  learningRecommendations: string[];
  interviewQuestions: string[];
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
