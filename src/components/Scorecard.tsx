import type { TeeData } from "../types";

interface ScorecardProps {
  tees: TeeData;
  label: string;
}

export function Scorecard({ tees, label }: ScorecardProps) {
  const front9 = tees.holes.slice(0, 9);
  const back9 = tees.holes.slice(9, 18);
  const frontPar = front9.reduce((s, h) => s + h.par, 0);
  const backPar = back9.reduce((s, h) => s + h.par, 0);
  const frontYards = front9.reduce((s, h) => s + h.yardage, 0);
  const backYards = back9.reduce((s, h) => s + h.yardage, 0);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          {label}
        </span>
        <span className="text-xs text-slate-500">
          {tees.tee_name} tees &middot; Rating {tees.course_rating} &middot; Slope{" "}
          {tees.slope_rating}
        </span>
      </div>
      <table className="w-full text-xs min-w-[640px]">
        <thead>
          <tr className="text-slate-400">
            <th className="text-left py-1.5 px-2 font-medium">Hole</th>
            {front9.map((_, i) => (
              <th key={i} className="py-1.5 px-1.5 font-medium text-center">
                {i + 1}
              </th>
            ))}
            <th className="py-1.5 px-2 font-bold text-center text-emerald-400">OUT</th>
            {back9.map((_, i) => (
              <th key={i + 9} className="py-1.5 px-1.5 font-medium text-center">
                {i + 10}
              </th>
            ))}
            <th className="py-1.5 px-2 font-bold text-center text-emerald-400">IN</th>
            <th className="py-1.5 px-2 font-bold text-center text-emerald-400">TOT</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-slate-800/50">
            <td className="py-1.5 px-2 font-medium text-slate-300">Par</td>
            {front9.map((h, i) => (
              <td key={i} className="py-1.5 px-1.5 text-center text-white">
                {h.par}
              </td>
            ))}
            <td className="py-1.5 px-2 text-center font-bold text-emerald-400">{frontPar}</td>
            {back9.map((h, i) => (
              <td key={i + 9} className="py-1.5 px-1.5 text-center text-white">
                {h.par}
              </td>
            ))}
            <td className="py-1.5 px-2 text-center font-bold text-emerald-400">{backPar}</td>
            <td className="py-1.5 px-2 text-center font-bold text-emerald-400">
              {tees.par_total}
            </td>
          </tr>
          <tr>
            <td className="py-1.5 px-2 font-medium text-slate-300">Yards</td>
            {front9.map((h, i) => (
              <td key={i} className="py-1.5 px-1.5 text-center text-slate-400">
                {h.yardage}
              </td>
            ))}
            <td className="py-1.5 px-2 text-center font-bold text-slate-300">{frontYards}</td>
            {back9.map((h, i) => (
              <td key={i + 9} className="py-1.5 px-1.5 text-center text-slate-400">
                {h.yardage}
              </td>
            ))}
            <td className="py-1.5 px-2 text-center font-bold text-slate-300">{backYards}</td>
            <td className="py-1.5 px-2 text-center font-bold text-slate-300">
              {tees.total_yards}
            </td>
          </tr>
          <tr className="bg-slate-800/50">
            <td className="py-1.5 px-2 font-medium text-slate-300">Hdcp</td>
            {front9.map((h, i) => (
              <td key={i} className="py-1.5 px-1.5 text-center text-slate-500">
                {h.handicap}
              </td>
            ))}
            <td className="py-1.5 px-2"></td>
            {back9.map((h, i) => (
              <td key={i + 9} className="py-1.5 px-1.5 text-center text-slate-500">
                {h.handicap}
              </td>
            ))}
            <td className="py-1.5 px-2"></td>
            <td className="py-1.5 px-2"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
