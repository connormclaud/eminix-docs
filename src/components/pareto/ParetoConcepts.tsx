import { CheckCircle2, ShieldAlert, Layers, Gauge, ArrowRight, XCircle } from 'lucide-react';

const conceptCards = [
  {
    step: '01',
    icon: <CheckCircle2 className="text-cursor shrink-0" size={20} />,
    title: 'Strict Pareto Dominance',
    body: 'Item A dominates Item B if A is at least as good on every stat, needs no more Strength, and beats B on at least one stat.',
    takeaway: 'If A beats or ties B everywhere, B can never improve a loadout that can equip A.',
  },
  {
    step: '02',
    icon: <ShieldAlert className="text-set-gold shrink-0" size={20} />,
    title: 'Protecting Set Bonuses',
    body: 'Set items often look weaker alone, but unlock big bonuses when paired together. Only compare dominance within the same set group.',
    takeaway: 'Keep standalone uniques and set pieces in separate comparison buckets.',
  },
  {
    step: '03',
    icon: <Layers className="text-cyan-400 shrink-0" size={20} />,
    title: 'Top-K & Distinct Names',
    body: 'To return the top K distinct builds, keep any item dominated by fewer than K distinct item names—so duplicate rolls cannot crowd out backups.',
    takeaway: 'Count unique dominator names (< K) separately from duplicate copies of the same item.',
  },
  {
    step: '04',
    icon: <Gauge className="text-gap shrink-0" size={20} />,
    title: 'Exponential Speedup',
    body: 'Spending O(n²) per slot to trim n items down to k shrinks the search tree from nˢ to kˢ before search even begins.',
    takeaway: 'Trimming 12 → 4 items per slot across 7 slots cuts 12⁷ (35.8M) loadouts down to 4⁷ (16,384).',
  },
];

export default function ParetoConcepts() {
  return (
    <div className="space-y-6">
      {/* Problem Statement & Why Brute Force Fails */}
      <section className="bg-editor-mid rounded-2xl p-6 border border-white/8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-2.5">
            <h3 className="text-lg font-semibold text-text-primary tracking-tight">
              The Problem: Optimizing Multi-Slot Gear
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Given a stash of items across equipment slots (helm, armor, amulet, weapon, rings…), find the{' '}
              <span className="text-text-primary font-medium">top K valid loadouts</span> that maximize stats like{' '}
              <span className="font-mono text-text-primary">+Skills</span>,{' '}
              <span className="font-mono text-text-primary">FCR</span>,{' '}
              <span className="font-mono text-text-primary">All Res</span>, and{' '}
              <span className="font-mono text-text-primary">MF</span>.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              Checking every combination directly is infeasible because slot choices multiply—so we eliminate strictly inferior items per slot first.
            </p>
          </div>

          <div className="lg:col-span-4 bg-editor-dark rounded-xl p-4 border border-white/8 space-y-2 font-mono text-xs tabular-nums">
            <div className="flex items-center justify-between gap-2 text-text-secondary">
              <span>12 items/slot, 7 slots (12⁷)</span>
              <span className="text-gap font-bold">35,831,808</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-text-secondary">
              <span>After pruning: 4/slot (4⁷)</span>
              <span className="text-cursor font-bold">16,384</span>
            </div>
            <div className="pt-2 border-t border-white/8 flex items-center justify-between gap-2 text-text-primary">
              <span>Eliminated upfront</span>
              <span className="text-cursor font-bold">99.95%</span>
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

      {/* Concrete pair comparison diagram */}
      <section className="bg-editor-mid rounded-2xl p-6 border border-white/8">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-text-primary">
            How a Pairwise Dominance Check Works
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Compare every stat component-wise. A single losing axis makes two items incomparable (both stay on the frontier).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strict dominance case */}
          <div className="bg-editor-dark rounded-xl p-5 border border-white/8 space-y-4">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">Case A: Strict Dominance</span>
              <span className="font-mono text-gap">Pruned</span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
              <div className="bg-editor-mid rounded-lg p-3 border border-cursor/30">
                <div className="font-semibold text-text-primary mb-2">Storm Torc</div>
                <div className="space-y-1 font-mono text-xs tabular-nums text-text-secondary">
                  <div className="flex justify-between">
                    <span>Skills</span>
                    <span className="text-cursor font-semibold">+2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FCR</span>
                    <span className="text-cursor font-semibold">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>All Res</span>
                    <span className="text-cursor font-semibold">18%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MF</span>
                    <span className="text-cursor font-semibold">12%</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 text-cursor">
                <ArrowRight size={18} />
                <span className="font-mono text-[11px]">dominates</span>
              </div>

              <div className="bg-editor-mid rounded-lg p-3 border border-gap/30 opacity-85">
                <div className="font-semibold text-text-primary mb-2 flex items-center gap-1.5">
                  <XCircle size={14} className="text-gap shrink-0" />
                  <span className="truncate">Wraith Collar</span>
                </div>
                <div className="space-y-1 font-mono text-xs tabular-nums text-text-secondary">
                  <div className="flex justify-between">
                    <span>Skills</span>
                    <span>+2 (=)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FCR</span>
                    <span className="text-gap">10% (&lt;)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>All Res</span>
                    <span className="text-gap">14% (&lt;)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MF</span>
                    <span className="text-gap">8% (&lt;)</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Storm Torc ties on <span className="font-mono text-text-primary">+Skills</span> and strictly beats Wraith Collar on FCR, All Res, and MF.
            </p>
          </div>

          {/* Incomparable trade-off case */}
          <div className="bg-editor-dark rounded-xl p-5 border border-white/8 space-y-4">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">Case B: Trade-Off (Incomparable)</span>
              <span className="font-mono text-cursor">Both Kept</span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
              <div className="bg-editor-mid rounded-lg p-3 border border-cursor/30">
                <div className="font-semibold text-text-primary mb-2">Storm Torc</div>
                <div className="space-y-1 font-mono text-xs tabular-nums text-text-secondary">
                  <div className="flex justify-between">
                    <span>Skills</span>
                    <span>+2 (=)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FCR</span>
                    <span className="text-cursor font-semibold">20% (&gt;)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>All Res</span>
                    <span className="text-text-secondary">18% (&lt;)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MF</span>
                    <span className="text-cursor font-semibold">12% (&gt;)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 text-text-secondary">
                <span className="font-mono text-base font-bold">∥</span>
                <span className="font-mono text-[11px]">frontier</span>
              </div>

              <div className="bg-editor-mid rounded-lg p-3 border border-cursor/30">
                <div className="font-semibold text-text-primary mb-2">Mara&apos;s Kaleidoscope</div>
                <div className="space-y-1 font-mono text-xs tabular-nums text-text-secondary">
                  <div className="flex justify-between">
                    <span>Skills</span>
                    <span>+2 (=)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FCR</span>
                    <span className="text-text-secondary">0% (&lt;)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>All Res</span>
                    <span className="text-cursor font-semibold">28% (&gt;)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MF</span>
                    <span className="text-text-secondary">0% (&lt;)</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Storm Torc wins on FCR and MF, while Mara&apos;s wins on All Res. Neither dominates the other — both stay on the Pareto frontier.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
