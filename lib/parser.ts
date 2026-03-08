import type { RoleDefinition, SkillResource } from "./types";

const KNOWN_SKILLS = [
  "HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js",
  "Python", "Java", "SQL", "Git", "Linux", "REST APIs", "Node.js",
  "Machine Learning", "Data preprocessing", "Statistics", "TensorFlow", "PyTorch",
  "Feature Engineering", "Model Deployment", "MLOps",
  "Networking", "Scripting", "CI/CD", "Containers", "Docker",
  "AWS", "Terraform", "Kubernetes", "State Management", "Testing",
  "Accessibility", "Build Tools", "Databases", "Caching", "Message Queues",
  "Linux basics",
];

export function extractSkillsFromProfile(
  profileText: string,
  githubSummary?: string,
  knownSkills: string[] = KNOWN_SKILLS
): string[] {
  const combined = [profileText, githubSummary ?? ""].join(" ").toLowerCase();
  const found: string[] = [];
  for (const skill of knownSkills) {
    if (combined.includes(skill.toLowerCase())) found.push(skill);
  }
  return [...new Set(found)];
}

export function getAllKnownSkills(roles: RoleDefinition[], resources: SkillResource[]): string[] {
  const set = new Set<string>();
  for (const r of roles) {
    r.requiredSkills.forEach((s) => set.add(s));
    r.preferredSkills.forEach((s) => set.add(s));
  }
  for (const r of resources) set.add(r.skill);
  return Array.from(set);
}
