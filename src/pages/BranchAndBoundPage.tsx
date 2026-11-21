import { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Play,
  Terminal,
  Code2,
  BarChart3,
  CheckCircle2,
  Scissors,
  Trophy,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CodeDisplay from '@/components/CodeDisplay';
import BranchAndBoundConcepts from '@/components/bnb/BranchAndBoundConcepts';
import BranchAndBoundVisualizer from '@/components/bnb/BranchAndBoundVisualizer';
import BranchAndBoundWalkthrough from '@/components/bnb/BranchAndBoundWalkthrough';
import BranchAndBoundComparison from '@/components/bnb/BranchAndBoundComparison';
import branchAndBoundSource from '@/utils/branchAndBound.ts?raw';

type Tab = 'concepts' | 'visualize' | 'walkthrough' | 'code' | 'comparison';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'concepts', label: 'Concepts', icon: <BookOpen size={16} /> },
  { id: 'visualize', label: 'Interactive', icon: <Play size={16} /> },
  { id: 'walkthrough', label: 'Walkthrough', icon: <Terminal size={16} /> },
  { id: 'code', label: 'Code', icon: <Code2 size={16} /> },
  { id: 'comparison', label: 'Comparison', icon: <BarChart3 size={16} /> },
];

const helperBreakdown = [
  {
    symbol: 'computeSuffixBounds(slots)',
    complexity: 'O(s · k)',
    note: 'Precomputes suf[i], the best achievable stat across remaining slots i..s-1, so every DFS node gets an O(1) upper bound.',
  },
  {
    symbol: 'computeSetSuffixMasks(slots)',
    complexity: 'O(s · k)',
    note: 'Builds sufOne and sufTwo bitmasks so possibleSets = seenTwice | (seenOnce & sufOne[i]) | sufTwo[i] only counts reachable 2-piece set bonuses.',
  },
  {
    symbol: 'solveBranchAndBound(slots, ...)',
    complexity: 'O(visited · d)',
    note: 'Runs DFS with feasibility checks and a bounded Top-K incumbent cutoff, guaranteeing exact optimal builds while pruning dead subtrees.',
  },
];

const heroPreviewBranches = [
  { name: 'HotO (40 FCR)', status: 'accepted' as const, detail: 'Expanded → Top #1' },
  { name: 'Oculus (30 FCR)', status: 'accepted' as const, detail: 'Expanded → Top #2' },
  { name: 'Fathom (20 FCR)', status: 'feas' as const, detail: 'Pruned (Max 100 < 105)' },
  { name: 'Low-Skill Branch', status: 'score' as const, detail: 'Pruned (UB ≤ Cutoff)' },
];

