"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AnalysisResult } from "@/lib/types";
import AnalysisResults from "@/components/AnalysisResults";

function isValidResult(data: unknown): data is AnalysisResult {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return (
    typeof o.targetRole === "string" &&
    Array.isArray(o.extractedSkills) &&
    Array.isArray(o.matchedSkills) &&
    Array.isArray(o.missingSkills) &&
    Array.isArray(o.roadmap) &&
    Array.isArray(o.projects) &&
    Array.isArray(o.learningRecommendations) &&
    Array.isArray(o.interviewQuestions) &&
    typeof o.usedFallback === "boolean"
  );
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
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← New analysis
        </Link>
      </div>
      <section className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm" aria-label="Analysis results">
        <h2 className="mb-4 text-lg font-semibold text-blue-900">Results for {result.targetRole}</h2>
        <AnalysisResults result={result} />
      </section>
    </main>
  );
}
