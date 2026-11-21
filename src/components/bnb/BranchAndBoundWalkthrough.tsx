import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Scissors,
  Trophy,
  GitBranch,
  XCircle,
} from 'lucide-react';
import { BNB_PRESETS } from '@/data/branchAndBoundPresets';
import {
  solveBranchAndBound,
  type NodeStatus,
  type TreeNodeEvent,
} from '@/utils/branchAndBound';

function eventBadge(status: NodeStatus) {
  switch (status) {
    case 'expanded':
      return {
        label: 'Expand Branch',
        tone: 'text-cyan-400',
        icon: <GitBranch size={15} className="text-cyan-400 shrink-0" />,
      };
    case 'pruned-feasibility':
      return {
        label: 'Pruned — Feasibility Cut',
        tone: 'text-gap',
        icon: <Scissors size={15} className="text-gap shrink-0" />,
      };
    case 'pruned-score':
      return {
        label: 'Pruned — Score Cutoff',
        tone: 'text-set-gold',
        icon: <Trophy size={15} className="text-set-gold shrink-0" />,
      };
    case 'leaf-accepted':
      return {
        label: 'Accepted into Top-K',
        tone: 'text-cursor',
        icon: <CheckCircle2 size={15} className="text-cursor shrink-0" />,
      };
    case 'leaf-infeasible':
      return {
        label: 'Leaf Rejected (Infeasible)',
        tone: 'text-gap',
        icon: <XCircle size={15} className="text-gap shrink-0" />,
      };
    case 'leaf-dominated':
      return {
        label: 'Leaf Rejected (Below Cutoff)',
        tone: 'text-text-secondary',
        icon: <XCircle size={15} className="text-text-secondary shrink-0" />,
      };
  }
}

