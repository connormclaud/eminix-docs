import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const strategies = [
  {
    name: 'Brute-Force DFS',
    perNodeCost: 'O(1)',
    leavesVisited: '100% (kˢ)',
    exactness: { label: 'Exact', tone: 'text-cursor', icon: 'check' as const },
    pruningPower: { label: 'None', tone: 'text-gap', icon: 'x' as const },
    note: 'Evaluates every leaf even when early slots make breakpoints impossible.',
  },
  {
    name: 'Feasibility Pruning Only',
    perNodeCost: 'O(d)',
    leavesVisited: 'Moderate',
    exactness: { label: 'Exact', tone: 'text-cursor', icon: 'check' as const },
    pruningPower: { label: 'Breakpoint Cuts Only', tone: 'text-set-gold', icon: 'warn' as const },
    note: 'Cuts invalid FCR/Res branches early, but still explores all feasible low-score builds.',
  },
  {
    name: 'Full Branch-and-Bound (Suffix + Set Bitmask + Top-K)',
    perNodeCost: 'O(d)',
    leavesVisited: 'Tiny fraction',
    exactness: { label: '100% Exact', tone: 'text-cursor', icon: 'check' as const },
    pruningPower: { label: 'Tightest Bounds', tone: 'text-cursor', icon: 'check' as const },
    note: 'Combines O(1) suffix maxima, exact 2-piece set reachability masks, and rising Top-K cutoffs.',
  },
];

export default function BranchAndBoundComparison() {
  const [itemsPerSlot, setItemsPerSlot] = useState(4);
  const [slots, setSlots] = useState(8);
  const [pruneDepth, setPruneDepth] = useState(2);

  const clampedDepth = Math.min(pruneDepth, slots - 1);
  const totalLeaves = Math.pow(itemsPerSlot, slots);
  const skippedLeaves = Math.pow(itemsPerSlot, slots - clampedDepth);
  const shareOfTree = ((skippedLeaves / totalLeaves) * 100).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Comparison Matrix */}
      <div className="bg-editor-mid rounded-2xl border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-xs text-text-secondary bg-editor-dark/60">
                <th className="text-left px-4 py-3 font-medium">Search Strategy</th>
                <th className="text-left px-4 py-3 font-medium">Check / Node</th>
                <th className="text-left px-4 py-3 font-medium">Leaves Evaluated</th>
                <th className="text-left px-4 py-3 font-medium">Optimality</th>
                <th className="text-left px-4 py-3 font-medium">Pruning Strength</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {strategies.map((row, idx) => (
                <tr
                  key={row.name}
                  className={idx === 2 ? 'bg-cursor/[0.05]' : 'hover:bg-white/[0.02]'}
                >
                  <td className="px-4 py-3.5">
                    <div
                      className={`font-semibold ${
                        idx === 2 ? 'text-cursor' : 'text-text-primary'
                      }`}
                    >
                      {row.name}
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">{row.note}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-text-primary whitespace-nowrap">
                    {row.perNodeCost}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-text-primary whitespace-nowrap">
                    {row.leavesVisited}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${row.exactness.tone}`}>
                      <CheckCircle2 size={14} />
                      {row.exactness.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${row.pruningPower.tone}`}>
                      {row.pruningPower.icon === 'check' && <CheckCircle2 size={14} />}
                      {row.pruningPower.icon === 'warn' && <AlertTriangle size={14} />}
                      {row.pruningPower.icon === 'x' && <XCircle size={14} />}
                      {row.pruningPower.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Depth-of-Prune Leverage Calculator */}
      <div className="bg-editor-mid rounded-2xl p-6 border border-white/8 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Why Pruning Early Matters Exponentially
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Cutting a single branch at depth <span className="font-mono text-text-primary">d</span> skips{' '}
            <span className="font-mono text-cursor">k^(s − d)</span> downstream leaf evaluations in one check.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="bnb-calc-k" className="text-text-secondary">
                Pruned Items per Slot (k)
              </label>
              <span className="font-mono font-bold text-text-primary tabular-nums">
                {itemsPerSlot} / slot
              </span>
            </div>
            <input
              id="bnb-calc-k"
              type="range"
              min={2}
              max={6}
              value={itemsPerSlot}
              onChange={(e) => setItemsPerSlot(Number(e.target.value))}
              className="w-full accent-[#00d4aa] cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="bnb-calc-s" className="text-text-secondary">
                Equipment Slots (s)
              </label>
              <span className="font-mono font-bold text-text-primary tabular-nums">
                {slots} slots
              </span>
            </div>
            <input
              id="bnb-calc-s"
              type="range"
              min={4}
              max={9}
              value={slots}
              onChange={(e) => {
                const next = Number(e.target.value);
                setSlots(next);
                if (pruneDepth >= next) setPruneDepth(next - 1);
              }}
              className="w-full accent-[#22d3ee] cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="bnb-calc-d" className="text-text-secondary">
                Depth Where Pruned (d)
              </label>
              <span className="font-mono font-bold text-set-gold tabular-nums">
                Depth {clampedDepth}
              </span>
            </div>
            <input
              id="bnb-calc-d"
              type="range"
              min={1}
              max={slots - 1}
              value={clampedDepth}
              onChange={(e) => setPruneDepth(Number(e.target.value))}
              className="w-full accent-[#f59e0b] cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-editor-dark rounded-xl p-4 border border-white/8">
            <div className="text-xs text-text-secondary">Full Tree Leaves (kˢ)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-text-primary mt-1">
              {totalLeaves.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-text-secondary/70 mt-1 tabular-nums">
              {itemsPerSlot}^{slots} ({itemsPerSlot}/slot)
            </div>
          </div>

          <div className="bg-editor-dark rounded-xl p-4 border border-white/8">
            <div className="text-xs text-text-secondary">Leaves Skipped by 1 Cut</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-cursor mt-1">
              {skippedLeaves.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-text-secondary/70 mt-1 tabular-nums">
              {itemsPerSlot}^({slots} − {clampedDepth}) = {itemsPerSlot}^{slots - clampedDepth}
            </div>
          </div>

          <div className="bg-editor-dark rounded-xl p-4 border border-white/8">
            <div className="text-xs text-text-secondary">Share of Whole Tree</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-set-gold mt-1">
              {shareOfTree}%
            </div>
            <div className="text-[11px] font-mono text-text-secondary/70 mt-1">
              eliminated in one O(1) check
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
