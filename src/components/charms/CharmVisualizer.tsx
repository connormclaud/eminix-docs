import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  Table2,
  Zap,
  Scale,
} from 'lucide-react';
import { CHARM_PRESETS, type CharmPresetId } from '@/data/charmPresets';
import {
  charmObjectiveValue,
  solveCharmKnapsack,
  type CharmItem,
  type CharmObjective,
  type SolverFlags,
} from '@/utils/charmSolver';

type PackedColumn = {
  colIndex: number;
  capacity: number;
  items: CharmItem[];
  emptySlots: number;
};

/**
 * Packs selected charms into vertical Diablo 2 inventory columns (up to 4 rows tall)
 * matching the active slot budget.
 */
function packIntoColumns(charms: CharmItem[], slotBudget: number): PackedColumn[] {
  const colCount = Math.max(1, Math.ceil(slotBudget / 4));
  const capacities: number[] = [];
  let rem = slotBudget;
  for (let i = 0; i < colCount; i++) {
    const cap = Math.min(4, rem);
    capacities.push(cap);
    rem -= cap;
  }

  const cols: PackedColumn[] = capacities.map((capacity, colIndex) => ({
    colIndex,
    capacity,
    items: [],
    emptySlots: capacity,
  }));

  // First-fit decreasing height (Grand -> Large -> Small) mirrors real D2 inventory packing
  const sorted = [...charms].sort((a, b) => b.size - a.size);
  for (const ch of sorted) {
    const target = cols.find((c) => c.emptySlots >= ch.size);
    if (target) {
      target.items.push(ch);
      target.emptySlots -= ch.size;
    }
  }

  return cols;
}

function classifyCharm(
  charm: CharmItem,
  objective: CharmObjective
): { label: string; tone: string; cardBorder: string; cardBg: string } {
  const objVal = charmObjectiveValue(charm, objective);
  if (objVal > 0 && (charm.allRes > 0 || charm.fhr > 0)) {
    return {
      label: 'Hybrid',
      tone: 'text-cyan-400',
      cardBorder: 'border-cyan-400/50',
      cardBg: 'bg-cyan-400/12',
    };
  }
  if (objVal > 0) {
    return {
      label: objective === 'skills' ? '+Skills' : 'Magic Find',
      tone: 'text-cursor',
      cardBorder: 'border-cursor/50',
      cardBg: 'bg-cursor/12',
    };
  }
  if (charm.allRes > 0 && charm.fhr === 0) {
    return {
      label: 'Pure Res (DP)',
      tone: 'text-set-gold',
      cardBorder: 'border-set-gold/50',
      cardBg: 'bg-set-gold/12',
    };
  }
  return {
    label: 'Pure FHR (DP)',
    tone: 'text-gap',
    cardBorder: 'border-gap/50',
    cardBg: 'bg-gap/12',
  };
}

