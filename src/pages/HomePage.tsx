import {
  Terminal,
  Filter,
  GitBranch,
  Grid2x2,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type GuideEntry = {
  id: string;
  title: string;
  description: string;
  meta: string;
  icon: React.ReactNode;
  link?: string;
  ready: boolean;
};

const optimizerGuides: GuideEntry[] = [
  {
    id: 'pareto-pruning',
    title: 'Pareto Dominance Pruning',
    description:
      'Eliminate strictly inferior gear rolls before search while protecting multi-piece set bonuses and top-K build diversity.',
    meta: 'Stage 1 · Ready · Interactive Frontier + Live TS',
    icon: <Filter className="text-cursor" size={22} />,
    link: '/pareto-pruning',
    ready: true,
  },
  {
    id: 'branch-and-bound',
    title: 'Branch-and-Bound Gear Search',
    description:
      'Prune hopeless equipment subtrees early using precomputed suffix upper bounds, bitmask set-bonus tracking, and top-K cutoffs.',
    meta: 'Stage 2 · Planned · Search Tree + Bounds',
    icon: <GitBranch className="text-text-secondary" size={22} />,
    ready: false,
  },
  {
    id: 'charm-knapsack',
    title: 'Hybrid Charm Knapsack Solver',
    description:
      'Combine greedy incumbent seeding, 1D dynamic programming, and density-sorted fractional upper bounds to pack inventory charms.',
    meta: 'Stage 3 · Planned · DP + Fractional Bounds',
    icon: <Grid2x2 className="text-text-secondary" size={22} />,
    ready: false,
  },
];

const editorGuides: GuideEntry[] = [
  {
    id: 'gap-buffer',
    title: 'Gap Buffer',
    description:
      'The classic single-array data structure with a movable editing gap behind Emacs, Sublime Text, and interactive text editors.',
    meta: 'Ready · Interactive Playground + Live TS',
    icon: <Terminal className="text-cursor" size={22} />,
    link: '/gap-buffer',
    ready: true,
  },
];

function GuideCard({ doc }: { doc: GuideEntry }) {
  const cardClasses = doc.ready
    ? 'group relative bg-editor-mid border border-white/8 rounded-2xl p-6 transition-all hover:border-cursor/40 hover:bg-editor-mid/90 flex flex-col justify-between gap-5'
    : 'relative bg-editor-mid/55 border border-white/6 rounded-2xl p-6 opacity-70 flex flex-col justify-between gap-5';

  return (
    <article className={cardClasses}>
      {doc.ready && doc.link ? (
        <Link
          to={doc.link}
          aria-label={`Open ${doc.title} interactive guide`}
          className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor"
        />
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="p-2.5 bg-editor-dark rounded-xl border border-white/8 group-hover:border-cursor/25 transition-colors">
            {doc.icon}
          </div>
          <span
            className={`text-xs font-mono ${
              doc.ready ? 'text-cursor font-semibold' : 'text-text-secondary'
            }`}
          >
            {doc.ready ? 'Interactive Guide' : 'Upcoming Stage'}
          </span>
        </div>

        <div>
          <h3 className="text-lg font-bold text-text-primary group-hover:text-cursor transition-colors tracking-tight">
            {doc.title}
          </h3>
          <p className="text-xs text-text-secondary/80 mt-1 font-mono">{doc.meta}</p>
          <p className="text-text-secondary text-sm leading-relaxed mt-3">
            {doc.description}
          </p>
        </div>
      </div>

      {doc.ready ? (
        <div className="flex items-center gap-2 text-sm font-semibold text-cursor">
          <span>Start Learning</span>
          <ArrowRight
            size={16}
            className="group-hover:translate-x-1 transition-transform"
          />
        </div>
      ) : (
        <div className="text-xs text-text-secondary">
          Scheduled for next atomic milestone
        </div>
      )}
    </article>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen text-text-primary bg-[#13111c]">
      <header className="relative overflow-hidden pt-20 pb-14 border-b border-white/6">
        <div className="absolute inset-0 bg-gradient-to-b from-cursor/6 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs font-medium text-text-secondary mb-3">
            Interactive Computer Science Guides · Live Visualizers · Unit-Tested TypeScript
          </p>
          <h1
            className="text-5xl md:text-6xl font-extrabold mb-5 tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            <span className="bg-gradient-to-r from-cursor via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Eminix Docs
            </span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Visual, student-tailored explorations of real systems algorithms—where every
            interactive playground runs the exact code shown on the page.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-14">
        {/* Diablo 2 Build Optimizer Algorithms */}
        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">
              Diablo 2 Build Optimizer Algorithms
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              How combinatorial pruning, branch-and-bound, and hybrid knapsack solvers optimize Diablo 2 gear loadouts in milliseconds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {optimizerGuides.map((doc) => (
              <GuideCard key={doc.id} doc={doc} />
            ))}
          </div>
        </section>

        {/* Text Editor Internals */}
        <section className="space-y-5 pt-4 border-t border-white/6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">
              Text Editor Internals
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Data structures that keep typing instantaneous inside large editable buffers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {editorGuides.map((doc) => (
              <GuideCard key={doc.id} doc={doc} />
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-10 border-t border-white/6 mt-8 text-center text-xs text-text-secondary">
        <p>Eminix Docs · Interactive student documentation for data structures and optimization algorithms.</p>
      </footer>
    </div>
  );
}
