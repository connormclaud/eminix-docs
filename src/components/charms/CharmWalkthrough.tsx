import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Table2,
  CheckCircle2,
  XCircle,
  GitBranch,
  Scale,
} from 'lucide-react';
import { CHARM_PRESETS } from '@/data/charmPresets';
import { solveCharmKnapsack, type CharmStepKind } from '@/utils/charmSolver';

function stepBadge(kind: CharmStepKind) {
  switch (kind) {
    case 'greedy-seed':
      return {
        label: 'Phase 1: Greedy Seed',
        tone: 'text-cyan-400',
        icon: <Zap size={15} className="text-cyan-400 shrink-0" />,
      };
    case 'dp-ready':
      return {
        label: 'Phase 2: 1D DP Tables Built',
        tone: 'text-set-gold',
        icon: <Table2 size={15} className="text-set-gold shrink-0" />,
      };
    case 'dfs-accept':
      return {
        label: 'New Best Packing',
        tone: 'text-cursor',
        icon: <CheckCircle2 size={15} className="text-cursor shrink-0" />,
      };
    case 'dfs-prune-feasibility':
      return {
        label: 'Pruned — Infeasible',
        tone: 'text-gap',
        icon: <XCircle size={15} className="text-gap shrink-0" />,
      };
    case 'dfs-prune-bound':
      return {
        label: 'Pruned — Fractional Bound',
        tone: 'text-set-gold',
        icon: <Scale size={15} className="text-set-gold shrink-0" />,
      };
    case 'dfs-branch':
      return {
        label: 'Branch: Pick / Skip',
        tone: 'text-text-primary',
        icon: <GitBranch size={15} className="text-cyan-400 shrink-0" />,
      };
  }
}

export default function CharmWalkthrough() {
  const preset = CHARM_PRESETS[1]; // Greedy Knapsack Trap shows all 3 phases + beating greedy!

  const run = useMemo(
    () =>
      solveCharmKnapsack(preset.charms, preset.defaultConstraints, {
        useGreedySeed: true,
        usePureAxisDp: true,
        useFractionalBound: true,
      }),
    [preset]
  );

  const events = run.events;
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    if (stepIdx >= events.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setStepIdx((prev) => Math.min(events.length - 1, prev + 1));
    }, 1850);
    return () => window.clearTimeout(timer);
  }, [isPlaying, stepIdx, events.length]);

  const current = events[stepIdx];
  const badge = stepBadge(current.kind);

  return (
    <div className="bg-editor-mid rounded-2xl p-6 border border-white/8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Live Trace: Beating the Greedy Knapsack Trap ({events.length} Steps)
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Generated directly by <span className="font-mono text-text-primary">solveCharmKnapsack()</span> — watch Greedy seed a baseline, 1D DP peel off pure Res charms, and Exact DFS find a tighter integer packing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (stepIdx >= events.length - 1) setStepIdx(0);
              setIsPlaying((p) => !p);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-cursor/15 text-cursor border border-cursor/30 hover:bg-cursor/25 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Pause' : 'Auto-Play'}
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setStepIdx(0);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-editor-dark text-text-secondary hover:text-text-primary border border-white/10 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Step Scrubber */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-text-secondary tabular-nums">
          <span>
            Step {stepIdx + 1} of {events.length}
          </span>
          <span>
            Current Best:{' '}
            <strong className="text-cursor">
              {current.bestScore !== null ? `${current.bestScore}% MF` : 'None yet'}
            </strong>
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={events.length - 1}
          value={stepIdx}
          onChange={(e) => {
            setIsPlaying(false);
            setStepIdx(Number(e.target.value));
          }}
          aria-label="Step through hybrid charm solver events"
          className="w-full accent-[#00d4aa] cursor-pointer"
        />
      </div>

      {/* Active Step Frame */}
      <div
        className="bg-editor-dark rounded-xl p-5 border border-white/8 space-y-5 slide-in"
        key={current.step}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono text-text-secondary">
              Event #{current.step}
            </span>
            <h4 className="text-base font-semibold text-text-primary mt-0.5">
              {current.charmName}
            </h4>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${badge.tone}`}>
            {badge.icon}
            {badge.label}
          </span>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs tabular-nums">
          <div className="bg-editor-mid rounded-xl p-3 border border-white/8">
            <div className="text-[10px] text-text-secondary">Remaining Slots</div>
            <div className="text-base font-bold text-text-primary mt-1">
              {current.remSlots}
            </div>
            <div className="text-[10px] text-set-gold mt-0.5">
              {current.dpReservedSlots} reserved for DP
            </div>
          </div>

          <div className="bg-editor-mid rounded-xl p-3 border border-white/8">
            <div className="text-[10px] text-text-secondary">Res Shortfall Left</div>
            <div
              className={`text-base font-bold mt-1 ${
                current.needResLeft === 0 ? 'text-cursor' : 'text-set-gold'
              }`}
            >
              {current.needResLeft > 0 ? `+${current.needResLeft}%` : 'Met'}
            </div>
            <div className="text-[10px] text-text-secondary mt-0.5">Target +15%</div>
          </div>

          <div className="bg-editor-mid rounded-xl p-3 border border-white/8">
            <div className="text-[10px] text-text-secondary">Current Score</div>
            <div className="text-base font-bold text-cyan-400 mt-1">
              {current.curScore}% MF
            </div>
            <div className="text-[10px] text-text-secondary mt-0.5">Packed so far</div>
          </div>

          <div className="bg-editor-mid rounded-xl p-3 border border-white/8">
            <div className="text-[10px] text-text-secondary">Fractional Upper Bound</div>
            <div className="text-base font-bold text-cursor mt-1">
              {current.upperBoundScore}% MF
            </div>
            <div className="text-[10px] text-text-secondary mt-0.5">
              Best: {current.bestScore !== null ? `${current.bestScore}%` : '—'}
            </div>
          </div>
        </div>

        {/* Currently Selected Charms */}
        <div className="bg-editor-mid rounded-xl p-3.5 border border-white/8 text-xs">
          <div className="text-text-secondary font-mono text-[11px] mb-1.5">
            Active Charm Subset ({current.pickedNames.length})
          </div>
          <div className="text-text-primary leading-relaxed">
            {current.pickedNames.length > 0
              ? current.pickedNames.join(' · ')
              : 'Empty inventory (root state)'}
          </div>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed">{current.detail}</p>
      </div>

      {/* Prev / Next */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setIsPlaying(false);
            setStepIdx((prev) => Math.max(0, prev - 1));
          }}
          disabled={stepIdx === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10 bg-editor-dark text-text-secondary hover:text-text-primary hover:bg-editor-light disabled:opacity-35 disabled:cursor-not-allowed whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <span className="text-xs font-mono text-text-secondary tabular-nums">
          Step {stepIdx + 1} / {events.length}
        </span>

        <button
          onClick={() => {
            setIsPlaying(false);
            setStepIdx((prev) => Math.min(events.length - 1, prev + 1));
          }}
          disabled={stepIdx === events.length - 1}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-cursor/15 text-cursor border border-cursor/30 hover:bg-cursor/25 disabled:opacity-35 disabled:cursor-not-allowed whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
