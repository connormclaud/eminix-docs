import { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Play,
  Terminal,
  Code2,
  BarChart3,
  Zap,
  Table2,
  Scale,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CodeDisplay from '@/components/CodeDisplay';
import CharmConcepts from '@/components/charms/CharmConcepts';
import CharmVisualizer from '@/components/charms/CharmVisualizer';
import CharmWalkthrough from '@/components/charms/CharmWalkthrough';
import CharmComparison from '@/components/charms/CharmComparison';
import charmSolverSource from '@/utils/charmSolver.ts?raw';

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
    symbol: 'greedySeedCharms(pool, constraints)',
    complexity: 'O(m log m)',
    note: 'Repairs Res/FHR shortfalls by stat-per-slot density, then packs objective charms to seed an immediate pruning bound.',
  },
  {
    symbol: 'buildPureAxisDp(charms, axis, maxSlots)',
    complexity: 'O(p · S)',
    note: 'Precomputes 1D 0/1 knapsack tables for pure single-stat charms so DFS looks up minimum required slots in O(1).',
  },
  {
    symbol: 'fractionalUpperBound(entries, minIdx, remSlots)',
    complexity: 'O(m)',
    note: 'Computes an admissible fractional relaxation bound over remaining slots to prune hopeless branches early.',
  },
  {
    symbol: 'solveCharmKnapsack(pool, constraints, flags)',
    complexity: 'O(p·S + pruned DFS)',
    note: 'Combines all three layers into an exact solver that beats greedy integer traps in milliseconds.',
  },
];

const pipelineStages = [
  { name: '1. Greedy Seed', tone: 'cyan' as const, detail: 'Instant baseline score' },
  { name: '2. 1D Pure-Axis DP', tone: 'gold' as const, detail: 'O(1) Res & FHR slots' },
  { name: '3. Fractional Bound', tone: 'gap' as const, detail: 'Prunes weak subtrees' },
  { name: '4. Exact Optimum', tone: 'cursor' as const, detail: 'Guaranteed best pack' },
];

export default function CharmKnapsackPage() {
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
          <span>Stage 3 of 3</span>
        </div>
      </div>

      {/* Hero */}
      <header className="relative overflow-hidden pt-8 pb-10">
        <div className="absolute inset-0 bg-gradient-to-b from-cursor/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs font-medium text-text-secondary tracking-wide mb-3">
            Multi-Dimensional Knapsack · 1D Dynamic Programming · Fractional Relaxation
          </p>

          <h1
            className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-text-primary"
            style={{ textWrap: 'balance' }}
          >
            <span className="bg-gradient-to-r from-cursor via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Hybrid Charm Knapsack Solver
            </span>
          </h1>

          <p className="text-base md:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Pack 1×1, 1×2, and 1×3 charms into a bounded inventory by combining{' '}
            <span className="text-cyan-400 font-medium">greedy seeding</span>,{' '}
            <span className="text-set-gold font-medium">1D pure-axis DP</span>, and{' '}
            <span className="text-cursor font-medium">fractional upper bounds</span>.
          </p>

          {/* Compact 4-Layer Pipeline Preview */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto text-left">
            {pipelineStages.map((stage) => {
              const borderClass =
                stage.tone === 'cursor'
                  ? 'border-cursor/35 bg-editor-mid'
                  : stage.tone === 'gold'
                    ? 'border-set-gold/40 bg-editor-mid'
                    : stage.tone === 'gap'
                      ? 'border-gap/35 bg-editor-mid'
                      : 'border-cyan-400/35 bg-editor-mid';
              return (
                <div
                  key={stage.name}
                  className={`rounded-xl px-3 py-2.5 border ${borderClass}`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary truncate">
                    {stage.tone === 'cyan' && <Zap size={13} className="text-cyan-400 shrink-0" />}
                    {stage.tone === 'gold' && <Table2 size={13} className="text-set-gold shrink-0" />}
                    {stage.tone === 'gap' && <Scale size={13} className="text-gap shrink-0" />}
                    {stage.tone === 'cursor' && (
                      <CheckCircle2 size={13} className="text-cursor shrink-0" />
                    )}
                    <span className="truncate">{stage.name}</span>
                  </div>
                  <div
                    className={`text-[11px] font-mono mt-1 truncate ${
                      stage.tone === 'cursor'
                        ? 'text-cursor'
                        : stage.tone === 'gold'
                          ? 'text-set-gold'
                          : stage.tone === 'gap'
                            ? 'text-gap'
                            : 'text-cyan-400'
                    }`}
                  >
                    {stage.detail}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs font-mono text-text-secondary mt-3 tabular-nums">
            Matches exhaustive 2ᵐ brute-force optimality while avoiding greedy integer packing traps
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
                How Greedy seeding, 1D Dynamic Programming, and Fractional Knapsack bounds work together
              </p>
            </div>
            <CharmConcepts />
          </div>
        )}

        {activeTab === 'visualize' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">
                Interactive Inventory Grid Sandbox
              </h2>
              <p className="text-sm text-text-secondary">
                Adjust slot budgets, survival shortfalls, and optimization layers to watch the 1D DP tables and exact charm packing update live
              </p>
            </div>
            <CharmVisualizer />
          </div>
        )}

        {activeTab === 'walkthrough' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">Step-by-Step Walkthrough</h2>
              <p className="text-sm text-text-secondary">
                Follow the live hybrid solver as it beats the Greedy Knapsack Trap step by step
              </p>
            </div>
            <CharmWalkthrough />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">
                TypeScript Implementation
              </h2>
              <p className="text-sm text-text-secondary">
                The exact unit-tested source powering both the interactive inventory sandbox and walkthrough above
              </p>
            </div>

            <CodeDisplay source={charmSolverSource} filename="charmSolver.ts" />

            {/* Function Breakdown Table */}
            <section className="bg-editor-mid rounded-2xl border border-white/8 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/8">
                <h3 className="text-sm font-semibold text-text-primary">
                  Implementation Breakdown
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Core functions across m total charms, p pure single-stat charms, and slot budget S
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
                Solver Comparison &amp; DP Offloading Impact
              </h2>
              <p className="text-sm text-text-secondary">
                Compare exhaustive search, greedy heuristics, pure Branch-and-Bound, and the Hybrid Solver
              </p>
            </div>
            <CharmComparison />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-white/8 mt-8 text-center text-xs text-text-secondary">
        <p>
          Built for students learning combinatorial optimization.{' '}
          <span className="text-cursor font-medium">Hybrid Charm Knapsack Solver</span> — greedy speed with exact dynamic programming and upper-bound guarantees.
        </p>
      </footer>
    </div>
  );
}
