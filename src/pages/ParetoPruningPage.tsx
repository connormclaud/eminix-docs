import { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Play,
  Terminal,
  Code2,
  BarChart3,
  CheckCircle2,
  XCircle,
  Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CodeDisplay from '@/components/CodeDisplay';
import ParetoConcepts from '@/components/pareto/ParetoConcepts';
import ParetoVisualizer from '@/components/pareto/ParetoVisualizer';
import ParetoWalkthrough from '@/components/pareto/ParetoWalkthrough';
import ParetoComparison from '@/components/pareto/ParetoComparison';
import paretoPruningSource from '@/utils/paretoPruning.ts?raw';

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
    symbol: 'dominates(a, b)',
    complexity: 'O(d)',
    note: 'Checks component-wise >= across all benefit stats and <= on Strength requirements, requiring at least one strict win.',
  },
  {
    symbol: 'inSameComparisonGroup(a, b, protectSetGroups)',
    complexity: 'O(1)',
    note: 'Isolates set pieces into equivalence classes so standalone items never discard multi-piece set bonuses.',
  },
  {
    symbol: 'pruneCandidates(items, options)',
    complexity: 'O(n² · d)',
    note: 'Counts distinct dominator names (< limit) separately from same-name copies (< sameNameCap) to preserve top-K diversity.',
  },
];

const heroPreviewItems = [
  { name: "Mara's (28 Res)", status: 'kept' as const, detail: '+2 Sk · 28% Res' },
  { name: 'Storm Torc', status: 'kept' as const, detail: '+2 Sk · 20% FCR' },
  { name: "Tal's Amulet", status: 'set' as const, detail: 'Set Protected' },
  { name: 'Ghoul Scarab', status: 'pruned' as const, detail: 'Dominated' },
  { name: 'Cobalt Amulet', status: 'pruned' as const, detail: 'Dominated' },
];

export default function ParetoPruningPage() {
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
          <span>Stage 1 of 3</span>
        </div>
      </div>

      {/* Hero */}
      <header className="relative overflow-hidden pt-8 pb-10">
        <div className="absolute inset-0 bg-gradient-to-b from-cursor/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs font-medium text-text-secondary tracking-wide mb-3">
            Multi-Objective Optimization · Pre-Search Filtering
          </p>

          <h1
            className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-text-primary"
            style={{ textWrap: 'balance' }}
          >
            <span className="bg-gradient-to-r from-cursor via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Pareto Dominance Pruning
            </span>
          </h1>

          <p className="text-base md:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Checking every multi-slot gear combination is infeasible. Prune strictly inferior items
            upfront while preserving <span className="text-set-gold font-medium">set bonuses</span>{' '}
            and <span className="text-cursor font-medium">top-K diversity</span>.
          </p>

          {/* Compact Visual Reduction Preview */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-2.5 max-w-3xl mx-auto text-left">
            {heroPreviewItems.map((item) => {
              const borderClass =
                item.status === 'kept'
                  ? 'border-cursor/35 bg-editor-mid'
                  : item.status === 'set'
                    ? 'border-set-gold/40 bg-editor-mid'
                    : 'border-gap/30 bg-editor-dark/70 opacity-70';
              return (
                <div
                  key={item.name}
                  className={`rounded-xl px-3 py-2.5 border ${borderClass}`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary truncate">
                    {item.status === 'kept' && (
                      <CheckCircle2 size={13} className="text-cursor shrink-0" />
                    )}
                    {item.status === 'set' && (
                      <Shield size={13} className="text-set-gold shrink-0" />
                    )}
                    {item.status === 'pruned' && (
                      <XCircle size={13} className="text-gap shrink-0" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div
                    className={`text-[11px] font-mono mt-1 truncate ${
                      item.status === 'kept'
                        ? 'text-cursor'
                        : item.status === 'set'
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
            5 stash candidates → 3 kept (2 frontier + 1 set-protected) · 2 strictly dominated pruned
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
                How multi-objective dominance shrinks combinatorial search without losing optimal builds
              </p>
            </div>
            <ParetoConcepts />
          </div>
        )}

        {activeTab === 'visualize' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">Interactive Frontier Sandbox</h2>
              <p className="text-sm text-text-secondary">
                Toggle set-signature protection, distinct-name counting, and Top-K limits to watch the frontier respond live
              </p>
            </div>
            <ParetoVisualizer />
          </div>
        )}

        {activeTab === 'walkthrough' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">Step-by-Step Walkthrough</h2>
              <p className="text-sm text-text-secondary">
                Follow every candidate check in a realistic 7-amulet stash pruning pass
              </p>
            </div>
            <ParetoWalkthrough />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">
                TypeScript Implementation
              </h2>
              <p className="text-sm text-text-secondary">
                The exact unit-tested source powering both the interactive frontier sandbox and walkthrough above
              </p>
            </div>

            <CodeDisplay source={paretoPruningSource} filename="paretoPruning.ts" />

            {/* Function Breakdown Table */}
            <section className="bg-editor-mid rounded-2xl border border-white/8 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/8">
                <h3 className="text-sm font-semibold text-text-primary">
                  Implementation Breakdown
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Core functions and time complexity across a slot of n items and d tracked stats
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
                Complexity &amp; Search-Space Impact
              </h2>
              <p className="text-sm text-text-secondary">
                Compare unpruned brute force, naive 1-dominator pruning, and set-aware top-K Pareto pruning
              </p>
            </div>
            <ParetoComparison />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-white/8 mt-8 text-center text-xs text-text-secondary">
        <p>
          Built for students learning combinatorial optimization.{' '}
          <span className="text-cursor font-medium">Pareto Dominance Pruning</span> — eliminate hopeless choices before search begins.
        </p>
      </footer>
    </div>
  );
}