export default function BranchAndBoundPage() {
  const [activeTab, setActiveTab] = useState<Tab>('concepts');

  return (
    <div className="min-h-screen text-text-primary">
      {/* Top Navigation */}
      <div className="max-w-5xl mx-auto px-4 pt-5 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors group whitespace-nowrap shrink-0"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to all docs
        </Link>

        <div className="text-xs text-text-secondary whitespace-nowrap shrink-0">
          <span>Diablo 2 Build Optimizer</span>
          <span aria-hidden="true" className="mx-1.5">·</span>
          <span>Stage 2 of 3</span>
        </div>
      </div>

      {/* Hero */}
      <header className="relative overflow-hidden pt-8 pb-10">
        <div className="absolute inset-0 bg-gradient-to-b from-cursor/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs font-medium text-text-secondary tracking-wide mb-3">
            Combinatorial Search · Upper-Bound Pruning · Bitmask State Tracking
          </p>

          <h1
            className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-text-primary"
            style={{ textWrap: 'balance' }}
          >
            <span className="bg-gradient-to-r from-cursor via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Branch-and-Bound Gear Search
            </span>
          </h1>

          <p className="text-base md:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Explore multi-slot equipment combinations with DFS while cutting hopeless subtrees
            early using <span className="text-gap font-medium">suffix feasibility bounds</span>,{' '}
            <span className="text-set-gold font-medium">set-bonus bitmasks</span>, and a{' '}
            <span className="text-cursor font-medium">Top-K cutoff</span>.
          </p>

          {/* Compact Branch Outcome Preview */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto text-left">
            {heroPreviewBranches.map((item) => {
              const borderClass =
                item.status === 'accepted'
                  ? 'border-cursor/35 bg-editor-mid'
                  : item.status === 'score'
                    ? 'border-set-gold/40 bg-editor-dark/80'
                    : 'border-gap/35 bg-editor-dark/80';
              return (
                <div
                  key={item.name}
                  className={`rounded-xl px-3 py-2.5 border ${borderClass}`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary truncate">
                    {item.status === 'accepted' && (
                      <CheckCircle2 size={13} className="text-cursor shrink-0" />
                    )}
                    {item.status === 'feas' && (
                      <Scissors size={13} className="text-gap shrink-0" />
                    )}
                    {item.status === 'score' && (
                      <Trophy size={13} className="text-set-gold shrink-0" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div
                    className={`text-[11px] font-mono mt-1 truncate ${
                      item.status === 'accepted'
                        ? 'text-cursor'
                        : item.status === 'score'
                          ? 'text-set-gold'
                          : 'text-gap'
                    }`}
                  >
                    {item.detail}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs font-mono text-text-secondary mt-3 tabular-nums">
            Exact same Top-K optimal loadouts as brute-force DFS — with hopeless subtrees cut at depth 1–2
          </p>
        </div>
      </header>

      {/* Sticky 5-Tab Navigation */}
      <div className="max-w-5xl mx-auto px-4 sticky top-0 z-10 bg-[#13111c]/95 backdrop-blur-md border-b border-white/8">
        <nav className="flex gap-1 overflow-x-auto py-2" aria-label="Guide sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor ${
                activeTab === tab.id
                  ? 'bg-cursor/15 text-cursor border border-cursor/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'concepts' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">Core Concepts</h2>
              <p className="text-sm text-text-secondary">
                How admissible upper bounds and bitmasks collapse exponential DFS search trees without losing accuracy
              </p>
            </div>
            <BranchAndBoundConcepts />
          </div>
        )}

        {activeTab === 'visualize' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">Interactive Search Tree Sandbox</h2>
              <p className="text-sm text-text-secondary">
                Toggle feasibility bounds, set-bonus bitmasks, and Top-K cutoffs to watch the live search tree shrink while optimal loadouts stay identical
              </p>
            </div>
            <BranchAndBoundVisualizer />
          </div>
        )}

        {activeTab === 'walkthrough' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">Step-by-Step Walkthrough</h2>
              <p className="text-sm text-text-secondary">
                Replay every DFS node visit and upper-bound equation on a 4-slot 105% FCR Sorceress build search
              </p>
            </div>
            <BranchAndBoundWalkthrough />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">
                TypeScript Implementation
              </h2>
              <p className="text-sm text-text-secondary">
                The exact unit-tested source powering both the interactive search tree and walkthrough above
              </p>
            </div>

            <CodeDisplay source={branchAndBoundSource} filename="branchAndBound.ts" />

            {/* Function Breakdown Table */}
            <section className="bg-editor-mid rounded-2xl border border-white/8 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/8">
                <h3 className="text-sm font-semibold text-text-primary">
                  Implementation Breakdown
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Core functions across s equipment slots, k candidates per slot, and d tracked stats
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8 text-xs text-text-secondary bg-editor-dark/60">
                      <th className="text-left px-4 py-2.5 font-medium">Function</th>
                      <th className="text-left px-4 py-2.5 font-medium">Complexity</th>
                      <th className="text-left px-4 py-2.5 font-medium">What It Guarantees</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {helperBreakdown.map((row) => (
                      <tr key={row.symbol}>
                        <td className="px-4 py-3 font-mono text-xs text-cursor whitespace-nowrap">
                          {row.symbol}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-text-primary whitespace-nowrap tabular-nums">
                          {row.complexity}
                        </td>
                        <td className="px-4 py-3 text-xs text-text-secondary leading-relaxed">
                          {row.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">
                Pruning Depth &amp; Performance Comparison
              </h2>
              <p className="text-sm text-text-secondary">
                Compare brute-force DFS against feasibility-only pruning and full Branch-and-Bound
              </p>
            </div>
            <BranchAndBoundComparison />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-white/8 mt-8 text-center text-xs text-text-secondary">
        <p>
          Built for students learning combinatorial optimization.{' '}
          <span className="text-cursor font-medium">Branch-and-Bound</span> — prove a subtree cannot win, then skip it cleanly.
        </p>
      </footer>
    </div>
  );
}
