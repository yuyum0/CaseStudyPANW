import type {
  AnalysisResult,
  LearningRecommendation,
  ProjectRecommendation,
  RoadmapStep,
} from "./types";

export interface PhaseConcurrentItem {
  label: string;
  items: (LearningRecommendation | ProjectRecommendation)[];
}

export interface RoadmapPhase {
  id: string;
  title: string;
  goal: string;
  howItHelps: string;
  takeaway: string;
  type: "sequential" | "concurrent";
  /** For sequential: optional extra content (e.g. interview questions) */
  content?: string[];
  /** For concurrent: e.g. [{ label: "Learn", items: learningRecs }, { label: "Build", items: projects }] */
  concurrent?: PhaseConcurrentItem[];
}

function normalizeProjects(
  raw: AnalysisResult["projects"]
): ProjectRecommendation[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) =>
    typeof p === "string"
      ? { name: p, takeaway: "", howToFindOrUse: "" }
      : p
  );
}

function normalizeLearning(
  raw: AnalysisResult["learningRecommendations"]
): LearningRecommendation[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((l) =>
    typeof l === "string"
      ? { name: l, takeaway: "", howToFindOrUse: "" }
      : l
  );
}

/**
 * Derives 3 phases: Assess → Learn & build (concurrent) → Practice.
 * Uses roadmapSteps when present; otherwise falls back to roadmap strings.
 */
export function analysisResultToPhases(result: AnalysisResult): RoadmapPhase[] {
  const steps: RoadmapStep[] =
    (result.roadmapSteps?.length ?? 0) > 0
      ? (result.roadmapSteps ?? [])
      : result.roadmap.map((step) => ({
          step,
          goal: "",
          howItHelps: "",
          takeaway: "",
        }));
  const projects = normalizeProjects(result.projects);
  const learning = normalizeLearning(result.learningRecommendations);
  const questions = result.interviewQuestions ?? [];

  const assess = steps[0];
  const learnBuildStep = steps.find(
    (s) =>
      /learn|build|project|course|cert/i.test(s.step) && steps.indexOf(s) > 0
  ) ?? steps[1];
  const practiceStep = steps.find(
    (s) => /practic|interview|mock/i.test(s.step)
  ) ?? steps[steps.length - 1];

  const phases: RoadmapPhase[] = [];

  phases.push({
    id: "assess",
    title: assess?.step ?? "Assess your gap",
    goal: assess?.goal ?? "Understand which skills you need to build for this role.",
    howItHelps:
      assess?.howItHelps ??
      "Comparing your profile to the role highlights missing competencies so you can prioritize.",
    takeaway:
      assess?.takeaway ??
      `Focus on ${result.missingSkills.length} missing areas; use the steps below to close the gap.`,
    type: "sequential",
    content:
      result.missingSkills.length > 0
        ? result.missingSkills.slice(0, 5).map((s) => `Build foundation in ${s}`)
        : undefined,
  });

  phases.push({
    id: "learn-build",
    title: learnBuildStep?.step ?? "Learn & build in parallel",
    goal:
      learnBuildStep?.goal ??
      "Combine learning with hands-on projects to close the gap.",
    howItHelps:
      learnBuildStep?.howItHelps ??
      "Taking a course while doing a side project reinforces skills and gives you portfolio evidence.",
    takeaway:
      learnBuildStep?.takeaway ??
      "Pick one course and one project below; do them in parallel.",
    type: "concurrent",
    concurrent: [
      { label: "Learn", items: learning },
      { label: "Build", items: projects },
    ].filter((x) => x.items.length > 0),
  });

  phases.push({
    id: "practice",
    title: practiceStep?.step ?? "Practice for interviews",
    goal:
      practiceStep?.goal ?? "Get ready to discuss your skills and projects.",
    howItHelps:
      practiceStep?.howItHelps ??
      "Role-specific mock questions help you articulate what you know.",
    takeaway:
      practiceStep?.takeaway ??
      "Answer each question out loud and tie answers to your projects.",
    type: "sequential",
    content: questions.length > 0 ? questions : undefined,
  });

  return phases;
}

/** Build a Mermaid flowchart string: Assess --> LearnBuild --> Practice */
export function phasesToMermaid(phases: RoadmapPhase[]): string {
  const ids = phases.map((p) => p.id.replace(/-/g, "_"));
  const labels = phases.map((p) => p.title.replace(/"/g, "'"));
  const lines: string[] = ["flowchart LR"];
  for (let i = 0; i < ids.length; i++) {
    lines.push(`  ${ids[i]}["${labels[i]}"]`);
  }
  for (let i = 0; i < ids.length - 1; i++) {
    lines.push(`  ${ids[i]} --> ${ids[i + 1]}`);
  }
  return lines.join("\n");
}
