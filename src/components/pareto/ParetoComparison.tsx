import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const strategies = [
  {
    name: 'No Pruning (Brute Force)',
    preprocessing: 'O(1)',
    searchSpace: 'O(nˢ)',
    topKSafe: { label: 'Exact', tone: 'text-cursor', icon: 'check' as const },
    setBonusSafe: { label: 'Exact', tone: 'text-cursor', icon: 'check' as const },
    verdict: 'Explodes exponentially once a stash holds 10+ items per slot.',
  },
  {
    name: 'Naive 1-Dominator Pruning',
    preprocessing: 'O(s · n²)',
    searchSpace: 'O(kˢ)',
    topKSafe: { label: 'Drops Runner-Ups', tone: 'text-gap', icon: 'x' as const },
    setBonusSafe: { label: 'Breaks Set Pieces', tone: 'text-gap', icon: 'x' as const },
    verdict: 'Fast, but discards Tal Rasha / set pieces and crowds out top-K diversity.',
  },
  {
    name: 'Set-Aware Top-K Pareto',
    preprocessing: 'O(s · n²)',
    searchSpace: 'O(kˢ) (k ≪ n)',
    topKSafe: { label: 'Preserves Top-K', tone: 'text-cursor', icon: 'check' as const },
    setBonusSafe: { label: 'Isolated by set_sig', tone: 'text-cursor', icon: 'check' as const },
    verdict: 'Exact for top-K distinct builds & set bonuses while slashing combinations.',
  },
];

function formatBigCount(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function ParetoComparison() {
  const [itemsPerSlot, setItemsPerSlot] = useState(12);
  const [keptPerSlot, setKeptPerSlot] = useState(4);
  const [slots, setSlots] = useState(7);

  const clampedKept = Math.min(keptPerSlot, itemsPerSlot);
  const rawCombos = Math.pow(itemsPerSlot, slots);
  const prunedCombos = Math.pow(clampedKept, slots);
  const speedup = prunedCombos > 0 ? rawCombos / prunedCombos : 1;
  const eliminatedPct =
    rawCombos > 0 ? ((1 - prunedCombos / rawCombos) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Strategy Matrix */}
      <div className="bg-editor-mid rounded-2xl border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-xs text-text-secondary bg-editor-dark/60">
                <th className="text-left px-4 py-3 font-medium">Strategy</th>
                <th className="text-left px-4 py-3 font-medium">Pre-Pass</th>
                <th className="text-left px-4 py-3 font-medium">Downstream Search</th>
                <th className="text-left px-4 py-3 font-medium">Top-K Accuracy</th>
                <th className="text-left px-4 py-3 font-medium">Set Bonuses</th>
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
                    <div className="text-xs text-text-secondary mt-0.5">{row.verdict}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-text-primary whitespace-nowrap">
                    {row.preprocessing}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-text-primary whitespace-nowrap">
                    {row.searchSpace}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${row.topKSafe.tone}`}>
                      {row.topKSafe.icon === 'check' ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                      {row.topKSafe.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${row.setBonusSafe.tone}`}>
                      {row.setBonusSafe.icon === 'check' ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <AlertTriangle size={14} />
                      )}
                      {row.setBonusSafe.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Multiplicative Search-Space Calculator */}
      <div className="bg-editor-mid rounded-2xl p-6 border border-white/8 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Interactive Search-Space Collapse Calculator
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Because slot choices multiply (<span className="font-mono text-text-primary">nˢ</span> vs{' '}
            <span className="font-mono text-cursor">kˢ</span>), even modest per-slot pruning cuts millions of downstream gear evaluations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="calc-raw" className="text-text-secondary">
                Raw Items per Slot (n)
              </label>
              <span className="font-mono font-bold text-text-primary tabular-nums">
                {itemsPerSlot} items
              </span>
            </div>
            <input
              id="calc-raw"
              type="range"
              min={4}
              max={24}
              value={itemsPerSlot}
              onChange={(e) => {
                const next = Number(e.target.value);
                setItemsPerSlot(next);
                if (keptPerSlot > next) setKeptPerSlot(next);
              }}
              className="w-full accent-[#ff6b9d] cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="calc-kept" className="text-text-secondary">
                Kept After Pruning (k)
              </label>
              <span className="font-mono font-bold text-cursor tabular-nums">
                {clampedKept} items
              </span>
            </div>
            <input
              id="calc-kept"
              type="range"
              min={1}
              max={itemsPerSlot}
              value={clampedKept}
              onChange={(e) => setKeptPerSlot(Number(e.target.value))}
              className="w-full accent-[#00d4aa] cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="calc-slots" className="text-text-secondary">
                Equipment Slots (s)
              </label>
              <span className="font-mono font-bold text-text-primary tabular-nums">
                {slots} slots
              </span>
            </div>
            <input
              id="calc-slots"
              type="range"
              min={4}
              max={9}
              value={slots}
              onChange={(e) => setSlots(Number(e.target.value))}
              className="w-full accent-[#22d3ee] cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-editor-dark rounded-xl p-4 border border-white/8">
            <div className="text-xs text-text-secondary">Unpruned Combinations (nˢ)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-gap mt-1">
              {formatBigCount(rawCombos)}
            </div>
            <div className="text-[11px] font-mono text-text-secondary/70 mt-1 tabular-nums">
              {itemsPerSlot}^{slots}
            </div>
          </div>

          <div className="bg-editor-dark rounded-xl p-4 border border-white/8">
            <div className="text-xs text-text-secondary">Pruned Combinations (kˢ)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-cursor mt-1">
              {formatBigCount(prunedCombos)}
            </div>
            <div className="text-[11px] font-mono text-text-secondary/70 mt-1 tabular-nums">
              {clampedKept}^{slots}
            </div>
          </div>

          <div className="bg-editor-dark rounded-xl p-4 border border-white/8">
            <div className="text-xs text-text-secondary">Search-Space Speedup</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-text-primary mt-1">
              {speedup >= 1000 ? `${formatBigCount(Math.round(speedup))}×` : `${speedup.toFixed(1)}×`}
            </div>
            <div className="text-[11px] font-mono text-cursor mt-1 tabular-nums">
              {eliminatedPct}% eliminated before DFS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
