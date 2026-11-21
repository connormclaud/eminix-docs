import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Shield,
  Layers,
} from 'lucide-react';
import { WALKTHROUGH_POOL } from '@/data/paretoPresets';
import { tracePruning, type PruneReason } from '@/utils/paretoPruning';

function reasonMeta(reason: PruneReason) {
  switch (reason) {
    case 'pareto-optimal':
      return {
        label: 'Kept — Pareto Optimal',
        tone: 'text-cursor',
        icon: <CheckCircle2 size={16} className="text-cursor shrink-0" />,
      };
    case 'set-protected':
      return {
        label: 'Kept — Set Signature Protected',
        tone: 'text-set-gold',
        icon: <Shield size={16} className="text-set-gold shrink-0" />,
      };
    case 'top-k-diversity':
      return {
        label: 'Kept — Top-2 Diversity',
        tone: 'text-cyan-400',
        icon: <Layers size={16} className="text-cyan-400 shrink-0" />,
      };
    case 'pruned-same-name':
      return {
        label: 'Pruned — Duplicate Roll',
        tone: 'text-gap',
        icon: <XCircle size={16} className="text-gap shrink-0" />,
      };
    case 'pruned-distinct':
      return {
        label: 'Pruned — Dominated (≥ 2 Names)',
        tone: 'text-gap',
        icon: <XCircle size={16} className="text-gap shrink-0" />,
      };
  }
}

export default function ParetoWalkthrough() {
  const steps = useMemo(
    () =>
      tracePruning(WALKTHROUGH_POOL, {
        limit: 2,
        sameNameCap: 1,
        protectSetGroups: true,
        countDistinctNames: true,
      }),
    []
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentIdx >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setCurrentIdx((prev) => Math.min(steps.length - 1, prev + 1));
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [isPlaying, currentIdx, steps.length]);

  const step = steps[currentIdx];
  const meta = reasonMeta(step.decision.reason);

  return (
    <div className="bg-editor-mid rounded-2xl p-6 border border-white/8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Live Trace: Pruning a 7-Amulet Stash (K = 2)
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Generated directly by <span className="font-mono text-text-primary">tracePruning()</span> — watch each candidate get evaluated against the pool.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (currentIdx >= steps.length - 1) setCurrentIdx(0);
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
              setCurrentIdx(0);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-editor-dark text-text-secondary hover:text-text-primary border border-white/10 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Step Selector Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {steps.map((s, idx) => {
          const active = idx === currentIdx;
          const past = idx < currentIdx;
          return (
            <button
              key={s.candidate.id}
              onClick={() => {
                setIsPlaying(false);
                setCurrentIdx(idx);
              }}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor ${
                active
                  ? 'bg-cursor text-editor-dark'
                  : past
                    ? 'bg-editor-dark text-text-primary border border-cursor/30'
                    : 'bg-editor-dark text-text-secondary border border-white/10 hover:text-text-primary'
              }`}
            >
              {idx + 1}. {s.candidate.name.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Active Evaluation Stage */}
      <div className="bg-editor-dark rounded-xl p-5 border border-white/8 space-y-5 slide-in" key={step.candidate.id}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-base font-semibold text-text-primary">{step.headline}</h4>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${meta.tone}`}>
            {meta.icon}
            {meta.label}
          </span>
        </div>

        {/* Candidate Stats & Dominators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-editor-mid rounded-xl p-4 border border-white/8">
            <div className="text-xs text-text-secondary mb-2">
              Candidate Under Inspection
            </div>
            <div className="text-sm font-semibold text-text-primary">
              {step.candidate.name}
            </div>
            {step.candidate.setGroup && (
              <div className="text-xs text-set-gold mt-0.5">
                Set Signature: {step.candidate.setGroup}
              </div>
            )}
            <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/8 font-mono text-xs tabular-nums">
              <div>
                <div className="text-text-secondary text-[11px]">+Skills</div>
                <div className="text-text-primary font-semibold mt-0.5">+{step.candidate.skills}</div>
              </div>
              <div>
                <div className="text-text-secondary text-[11px]">FCR</div>
                <div className="text-text-primary font-semibold mt-0.5">{step.candidate.fcr}%</div>
              </div>
              <div>
                <div className="text-text-secondary text-[11px]">All Res</div>
                <div className="text-text-primary font-semibold mt-0.5">{step.candidate.allRes}%</div>
              </div>
              <div>
                <div className="text-text-secondary text-[11px]">MF</div>
                <div className="text-text-primary font-semibold mt-0.5">{step.candidate.mf}%</div>
              </div>
            </div>
          </div>

          <div className="bg-editor-mid rounded-xl p-4 border border-white/8">
            <div className="text-xs text-text-secondary mb-2">
              Dominators Found in Same Group
            </div>
            {step.decision.dominators.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {step.decision.dominators.map((dom) => (
                  <li
                    key={dom.id}
                    className="flex items-center justify-between gap-2 bg-editor-dark rounded-lg px-3 py-2 border border-white/8"
                  >
                    <span className="font-medium text-text-primary truncate">{dom.name}</span>
                    <span className="font-mono text-text-secondary tabular-nums whitespace-nowrap">
                      +{dom.skills} · {dom.fcr}% FCR · {dom.allRes}% Res
                    </span>
                  </li>
                ))}
              </ul>
            ) : step.decision.blockedBySetProtection.length > 0 ? (
              <div className="text-xs text-set-gold leading-relaxed bg-editor-dark rounded-lg p-3 border border-set-gold/25">
                {step.decision.blockedBySetProtection.map((d) => d.name).join(', ')} had higher standalone stats, but set-group isolation prevented cross-group comparison.
              </div>
            ) : (
              <div className="text-xs text-cursor leading-relaxed bg-editor-dark rounded-lg p-3 border border-cursor/25">
                0 dominators found — this item sits directly on the Pareto frontier.
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed">{step.explanation}</p>

        {/* Running Ledgers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/8 text-xs">
          <div>
            <div className="font-semibold text-cursor mb-1.5 font-mono tabular-nums">
              Kept Pool ({step.keptSoFar.length})
            </div>
            <div className="text-text-secondary leading-relaxed">
              {step.keptSoFar.length > 0
                ? step.keptSoFar.map((i) => i.name).join(' · ')
                : 'None yet'}
            </div>
          </div>
          <div>
            <div className="font-semibold text-gap mb-1.5 font-mono tabular-nums">
              Pruned Pool ({step.prunedSoFar.length})
            </div>
            <div className="text-text-secondary leading-relaxed">
              {step.prunedSoFar.length > 0
                ? step.prunedSoFar.map((i) => i.name).join(' · ')
                : 'None yet'}
            </div>
          </div>
        </div>
      </div>

      {/* Prev / Next Footer */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setIsPlaying(false);
            setCurrentIdx((prev) => Math.max(0, prev - 1));
          }}
          disabled={currentIdx === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10 bg-editor-dark text-text-secondary hover:text-text-primary hover:bg-editor-light disabled:opacity-35 disabled:cursor-not-allowed whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <span className="text-xs font-mono text-text-secondary tabular-nums">
          Step {currentIdx + 1} / {steps.length}
        </span>

        <button
          onClick={() => {
            setIsPlaying(false);
            setCurrentIdx((prev) => Math.min(steps.length - 1, prev + 1));
          }}
          disabled={currentIdx === steps.length - 1}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-cursor/15 text-cursor border border-cursor/30 hover:bg-cursor/25 disabled:opacity-35 disabled:cursor-not-allowed whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
