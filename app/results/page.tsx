"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AnalysisResult } from "@/lib/types";
import AnalysisResults from "@/components/AnalysisResults";
import RatingCard from "@/components/RatingCard";

function isValidResult(data: unknown): data is AnalysisResult {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  const valid =
    typeof o.targetRole === "string" &&
    Array.isArray(o.extractedSkills) &&
    Array.isArray(o.matchedSkills) &&
    Array.isArray(o.missingSkills) &&
    Array.isArray(o.roadmap) &&
    Array.isArray(o.projects) &&
    Array.isArray(o.learningRecommendations) &&
    Array.isArray(o.interviewQuestions) &&
    typeof o.usedFallback === "boolean";
  if (!valid) return false;
  if (typeof o.score !== "number") {
    const matched = (o.matchedSkills as string[]).length;
    const missing = (o.missingSkills as string[]).length;
    const total = matched + missing;
    o.score = total > 0 ? Math.min(10, Math.max(0, Math.round((matched / total) * 10 * 10) / 10)) : 0;
  }
  return true;
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("skillsync_last_result");
      if (!raw) {
        router.replace("/");
        return;
      }
      const data = JSON.parse(raw) as unknown;
      if (!isValidResult(data)) {
        router.replace("/");
        return;
      }
      setResult(data);
    } catch {
      router.replace("/");
    } finally {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;
  if (!result) return null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← New analysis
        </Link>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <section className="flex-1 min-w-0 rounded-xl border border-blue-200 bg-white p-6 shadow-sm" aria-label="Analysis results">
          <h2 className="mb-4 text-lg font-semibold text-blue-900">Results for {result.targetRole}</h2>
          <AnalysisResults result={result} />
        </section>
        <aside className="lg:w-72 shrink-0">
          <RatingCard
            score={result.score}
            personalizedFeedback={result.personalizedFeedback}
            targetRole={result.targetRole}
          />
        </aside>
      </div>
    </main>
  );
}
