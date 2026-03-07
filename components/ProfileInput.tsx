"use client";

import { useState, useRef } from "react";
import sampleProfiles from "@/data/sampleProfiles.json";

const ROLES = ["Frontend Engineer", "Backend Engineer", "ML Engineer", "Cloud Engineer"] as const;

interface ProfileInputProps {
  onAnalyze: (payload: { profileText: string; githubSummary?: string; targetRole: string }) => void;
  isLoading: boolean;
  error: string | null;
}

export default function ProfileInput({ onAnalyze, isLoading, error }: ProfileInputProps) {
  const [profileText, setProfileText] = useState("");
  const [githubSummary, setGithubSummary] = useState("");
  const [targetRole, setTargetRole] = useState<string>(ROLES[0]);
  const [touched, setTouched] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validationError = touched && !profileText.trim() ? "Profile or resume text is required" : null;
  const displayError = error ?? parseError ?? validationError;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!profileText.trim()) return;
    onAnalyze({ profileText: profileText.trim(), githubSummary: githubSummary.trim() || undefined, targetRole });
  }

  function loadSample(id: string) {
    setParseError(null);
    const profiles = (sampleProfiles as { profiles: { id: string; resume: string; githubSummary?: string }[] }).profiles;
    const profile = profiles.find((p) => p.id === id);
    if (profile) {
      setProfileText(profile.resume);
      setGithubSummary(profile.githubSummary ?? "");
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setParsing(true);
    const name = file.name.toLowerCase();
    try {
      if (name.endsWith(".txt")) {
        const text = await file.text();
        setProfileText(text.trim());
        setTouched(true);
      } else if (name.endsWith(".pdf")) {
        const formData = new FormData();
        formData.set("file", file);
        const res = await fetch("/api/parse-resume", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          setParseError(data.error ?? "Could not parse file");
          return;
        }
        setProfileText((data.text ?? "").trim());
        setTouched(true);
      } else {
        setParseError("Please choose a .txt or .pdf file.");
      }
    } catch {
      setParseError("Could not read file.");
    } finally {
      setParsing(false);
      e.target.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="profile" className="block text-sm font-medium text-slate-700 mb-1">Resume / Profile text *</label>
        <div className="mb-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,text/plain,application/pdf"
            onChange={handleFileChange}
            disabled={isLoading || parsing}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-blue-700 file:font-medium"
            aria-label="Upload resume file"
          />
          {parsing && <span className="text-sm text-slate-500">Parsing…</span>}
        </div>
        <p className="mb-1 text-xs text-slate-500">Upload .txt or .pdf to extract text.</p>
        <textarea
          id="profile"
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Paste your synthetic resume or profile..."
          rows={6}
          className="w-full rounded-lg border border-blue-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="github" className="block text-sm font-medium text-slate-700 mb-1">GitHub summary (optional)</label>
        <textarea
          id="github"
          value={githubSummary}
          onChange={(e) => setGithubSummary(e.target.value)}
          placeholder="Brief summary of repos..."
          rows={2}
          className="w-full rounded-lg border border-blue-200 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">Target role</label>
        <select
          id="role"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          className="w-full rounded-lg border border-blue-200 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={isLoading}
        >
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">Load sample:</span>
        {((sampleProfiles as { profiles: { id: string; label: string }[] }).profiles).map((p) => (
          <button key={p.id} type="button" onClick={() => loadSample(p.id)} className="text-sm text-blue-600 hover:text-blue-700 underline">
            {p.label}
          </button>
        ))}
      </div>
      {displayError && <p className="text-sm text-red-600" role="alert">{displayError}</p>}
      <button
        type="submit"
        disabled={isLoading || !profileText.trim()}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
      >
        {isLoading ? "Analyzing…" : "Analyze"}
      </button>
    </form>
  );
}
