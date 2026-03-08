"use client";

import { useMemo, useState } from "react";
import type { AnalysisResult } from "@/lib/types";

type FilterCategory = "all" | "projects" | "learning" | "certifications" | "interview prep";

interface AnalysisResultsProps {
  result: AnalysisResult | null;
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  const [filter, setFilter] = useState<FilterCategory>("all");

  const filteredRecommendations = useMemo(() => {
    if (!result) return { projects: [], learning: [], questions: [] };
    const { projects, learningRecommendations, interviewQuestions } = result;
    if (filter === "all") return { projects, learning: learningRecommendations, questions: interviewQuestions };
    if (filter === "projects") return { projects, learning: [], questions: [] };
    if (filter === "learning" || filter === "certifications") return { projects: [], learning: learningRecommendations, questions: [] };
    if (filter === "interview prep") return { projects: [], learning: [], questions: interviewQuestions };
    return { projects, learning: learningRecommendations, questions: interviewQuestions };
  }, [result, filter]);

  if (!result) return null;

  const categories: { value: FilterCategory; label: string }[] = [
    { value: "all", label: "All" },
    { value: "projects", label: "Projects" },
    { value: "learning", label: "Learning" },
    { value: "certifications", label: "Certifications" },
    { value: "interview prep", label: "Interview prep" },
  ];

  return (
    <div className="space-y-6">
      {result.usedFallback && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800" role="status">
          {result.fallbackReason === "api_key_missing" && (
            <>No API key set. Add <code className="rounded bg-amber-100 px-1">OPENAI_API_KEY</code> to <code className="rounded bg-amber-100 px-1">.env.local</code> for AI recommendations. Using rule-based fallback.</>
          )}
          {result.fallbackReason === "api_error" && (
            <>AI request failed (check server logs). Using rule-based fallback. Recommendations are still useful but less personalized.</>
          )}
          {!result.fallbackReason && (
            <>Using rule-based fallback (AI unavailable or disabled). Recommendations are still useful but less personalized.</>
          )}
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-800 mb-2">Skills</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-blue-200 bg-white p-4">
            <h4 className="text-xs font-medium text-slate-500 mb-1">Extracted</h4>
            <ul className="text-sm text-slate-800">
              {result.extractedSkills.length ? result.extractedSkills.map((s) => <li key={s} className="leading-relaxed">{s}</li>) : "—"}
            </ul>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <h4 className="text-xs font-medium text-slate-500 mb-1">Matched</h4>
            <ul className="text-sm text-slate-800">
              {result.matchedSkills.length ? result.matchedSkills.map((s) => <li key={s} className="leading-relaxed">{s}</li>) : "—"}
            </ul>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
            <h4 className="text-xs font-medium text-slate-500 mb-1">Missing</h4>
            <ul className="text-sm text-slate-800">
              {result.missingSkills.length ? result.missingSkills.map((s) => <li key={s} className="leading-relaxed">{s}</li>) : "—"}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-800 mb-2">Prioritized roadmap</h3>
        <ol className="list-decimal list-inside space-y-1 rounded-lg border border-blue-200 bg-white p-4 text-sm text-slate-800">
          {result.roadmap.map((step, i) => (
            <li key={i} className="leading-relaxed">{step}</li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-800 mb-2">Filter recommendations</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setFilter(c.value)}
              className={`rounded-full px-3 py-1 text-sm font-medium ${filter === c.value ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800 hover:bg-blue-200"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {(filter === "all" || filter === "projects") && filteredRecommendations.projects.length > 0 && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-white p-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Project recommendations</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-800">
              {filteredRecommendations.projects.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}
        {(filter === "all" || filter === "learning" || filter === "certifications") && filteredRecommendations.learning.length > 0 && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-white p-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Learning & certifications</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-800">
              {filteredRecommendations.learning.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </div>
        )}
        {(filter === "all" || filter === "interview prep") && filteredRecommendations.questions.length > 0 && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-white p-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Mock interview questions</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-800">
              {filteredRecommendations.questions.map((q, i) => <li key={i} className="leading-relaxed">{q}</li>)}
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}
