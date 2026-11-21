import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const strategies = [
  {
    name: 'Exhaustive Subset Search',
    complexity: 'O(2ᵐ)',
    exactness: { label: 'Exact', tone: 'text-cursor', icon: 'check' as const },
    speed: { label: 'Infeasible (m > 20)', tone: 'text-gap', icon: 'x' as const },
    note: 'Tests every pick/skip combination including dozens of pure single-stat charms.',
  },
  {
    name: 'Greedy Density Heuristic Only',
    complexity: 'O(m log m)',
    exactness: { label: 'Approximate', tone: 'text-set-gold', icon: 'warn' as const },
    speed: { label: 'Instant', tone: 'text-cursor', icon: 'check' as const },
    note: 'Fast baseline, but fails classic integer packing traps when 2-slot and 3-slot charms collide.',
  },
  {
    name: 'Branch-and-Bound Only (No 1D DP)',
    complexity: 'O(2ᵐ) worst',
    exactness: { label: 'Exact', tone: 'text-cursor', icon: 'check' as const },
    speed: { label: 'Slow on large stashes', tone: 'text-set-gold', icon: 'warn' as const },
    note: 'Wastes thousands of DFS branches picking between identical pure Res/FHR small charms.',
  },
  {
    name: 'Hybrid Solver (Greedy + 1D DP + Fractional Bound)',
    complexity: 'O(p·S + pruned 2ᵐ⁻ᵖ)',
    exactness: { label: '100% Exact', tone: 'text-cursor', icon: 'check' as const },
    speed: { label: 'Sub-millisecond', tone: 'text-cursor', icon: 'check' as const },
    note: 'Offloads p pure charms into O(1) DP tables, seeds an immediate cutoff, and prunes tightly.',
  },
];

function formatBig(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function CharmComparison() {
  const [totalCharms, setTotalCharms] = useState(24);
  const [pureCharms, setPureCharms] = useState(14);

  const clampedPure = Math.min(pureCharms, totalCharms - 2);
  const branchingCount = totalCharms - clampedPure;
  const fullSubsets = Math.pow(2, totalCharms);
  const reducedSubsets = Math.pow(2, branchingCount);
  const reductionFactor = Math.pow(2, clampedPure);

  return (
    <div className="space-y-6">
      {/* Comparison Matrix */}
      <div className="bg-editor-mid rounded-2xl border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-xs text-text-secondary bg-editor-dark/60">
                <th className="text-left px-4 py-3 font-medium">Solver Strategy</th>
                <th className="text-left px-4 py-3 font-medium">Complexity</th>
                <th className="text-left px-4 py-3 font-medium">Optimality</th>
                <th className="text-left px-4 py-3 font-medium">Practical Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {strategies.map((row, idx) => (
                <tr
                  key={row.name}
                  className={idx === 3 ? 'bg-cursor/[0.05]' : 'hover:bg-white/[0.02]'}
                >
                  <td className="px-4 py-3.5">
                    <div
                      className={`font-semibold ${
                        idx === 3 ? 'text-cursor' : 'text-text-primary'
                      }`}
                    >
                      {row.name}
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">{row.note}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-text-primary whitespace-nowrap">
                    {row.complexity}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${row.exactness.tone}`}>
                      {row.exactness.icon === 'check' ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <AlertTriangle size={14} />
                      )}
                      {row.exactness.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${row.speed.tone}`}>
                      {row.speed.icon === 'check' && <CheckCircle2 size={14} />}
                      {row.speed.icon === 'warn' && <AlertTriangle size={14} />}
                      {row.speed.icon === 'x' && <XCircle size={14} />}
                      {row.speed.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive 1D DP Offloading Calculator */}
      <div className="bg-editor-mid rounded-2xl p-6 border border-white/8 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            1D Pure-Axis DP Offloading Calculator
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Moving <span className="font-mono text-set-gold">p</span> pure single-stat charms out of
            DFS into 1D DP tables divides the branching search space by{' '}
            <span className="font-mono text-cursor">2ᵖ</span> before fractional bounds even start.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="dp-calc-m" className="text-text-secondary">
                Total Stash Charms (m)
              </label>
              <span className="font-mono font-bold text-text-primary tabular-nums">
                {totalCharms} charms
              </span>
            </div>
            <input
              id="dp-calc-m"
              type="range"
              min={10}
              max={30}
              value={totalCharms}
              onChange={(e) => {
                const next = Number(e.target.value);
                setTotalCharms(next);
                if (pureCharms > next - 2) setPureCharms(next - 2);
              }}
              className="w-full accent-[#ff6b9d] cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="dp-calc-p" className="text-text-secondary">
                Pure-Stat Charms Offloaded to 1D DP (p)
              </label>
              <span className="font-mono font-bold text-set-gold tabular-nums">
                {clampedPure} pure charms
              </span>
            </div>
            <input
              id="dp-calc-p"
              type="range"
              min={0}
              max={totalCharms - 2}
              value={clampedPure}
              onChange={(e) => setPureCharms(Number(e.target.value))}
              className="w-full accent-[#f59e0b] cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-editor-dark rounded-xl p-4 border border-white/8">
            <div className="text-xs text-text-secondary">Full Subset Tree (2ᵐ)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-gap mt-1">
              {formatBig(fullSubsets)}
            </div>
            <div className="text-[11px] font-mono text-text-secondary/70 mt-1 tabular-nums">
              2^{totalCharms}
            </div>
          </div>

          <div className="bg-editor-dark rounded-xl p-4 border border-white/8">
            <div className="text-xs text-text-secondary">Remaining DFS Space (2ᵐ⁻ᵖ)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-cursor mt-1">
              {formatBig(reducedSubsets)}
            </div>
            <div className="text-[11px] font-mono text-text-secondary/70 mt-1 tabular-nums">
              2^{branchingCount} ({branchingCount} branching charms)
            </div>
          </div>

          <div className="bg-editor-dark rounded-xl p-4 border border-white/8">
            <div className="text-xs text-text-secondary">DP Tree Shrink Factor (2ᵖ)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-set-gold mt-1">
              {formatBig(reductionFactor)}×
            </div>
            <div className="text-[11px] font-mono text-text-secondary/70 mt-1 tabular-nums">
              plus fractional bound cuts
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
