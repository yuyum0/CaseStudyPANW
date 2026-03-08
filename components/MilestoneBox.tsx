"use client";

import React from "react";
import type { RoadmapPhase } from "@/lib/roadmapPhases";

interface MilestoneBoxProps {
  phase: RoadmapPhase;
  index: number;
}

export default function MilestoneBox({ phase, index }: MilestoneBoxProps) {
  const colors = [
    "border-red-300 bg-red-50/80",
    "border-amber-300 bg-amber-50/80",
    "border-green-300 bg-green-50/80",
    "border-blue-300 bg-blue-50/80",
  ];
  const color = colors[index % colors.length];
  const ariaLabel = "Milestone " + (index + 1) + ": " + phase.title;

  const content: React.ReactNode[] = [];
  content.push(
    <div key="header" className="mb-2 flex items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700 shadow">
        {index + 1}
      </span>
      <h4 className="text-sm font-semibold text-slate-900">{phase.title}</h4>
    </div>
  );
  if (phase.goal) {
    content.push(<p key="goal-l" className="mb-1 text-xs font-medium text-slate-600">Goal</p>);
    content.push(<p key="goal" className="mb-2 text-sm text-slate-800">{phase.goal}</p>);
  }
  if (phase.howItHelps) {
    content.push(<p key="how-l" className="mb-1 text-xs font-medium text-slate-600">How this helps</p>);
    content.push(<p key="how" className="mb-2 text-sm text-slate-800">{phase.howItHelps}</p>);
  }
  if (phase.takeaway) {
    content.push(<p key="take" className="mb-2 text-xs font-medium text-slate-700">Takeaway: {phase.takeaway}</p>);
  }
  if (phase.type === "concurrent" && phase.concurrent?.length) {
    content.push(
      <div key="concurrent" className="mt-3 space-y-3 border-t border-slate-200 pt-3">
        {phase.concurrent.map((group) => (
          <div key={group.label}>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-600">{group.label}</p>
            <ul className="space-y-2">
              {group.items.map((item, i) => (
                <li key={i} className="rounded border border-slate-200 bg-white p-2 text-sm">
                  <p className="font-medium text-slate-800">{item.name}</p>
                  {item.takeaway && <p className="mt-0.5 text-xs text-slate-600">{item.takeaway}</p>}
                  {item.howToFindOrUse && <p className="mt-1 text-xs text-slate-500">{item.howToFindOrUse}</p>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }
  if (phase.type === "sequential" && phase.content?.length) {
    content.push(
      <div key="seq" className="mt-3 border-t border-slate-200 pt-3">
        <ul className="list-disc list-inside space-y-0.5 text-sm text-slate-800">
          {phase.content.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    );
  }

  return React.createElement(
    "div",
    {
      className: "rounded-lg border-2 p-4 shadow-sm " + color,
      "aria-label": ariaLabel,
    },
    content
  );
}