export default function BranchAndBoundWalkthrough() {
  const preset = BNB_PRESETS[0]; // 105% FCR Sorceress

  const run = useMemo(
    () =>
      solveBranchAndBound(preset.slots, preset.setRules, preset.defaultConstraints, {
        useSuffixFeasibility: true,
        useSetBitmaskBounds: true,
        useScoreCutoff: true,
      }),
    [preset]
  );

  const events = run.events;
  const eventById = useMemo(() => {
    const map = new Map<number, TreeNodeEvent>();
    for (const ev of events) map.set(ev.nodeId, ev);
    return map;
  }, [events]);

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
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [isPlaying, stepIdx, events.length]);

  const current = events[stepIdx];
  const badge = eventBadge(current.status);

  // Build path from root to current event
  const pathItems = useMemo(() => {
    const chain: TreeNodeEvent[] = [];
    let cur: TreeNodeEvent | undefined = current;
    while (cur) {
      if (cur.pickedItem) chain.push(cur);
      cur = cur.parentId !== null ? eventById.get(cur.parentId) : undefined;
    }
    return chain.reverse();
  }, [current, eventById]);

  const prunedSoFar = useMemo(() => {
    let feas = 0;
    let score = 0;
    let accepted = 0;
    for (let i = 0; i <= stepIdx; i++) {
      if (events[i].status === 'pruned-feasibility') feas += 1;
      if (events[i].status === 'pruned-score') score += 1;
      if (events[i].status === 'leaf-accepted') accepted += 1;
    }
    return { feas, score, accepted };
  }, [events, stepIdx]);

  return (
    <div className="bg-editor-mid rounded-2xl p-6 border border-white/8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Live DFS Trace: 105% FCR Sorceress ({events.length} Visits vs 36 Leaves)
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Replayed directly from <span className="font-mono text-text-primary">solveBranchAndBound()</span> — watch DFS prune dead branches in real time.
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
          <span>Visit {stepIdx + 1} of {events.length}</span>
          <span>
            Depth {current.depth} · Top-2 Cutoff:{' '}
            <strong className="text-cursor">
              {current.cutoffAtVisit !== null ? `+${current.cutoffAtVisit} Skills` : 'Not full yet'}
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
          aria-label="Step through DFS events"
          className="w-full accent-[#00d4aa] cursor-pointer"
        />
      </div>

      {/* Active Node Stage */}
      <div
        className="bg-editor-dark rounded-xl p-5 border border-white/8 space-y-5 slide-in"
        key={current.nodeId}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono text-text-secondary">
              Node #{current.nodeId} · Slot: {current.slotName}
            </span>
            <h4 className="text-base font-semibold text-text-primary mt-0.5">
              {current.pickedItem
                ? `Try ${current.pickedItem.name} in ${current.slotName}`
                : 'Start at Root (0 Slots Equipped)'}
            </h4>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${badge.tone}`}>
            {badge.icon}
            {badge.label}
          </span>
        </div>

        {/* Equipped Loadout Path */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {preset.slots.map((pool, i) => {
            const equipped = pathItems[i]?.pickedItem;
            return (
              <div
                key={pool.slot}
                className={`rounded-lg px-3 py-2.5 border text-xs ${
                  equipped
                    ? 'bg-editor-mid border-cursor/35 text-text-primary'
                    : 'bg-editor-mid/40 border-white/8 text-text-secondary'
                }`}
              >
                <div className="text-[10px] font-mono text-text-secondary">{pool.slot}</div>
                <div className="font-semibold mt-0.5 truncate">
                  {equipped ? equipped.name : 'Pending…'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upper Bound Equation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs tabular-nums">
          <div className="bg-editor-mid rounded-xl p-3.5 border border-white/8">
            <div className="text-text-secondary text-[11px]">FCR Bound (Min 105%)</div>
            <div className="mt-1.5 text-sm font-bold text-text-primary">
              {current.acc.fcr} + {current.suffixMax.fcr} + {current.setBonusUb.fcr} ={' '}
              <span
                className={
                  current.upperBound.fcr < preset.defaultConstraints.minFcr
                    ? 'text-gap'
                    : 'text-cursor'
                }
              >
                {current.upperBound.fcr}%
              </span>
            </div>
            <div className="text-[10px] text-text-secondary/80 mt-1">
              current + suffix + set UB
            </div>
          </div>

          <div className="bg-editor-mid rounded-xl p-3.5 border border-white/8">
            <div className="text-text-secondary text-[11px]">All Res Bound (Min 60%)</div>
            <div className="mt-1.5 text-sm font-bold text-text-primary">
              {current.acc.allRes} + {current.suffixMax.allRes} + {current.setBonusUb.allRes} ={' '}
              <span
                className={
                  current.upperBound.allRes < preset.defaultConstraints.minAllRes
                    ? 'text-gap'
                    : 'text-cursor'
                }
              >
                {current.upperBound.allRes}%
              </span>
            </div>
            <div className="text-[10px] text-text-secondary/80 mt-1">
              current + suffix + set UB
            </div>
          </div>

          <div className="bg-editor-mid rounded-xl p-3.5 border border-white/8">
            <div className="text-text-secondary text-[11px]">+Skills Score Bound</div>
            <div className="mt-1.5 text-sm font-bold text-text-primary">
              {current.acc.skills} + {current.suffixMax.skills} + {current.setBonusUb.skills} ={' '}
              <span className="text-cyan-400">+{current.upperBound.skills}</span>
            </div>
            <div className="text-[10px] text-text-secondary/80 mt-1">
              set mask: 0b{current.possibleSetMask.toString(2)}
            </div>
          </div>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed">{current.reason}</p>

        {/* Running Tallies */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-white/8 text-xs font-mono tabular-nums text-text-secondary">
          <span>
            Feasibility cuts: <strong className="text-gap">{prunedSoFar.feas}</strong>
          </span>
          <span>
            Score cuts: <strong className="text-set-gold">{prunedSoFar.score}</strong>
          </span>
          <span>
            Top-K updates: <strong className="text-cursor">{prunedSoFar.accepted}</strong>
          </span>
        </div>
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
