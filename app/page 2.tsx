"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import ProfileInput from "@/components/ProfileInput";
import AnalysisResults from "@/components/AnalysisResults";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(payload: {
    profileText: string;
    githubSummary?: string;
    targetRole: string;
  }) {
    setError(null);
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        return;
      }
      setResult(data as AnalysisResult);
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          localStorage.setItem("skillsync_last_result", JSON.stringify(data));
        } catch {
          // ignore
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network or server error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          SkillSync
        </h1>
        <p className="mt-2 text-slate-600">
          Career navigation for early-career technical candidates
        </p>
      </header>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Your profile & target role
        </h2>
        <ProfileInput
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          error={error}
        />
      </section>

      {result && (
        <section
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          aria-label="Analysis results"
        >
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Results for {result.targetRole}
          </h2>
          <AnalysisResults result={result} />
        </section>
      )}

      {!result && !isLoading && (
        <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-slate-500">
          <p>Paste a synthetic resume or profile, choose a target role, and click Analyze to see your skills breakdown and recommendations.</p>
        </section>
      )}
    </main>
  );
}
