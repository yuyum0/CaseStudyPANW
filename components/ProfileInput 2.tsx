"use client";

import { useState } from "react";
import sampleProfiles from "@/data/sampleProfiles.json";

const ROLES = [
  "Frontend Engineer",
  "Backend Engineer",
  "ML Engineer",
  "Cloud Engineer",
] as const;

interface ProfileInputProps {
  onAnalyze: (payload: {
    profileText: string;
    githubSummary?: string;
    targetRole: string;
  }) => void;
  isLoading: boolean;
  error: string | null;
}

export default function ProfileInput({
  onAnalyze,
  isLoading,
  error,
}: ProfileInputProps) {
  const [profileText, setProfileText] = useState("");
  const [githubSummary, setGithubSummary] = useState("");
  const [targetRole, setTargetRole] = useState<string>(ROLES[0]);
  const [touched, setTouched] = useState(false);

  const validationError =
    touched && !profileText.trim() ? "Profile or resume text is required" : null;
  const displayError = error ?? validationError;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!profileText.trim()) return;
    onAnalyze({
      profileText: profileText.trim(),
      githubSummary: githubSummary.trim() || undefined,
      targetRole,
    });
  }

  function loadSample(id: string) {
    const profile = (sampleProfiles as { profiles: { id: string; resume: string; githubSummary?: string }[] })
      .profiles.find((p) => p.id === id);
    if (profile) {
      setProfileText(profile.resume);
      setGithubSummary(profile.githubSummary ?? "");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="profile" className="block text-sm font-medium text-slate-700 mb-1">
          Resume / Profile text *
        </label>
        <textarea
          id="profile"
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Paste your synthetic resume or GitHub-style profile..."
          rows={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="github" className="block text-sm font-medium text-slate-700 mb-1">
          GitHub summary (optional)
        </label>
        <textarea
          id="github"
          value={githubSummary}
          onChange={(e) => setGithubSummary(e.target.value)}
          placeholder="Brief summary of repos or activity..."
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
          Target role
        </label>
        <select
          id="role"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          disabled={isLoading}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">Load sample:</span>
        {(
          (sampleProfiles as { profiles: { id: string; label: string }[] }).profiles
        ).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => loadSample(p.id)}
            className="text-sm text-emerald-600 hover:text-emerald-700 underline"
          >
            {p.label}
          </button>
        ))}
      </div>
      {displayError && (
        <p className="text-sm text-red-600" role="alert">
          {displayError}
        </p>
      )}
      <button
        type="submit"
        disabled={isLoading || !profileText.trim()}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
      >
        {isLoading ? "Analyzing…" : "Analyze"}
      </button>
    </form>
  );
}
