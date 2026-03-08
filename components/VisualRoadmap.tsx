"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { analysisResultToPhases, phasesToMermaid } from "@/lib/roadmapPhases";
import MilestoneBox from "@/components/MilestoneBox";

export default function VisualRoadmap({ result }: { result: AnalysisResult }) {
  const phases = analysisResultToPhases(result);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [mermaidError, setMermaidError] = useState<string | null>(null);

  useEffect(() => {
    if (!phases.length || !mermaidRef.current) return;
    const diagram = phasesToMermaid(phases);
    let cancelled = false;
    setMermaidError(null);
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          flowchart: { useMaxWidth: true, htmlLabels: true },
        });
        const { svg } = await mermaid.render(
          `roadmap-${Date.now()}`,
          diagram
        );
        if (!cancelled && mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (!cancelled) {
          setMermaidError(err instanceof Error ? err.message : "Failed to render diagram");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phases.length]);

  return (
    <section className="space-y-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-800">
        Your roadmap to {result.targetRole}
      </h3>
      <div className="overflow-x-auto rounded-lg border border-blue-200 bg-white p-4">
        <div ref={mermaidRef} className="flex justify-center [&>svg]:max-w-full" />
        {mermaidError && (
          <p className="mt-2 text-center text-sm text-amber-700">
            Diagram could not be rendered: {mermaidError}. See steps below.
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
        {phases.map((phase, index) => (
          <MilestoneBox key={phase.id} phase={phase} index={index} />
        ))}
      </div>
    </section>
  );
}
