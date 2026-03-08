"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisResult } from "@/lib/types";
import ProfileInput from "@/components/ProfileInput";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(payload: { profileText: string; githubSummary?: string; targetRole: string }) {
    setError(null);
    setIsLoading(true);
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
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          localStorage.setItem("skillsync_last_result", JSON.stringify(data as AnalysisResult));
        } catch {}
      }
      router.push("/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network or server error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-900 sm:text-4xl">SkillSync</h1>
        <p className="mt-2 text-blue-800/80">Develop Those Missing Skills for Your Next Job Now!</p>
      </header>
      <section className="mb-10 rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-blue-900">Your profile and target role</h2>
        <ProfileInput onAnalyze={handleAnalyze} isLoading={isLoading} error={error} />
      </section>
      <section className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-8 text-center text-blue-800/80">
        <p>Paste a resume or profile, choose a target role, and click Analyze to see results on the next page.</p>
      </section>
    </main>
  );
}
