"use client";

/** Vertical meter bands: NO 15%, LOW 30%, MEDIUM 45%, NORMAL 60%, HIGH 85%, MAX 100% */
const METER_BANDS = [
  { label: "NO", pct: 15, color: "bg-red-500", textColor: "text-red-700" },
  { label: "LOW", pct: 30, color: "bg-orange-500", textColor: "text-orange-700" },
  { label: "MEDIUM", pct: 45, color: "bg-yellow-500", textColor: "text-yellow-700" },
  { label: "NORMAL", pct: 60, color: "bg-lime-400", textColor: "text-lime-700" },
  { label: "HIGH", pct: 85, color: "bg-green-400", textColor: "text-green-700" },
  { label: "MAX", pct: 100, color: "bg-green-600", textColor: "text-green-800" },
] as const;

function getBandForScore(score: number): (typeof METER_BANDS)[number] {
  const pct = score * 10;
  for (let i = METER_BANDS.length - 1; i >= 0; i--) {
    const prev = i > 0 ? METER_BANDS[i - 1].pct : 0;
    if (pct >= prev) return METER_BANDS[i];
  }
  return METER_BANDS[0];
}

interface RatingCardProps {
  score: number;
  personalizedFeedback?: string;
  targetRole: string;
}

export default function RatingCard({ score, personalizedFeedback, targetRole }: RatingCardProps) {
  const pct = Math.min(100, Math.round(score * 10));
  const band = getBandForScore(score);

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-800 mb-3">Fit for {targetRole}</h3>
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-bold text-slate-800">{score.toFixed(1)}</span>
        <span className="text-slate-500">/ 10</span>
      </div>
      <div className="flex gap-4">
        <div className="relative w-8 rounded-lg overflow-hidden bg-slate-200" style={{ height: 140 }}>
          <div
            className={`absolute bottom-0 left-0 right-0 ${band.color} transition-all duration-500`}
            style={{ height: `${pct}%` }}
          />
        </div>
        <div className="flex flex-col justify-between text-xs py-0.5" style={{ height: 140 }}>
          {METER_BANDS.slice().reverse().map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <span className={`font-medium ${b.label === band.label ? b.textColor : "text-slate-500"}`}>
                {b.label}
              </span>
              <span className="text-slate-400">{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>
      {personalizedFeedback && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-1">Personalized feedback</p>
          <p className="text-sm text-slate-700 leading-relaxed">{personalizedFeedback}</p>
        </div>
      )}
    </div>
  );
}
