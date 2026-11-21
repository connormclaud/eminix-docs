import { Zap, Table2, Scale, Layers, ArrowDown, CheckCircle2, XCircle } from 'lucide-react';

const conceptCards = [
  {
    step: '01',
    icon: <Zap className="text-cyan-400 shrink-0" size={20} />,
    title: 'Greedy Incumbent Seeding',
    body: 'First run an O(m log m) greedy pass: repair resistance and FHR shortfalls by highest stat-per-slot density, then fill leftover slots with highest objective density.',
    takeaway: 'Seeds a strong starting score immediately so DFS prunes weak branches from node 1.',
  },
  {
    step: '02',
    icon: <Table2 className="text-set-gold shrink-0" size={20} />,
    title: '1D DP for Pure Single-Stat Charms',
    body: 'Charms that only provide All Res or only provide FHR (zero objective value) never need to be branched on. Precompute a tiny 1D 0/1 knapsack DP table per axis.',
    takeaway: 'minSlotsFor(shortfall) answers in O(1) and removes pure filler charms from the DFS tree.',
  },
  {
    step: '03',
    icon: <Scale className="text-cursor shrink-0" size={20} />,
    title: 'Fractional Density Upper Bounds',
    body: 'Sort remaining branching charms by value/size and greedily pack whole charms plus a fractional slice of the next charm into remaining slots.',
    takeaway: 'The fractional relaxation is always >= the true integer maximum, making pruning 100% exact.',
  },
  {
    step: '04',
    icon: <Layers className="text-gap shrink-0" size={20} />,
    title: 'Exact Hybrid Branch-and-Bound',
    body: 'DFS branches only over multi-stat and objective charms, reserves mandatory pure-DP slots for unmet shortfalls, and prunes whenever Current + Fractional Upper Bound <= Best Score.',
    takeaway: 'Beats greedy integer traps while finishing in milliseconds instead of checking 2ᵐ subsets.',
  },
];

export default function CharmConcepts() {
  return (
    <div className="space-y-6">
      {/* Problem Statement */}
      <section className="bg-editor-mid rounded-2xl p-6 border border-white/8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-2.5">
            <h3 className="text-lg font-semibold text-text-primary tracking-tight">
              The Problem: Packing Multi-Size Charms Under Survival Constraints
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              After choosing equipped gear, a character still has leftover stat gaps (such as{' '}
              <span className="font-mono text-text-primary">+30% All Res</span> and{' '}
              <span className="font-mono text-text-primary">+10% FHR</span>) and a fixed inventory
              budget of vertical slots. Small Charms take <span className="font-mono text-text-primary">1</span> slot,
              Large Charms take <span className="font-mono text-text-primary">2</span>, and Grand Charms take{' '}
              <span className="font-mono text-text-primary">3</span>.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              Testing every subset of 24 stash charms requires checking{' '}
              <span className="font-mono text-gap">2²⁴</span> combinations—and pure greedy packing
              gets trapped by awkward integer charm sizes. A hybrid solver combines Greedy, 1D DP,
              and Fractional Bounds to guarantee the exact optimum fast.
            </p>
          </div>

          <div className="lg:col-span-4 bg-editor-dark rounded-xl p-4 border border-white/8 space-y-2 font-mono text-xs tabular-nums">
            <div className="flex items-center justify-between gap-2 text-text-secondary">
              <span>24 stash charms (2²⁴)</span>
              <span className="text-gap font-bold">16,777,216</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-text-secondary">
              <span>Offload 14 pure charms (2¹⁰)</span>
              <span className="text-cursor font-bold">1,024</span>
            </div>
            <div className="pt-2 border-t border-white/8 flex items-center justify-between gap-2 text-text-primary">
              <span>Branch reduction from DP</span>
              <span className="text-cursor font-bold">16,384×</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Concise Concept Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {conceptCards.map((card) => (
          <section
            key={card.step}
            className="bg-editor-mid rounded-2xl p-5 border border-white/8 flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                {card.icon}
                <h3 className="text-base font-semibold text-text-primary tracking-tight">
                  {card.step}. {card.title}
                </h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">{card.body}</p>
            </div>
            <div className="bg-editor-dark rounded-xl px-3.5 py-2.5 border border-white/8">
              <p className="text-xs text-text-primary leading-relaxed">
                <span className="text-cursor font-semibold">Rule: </span>
                {card.takeaway}
              </p>
            </div>
          </section>
        ))}
      </div>

      {/* Concrete Mechanism Visual */}
      <section className="bg-editor-mid rounded-2xl p-6 border border-white/8">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-text-primary">
            How 1D DP and Fractional Bounds Work Together
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Reserve exact minimum slots for unmet shortfalls using 1D DP, then bound the remaining slots with a fractional knapsack pass.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Case A: 1D DP Lookup */}
          <div className="bg-editor-dark rounded-xl p-5 border border-white/8 space-y-4">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">Step A: Pure-Axis 1D DP Table</span>
              <span className="font-mono text-set-gold">O(1) Lookup</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-xs tabular-nums">
              {[
                { s: 0, res: 0, hl: false },
                { s: 1, res: 5, hl: false },
                { s: 2, res: 9, hl: true },
                { s: 3, res: 13, hl: false },
                { s: 4, res: 17, hl: false },
              ].map((cell) => (
                <div
                  key={cell.s}
                  className={`rounded-lg p-2 border ${
                    cell.hl
                      ? 'bg-set-gold/15 border-set-gold/50 text-set-gold'
                      : 'bg-editor-mid border-white/8 text-text-primary'
                  }`}
                >
                  <div className="text-[10px] text-text-secondary">{cell.s} slot{cell.s === 1 ? '' : 's'}</div>
                  <div className="font-bold mt-0.5">+{cell.res}%</div>
                </div>
              ))}
            </div>

            <div className="bg-editor-mid rounded-lg p-3 border border-set-gold/30 flex items-center justify-between text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 text-set-gold font-semibold">
                <CheckCircle2 size={14} />
                Need +8% Res → Reserve 2 slots
              </span>
              <span className="text-text-secondary">+5 SC + +4 SC</span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Instead of branching pick/skip over every pure resistance charm, DFS reads the exact minimum slots needed directly from the table.
            </p>
          </div>

          {/* Case B: Fractional Upper Bound */}
          <div className="bg-editor-dark rounded-xl p-5 border border-white/8 space-y-4">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">Step B: Fractional Upper Bound</span>
              <span className="font-mono text-gap">Pruned Branch</span>
            </div>

            <div className="space-y-2.5 text-xs font-mono tabular-nums">
              <div className="bg-editor-mid rounded-lg p-3 border border-white/10 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Current Magic Find</span>
                  <span className="text-text-primary font-semibold">22%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Remaining DFS slots (after DP)</span>
                  <span className="text-text-primary font-semibold">4 slots</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">+ Best density pack (3 + 1/2 of 2-slot)</span>
                  <span className="text-cyan-400 font-semibold">+47% max</span>
                </div>
              </div>

              <div className="flex justify-center text-gap">
                <ArrowDown size={15} />
              </div>

              <div className="bg-editor-mid rounded-lg p-3 border border-gap/40 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-gap font-semibold">
                  <XCircle size={14} />
                  Upper Bound 69% ≤ Best 72%
                </span>
                <span className="text-text-secondary">Prune subtree</span>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Even if we could slice a 2-slot charm in half, this branch still cannot beat the incumbent score of 72%—safe to skip completely.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