export default function CharmVisualizer() {
  const [presetId, setPresetId] = useState<CharmPresetId>('sorc-skillers');
  const activePreset =
    CHARM_PRESETS.find((p) => p.id === presetId) ?? CHARM_PRESETS[0];

  const [slotBudget, setSlotBudget] = useState(activePreset.defaultConstraints.slotBudget);
  const [needRes, setNeedRes] = useState(activePreset.defaultConstraints.needRes);
  const [needFhr, setNeedFhr] = useState(activePreset.defaultConstraints.needFhr);
  const [flags, setFlags] = useState<SolverFlags>({
    useGreedySeed: true,
    usePureAxisDp: true,
    useFractionalBound: true,
  });
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const handleSelectPreset = (id: CharmPresetId) => {
    const preset = CHARM_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPresetId(id);
    setSlotBudget(preset.defaultConstraints.slotBudget);
    setNeedRes(preset.defaultConstraints.needRes);
    setNeedFhr(preset.defaultConstraints.needFhr);
    setFlags({
      useGreedySeed: true,
      usePureAxisDp: true,
      useFractionalBound: true,
    });
    setHighlightedId(null);
  };

  const constraints = useMemo(
    () => ({
      slotBudget,
      needRes,
      needFhr,
      objective: activePreset.defaultConstraints.objective,
    }),
    [slotBudget, needRes, needFhr, activePreset.defaultConstraints.objective]
  );

  const result = useMemo(
    () => solveCharmKnapsack(activePreset.charms, constraints, flags),
    [activePreset.charms, constraints, flags]
  );

  const naiveBaseline = useMemo(
    () =>
      solveCharmKnapsack(activePreset.charms, constraints, {
        useGreedySeed: false,
        usePureAxisDp: false,
        useFractionalBound: false,
      }),
    [activePreset.charms, constraints]
  );

  const optimalIds = useMemo(
    () => new Set(result.optimal.charms.map((c) => c.id)),
    [result.optimal.charms]
  );

  const columns = useMemo(
    () =>
      result.optimal.feasible
        ? packIntoColumns(result.optimal.charms, slotBudget)
        : packIntoColumns([], slotBudget),
    [result.optimal, slotBudget]
  );

  const objLabel = constraints.objective === 'skills' ? '+Skills' : 'MF';
  const objUnit = constraints.objective === 'skills' ? '' : '%';
  const exactBeatsGreedy =
    result.optimal.feasible &&
    (!result.greedy.feasible || result.optimal.score > result.greedy.score);

  const nodeSavingsPct =
    naiveBaseline.dfsNodes > 0
      ? Math.max(
          0,
          Math.round(
            ((naiveBaseline.dfsNodes - result.dfsNodes) / naiveBaseline.dfsNodes) * 100
          )
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Preset Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-editor-mid border border-white/8 rounded-xl"
          role="tablist"
          aria-label="Charm packing scenarios"
        >
          {CHARM_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor ${
                presetId === preset.id
                  ? 'bg-cursor/15 text-cursor border border-cursor/30'
                  : 'text-text-secondary hover:text-text-primary border border-transparent'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleSelectPreset(presetId)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-editor-mid hover:bg-editor-light border border-white/8 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor"
        >
          <RotateCcw size={14} />
          Reset Preset
        </button>
      </div>

      {/* Two-Zone Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Stage (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Diablo 2 Charm Inventory Grid */}
          <div className="bg-editor-mid rounded-2xl p-5 border border-white/8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  Optimal Charm Inventory Packing
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Each column is 4 inventory tiles tall: Small (1×1), Large (1×2), and Grand (1×3) charms.
                </p>
              </div>
              <div className="text-xs font-mono tabular-nums text-text-secondary">
                Used <span className="text-cursor font-bold">{result.optimal.usedSlots}</span> /{' '}
                {slotBudget} slots
              </div>
            </div>

            {!result.optimal.feasible ? (
              <div className="bg-editor-dark rounded-xl border border-gap/35 p-6 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-gap">
                  <XCircle size={16} />
                  No Feasible Packing Within {slotBudget} Slots
                </div>
                <p className="text-xs text-text-secondary">
                  Increase the slot budget or lower Min All Res ({needRes}%) / Min FHR ({needFhr}%) to find a valid charm loadout.
                </p>
              </div>
            ) : (
              <div className="bg-editor-dark rounded-xl border border-white/8 p-4 overflow-x-auto">
                <div className="flex gap-2.5 min-w-max">
                  {columns.map((col) => (
                    <div
                      key={col.colIndex}
                      className="w-[108px] flex flex-col gap-1.5"
                    >
                      <div className="text-[10px] font-mono text-text-secondary/70 text-center tabular-nums">
                        Col {col.colIndex + 1} ({col.capacity})
                      </div>
                      {col.items.map((ch) => {
                        const cls = classifyCharm(ch, constraints.objective);
                        const isHi = highlightedId === ch.id;
                        const heightClass =
                          ch.size === 3
                            ? 'h-[138px]'
                            : ch.size === 2
                              ? 'h-[90px]'
                              : 'h-[42px]';
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() =>
                              setHighlightedId((prev) => (prev === ch.id ? null : ch.id))
                            }
                            className={`w-full ${heightClass} rounded-lg border px-2 py-1.5 text-left flex flex-col justify-between transition-all ${cls.cardBorder} ${cls.cardBg} ${
                              isHi ? 'ring-2 ring-white' : 'hover:brightness-110'
                            }`}
                          >
                            <div className="text-[10.5px] font-semibold text-text-primary leading-tight line-clamp-2">
                              {ch.name}
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono tabular-nums">
                              <span className={cls.tone}>
                                {ch.skills > 0
                                  ? `+${ch.skills} Sk`
                                  : ch.mf > 0
                                    ? `${ch.mf}% MF`
                                    : ch.allRes > 0
                                      ? `+${ch.allRes} Res`
                                      : `+${ch.fhr} FHR`}
                              </span>
                              <span className="text-text-secondary">1×{ch.size}</span>
                            </div>
                          </button>
                        );
                      })}
                      {Array.from({ length: col.emptySlots }).map((_, emptyIdx) => (
                        <div
                          key={`empty-${col.colIndex}-${emptyIdx}`}
                          className="w-full h-[42px] rounded-lg border border-dashed border-white/10 bg-white/[0.015] flex items-center justify-center text-[10px] font-mono text-text-secondary/40"
                        >
                          empty
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Greedy vs Exact Comparison Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-editor-dark rounded-xl p-3.5 border border-white/8 flex items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-text-secondary font-medium">
                    <Zap size={13} className="text-cyan-400" />
                    Greedy Seed Heuristic
                  </div>
                  <div className="font-mono text-sm font-bold text-text-primary mt-1 tabular-nums">
                    {result.greedy.feasible
                      ? `${result.greedy.score}${objUnit} ${objLabel} (${result.greedy.usedSlots}/${slotBudget} slots)`
                      : 'Infeasible'}
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-text-secondary tabular-nums">
                  <div>+{result.greedy.totalRes}% Res</div>
                  <div>+{result.greedy.totalFhr}% FHR</div>
                </div>
              </div>

              <div
                className={`bg-editor-dark rounded-xl p-3.5 border flex items-center justify-between gap-3 ${
                  exactBeatsGreedy ? 'border-cursor/50' : 'border-white/8'
                }`}
              >
                <div>
                  <div className="inline-flex items-center gap-1.5 text-cursor font-semibold">
                    <Sparkles size={13} />
                    Exact Hybrid Optimum
                  </div>
                  <div className="font-mono text-sm font-bold text-cursor mt-1 tabular-nums">
                    {result.optimal.feasible
                      ? `${result.optimal.score}${objUnit} ${objLabel} (${result.optimal.usedSlots}/${slotBudget} slots)`
                      : 'Infeasible'}
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-text-secondary tabular-nums">
                  {exactBeatsGreedy ? (
                    <div className="text-cursor font-bold">
                      +{result.optimal.score - (result.greedy.feasible ? result.greedy.score : 0)}
                      {objUnit} over Greedy
                    </div>
                  ) : (
                    <div>Matches Greedy</div>
                  )}
                  <div>
                    +{result.optimal.totalRes}% Res · +{result.optimal.totalFhr}% FHR
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 1D Pure-Axis DP Tables Inspector */}
          <div className="bg-editor-mid rounded-2xl p-5 border border-white/8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Table2 size={16} className="text-set-gold" />
                <h3 className="text-sm font-semibold text-text-primary">
                  Precomputed 1D Pure-Axis DP Tables
                </h3>
              </div>
              <span className="text-xs font-mono text-text-secondary tabular-nums">
                {flags.usePureAxisDp
                  ? `Offloaded ${result.pureResCharms.length + result.pureFhrCharms.length} pure charms from DFS`
                  : '1D DP disabled — all charms branched in DFS'}
              </span>
            </div>

            {flags.usePureAxisDp ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Pure All Res DP', dp: result.pureResDp, color: 'text-set-gold', unit: '% Res' },
                  { title: 'Pure FHR DP', dp: result.pureFhrDp, color: 'text-gap', unit: '% FHR' },
                ].map(({ title, dp, color, unit }) => (
                  <div key={title} className="bg-editor-dark rounded-xl p-3.5 border border-white/8 space-y-2.5">
                    <div className="flex justify-between text-xs">
                      <span className={`font-semibold ${color}`}>{title}</span>
                      <span className="font-mono text-text-secondary tabular-nums">
                        Max +{dp.maxAchievable}
                        {unit}
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-1 text-center font-mono text-[11px] tabular-nums">
                      {dp.maxGain.slice(0, Math.min(6, dp.maxGain.length)).map((val, slots) => (
                        <div
                          key={slots}
                          className="bg-editor-mid rounded-md py-1.5 px-1 border border-white/8"
                        >
                          <div className="text-[9px] text-text-secondary">{slots}s</div>
                          <div className="font-bold text-text-primary mt-0.5">+{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-secondary bg-editor-dark rounded-xl p-3.5 border border-white/8">
                Enable <span className="text-text-primary font-semibold">1D Pure-Axis DP</span> in the right control deck to peel pure resistance and FHR charms out of the branching tree into O(1) lookup tables.
              </p>
            )}
          </div>

          {/* Stash Charm Pool Table */}
          <div className="bg-editor-mid rounded-2xl border border-white/8 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/8 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-text-primary">
                Stash Charm Pool ({activePreset.charms.length})
              </h3>
              <span className="text-xs font-mono text-text-secondary tabular-nums">
                Branching: {result.branchingCharms.length} · DP Tables:{' '}
                {result.pureResCharms.length + result.pureFhrCharms.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-xs text-text-secondary bg-editor-dark/60">
                    <th className="text-left px-4 py-2.5 font-medium">Charm</th>
                    <th className="text-right px-2.5 py-2.5 font-medium">Size</th>
                    <th className="text-right px-2.5 py-2.5 font-medium">+Sk</th>
                    <th className="text-right px-2.5 py-2.5 font-medium">Res</th>
                    <th className="text-right px-2.5 py-2.5 font-medium">FHR</th>
                    <th className="text-right px-2.5 py-2.5 font-medium">MF</th>
                    <th className="text-left px-3 py-2.5 font-medium">Role</th>
                    <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {activePreset.charms.map((ch) => {
                    const cls = classifyCharm(ch, constraints.objective);
                    const picked = optimalIds.has(ch.id);
                    const isHi = highlightedId === ch.id;
                    return (
                      <tr
                        key={ch.id}
                        onClick={() =>
                          setHighlightedId((prev) => (prev === ch.id ? null : ch.id))
                        }
                        className={`cursor-pointer transition-colors ${
                          isHi ? 'bg-cursor/10' : 'hover:bg-white/[0.025]'
                        } ${!picked ? 'opacity-65' : ''}`}
                      >
                        <td className="px-4 py-2.5 text-xs font-medium text-text-primary">
                          {ch.name}
                        </td>
                        <td className="px-2.5 py-2.5 text-right font-mono text-xs tabular-nums text-text-secondary">
                          1×{ch.size}
                        </td>
                        <td className="px-2.5 py-2.5 text-right font-mono text-xs tabular-nums text-text-primary">
                          {ch.skills > 0 ? `+${ch.skills}` : '—'}
                        </td>
                        <td className="px-2.5 py-2.5 text-right font-mono text-xs tabular-nums text-text-primary">
                          {ch.allRes > 0 ? `+${ch.allRes}%` : '—'}
                        </td>
                        <td className="px-2.5 py-2.5 text-right font-mono text-xs tabular-nums text-text-primary">
                          {ch.fhr > 0 ? `+${ch.fhr}%` : '—'}
                        </td>
                        <td className="px-2.5 py-2.5 text-right font-mono text-xs tabular-nums text-text-primary">
                          {ch.mf > 0 ? `${ch.mf}%` : '—'}
                        </td>
                        <td className={`px-3 py-2.5 text-xs font-mono whitespace-nowrap ${cls.tone}`}>
                          {cls.label}
                        </td>
                        <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                          {picked ? (
                            <span className="inline-flex items-center gap-1 text-cursor font-semibold">
                              <CheckCircle2 size={13} />
                              Packed
                            </span>
                          ) : (
                            <span className="text-text-secondary">Skipped</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Control Deck (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-editor-mid rounded-2xl p-5 border border-white/8 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Solver Controls &amp; Budget
              </h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                {activePreset.summary}
              </p>
            </div>

            {/* Live Efficiency Counters */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono tabular-nums">
              <div className="bg-editor-dark rounded-xl p-2.5 border border-white/8">
                <div className="text-base font-bold text-cursor">{result.dfsNodes}</div>
                <div className="text-[10px] text-text-secondary">DFS Nodes</div>
              </div>
              <div className="bg-editor-dark rounded-xl p-2.5 border border-white/8">
                <div className="text-base font-bold text-set-gold">
                  {result.prunedFeasibility}
                </div>
                <div className="text-[10px] text-text-secondary">Feas. Cuts</div>
              </div>
              <div className="bg-editor-dark rounded-xl p-2.5 border border-white/8">
                <div className="text-base font-bold text-gap">{result.prunedBound}</div>
                <div className="text-[10px] text-text-secondary">Bound Cuts</div>
              </div>
            </div>

            <div className="bg-editor-dark rounded-xl px-3.5 py-2.5 border border-white/8 flex items-center justify-between text-xs font-mono tabular-nums">
              <span className="text-text-secondary">Unoptimized DFS baseline</span>
              <span className="text-text-primary font-semibold">
                {naiveBaseline.dfsNodes} nodes ({nodeSavingsPct}% cut)
              </span>
            </div>

            {/* Constraint Sliders */}
            <div className="space-y-3.5 pt-2 border-t border-white/8">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label htmlFor="ch-budget" className="text-text-primary font-medium">
                    Inventory Slot Budget
                  </label>
                  <span className="font-mono font-bold text-cursor tabular-nums">
                    {slotBudget} slots
                  </span>
                </div>
                <input
                  id="ch-budget"
                  type="range"
                  min={6}
                  max={18}
                  step={1}
                  value={slotBudget}
                  onChange={(e) => setSlotBudget(Number(e.target.value))}
                  className="w-full accent-[#00d4aa] cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label htmlFor="ch-res" className="text-text-primary font-medium">
                    Min All Res Shortfall
                  </label>
                  <span className="font-mono font-bold text-set-gold tabular-nums">
                    +{needRes}%
                  </span>
                </div>
                <input
                  id="ch-res"
                  type="range"
                  min={0}
                  max={45}
                  step={2}
                  value={needRes}
                  onChange={(e) => setNeedRes(Number(e.target.value))}
                  className="w-full accent-[#f59e0b] cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label htmlFor="ch-fhr" className="text-text-primary font-medium">
                    Min FHR Shortfall
                  </label>
                  <span className="font-mono font-bold text-gap tabular-nums">
                    +{needFhr}%
                  </span>
                </div>
                <input
                  id="ch-fhr"
                  type="range"
                  min={0}
                  max={20}
                  step={2}
                  value={needFhr}
                  onChange={(e) => setNeedFhr(Number(e.target.value))}
                  className="w-full accent-[#ff6b9d] cursor-pointer"
                />
              </div>
            </div>

            {/* Hybrid Layer Toggles */}
            <div className="space-y-3 pt-3 border-t border-white/8">
              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-text-primary">
                    Greedy Incumbent Seed
                  </div>
                  <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    Start DFS with the greedy score already active as a cutoff.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={flags.useGreedySeed}
                  onChange={(e) =>
                    setFlags((f) => ({ ...f, useGreedySeed: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 accent-[#22d3ee] cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-text-primary">
                    1D Pure-Axis DP Offloading
                  </div>
                  <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    Move pure Res &amp; FHR charms out of DFS into O(1) lookup tables.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={flags.usePureAxisDp}
                  onChange={(e) =>
                    setFlags((f) => ({ ...f, usePureAxisDp: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 accent-[#f59e0b] cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-text-primary">
                    Fractional Upper Bound
                  </div>
                  <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    Prune when Current + fractional density bound ≤ Best Score.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={flags.useFractionalBound}
                  onChange={(e) =>
                    setFlags((f) => ({ ...f, useFractionalBound: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 accent-[#00d4aa] cursor-pointer shrink-0"
                />
              </label>
            </div>
          </div>

          {/* Why All 3 Layers Matter Note */}
          <div className="bg-editor-mid rounded-2xl p-5 border border-white/8 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
              <Scale size={15} className="text-cursor" />
              Try Turning Off One Layer at a Time
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Notice that toggling any checkbox changes{' '}
              <span className="font-mono text-text-primary">DFS Nodes</span> dramatically while
              the <span className="text-cursor font-medium">Exact Hybrid Optimum</span> inventory
              score stays 100% unchanged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
