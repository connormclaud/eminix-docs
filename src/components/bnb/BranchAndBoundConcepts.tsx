import { Layers, Scissors, Binary, Trophy, XCircle, ArrowDown } from 'lucide-react';

const conceptCards = [
  {
    step: '01',
    icon: <Layers className="text-cursor shrink-0" size={20} />,
    title: 'Admissible Suffix Upper Bounds',
    body: 'Before DFS starts, precompute suf[i]: the best possible value of each stat across remaining slots i..n-1. An upper bound must never underestimate, or valid builds could be lost.',
    takeaway: 'One O(n) pre-pass lets every DFS node compute its best-case finish in O(1) time.',
  },
  {
    step: '02',
    icon: <Scissors className="text-gap shrink-0" size={20} />,
    title: 'Feasibility Pruning',
    body: 'At any partial loadout, add accumulated stats to the remaining suffix maximum. If current + suf[i] still falls short of a hard requirement like 105% FCR, abort the entire subtree.',
    takeaway: 'Fail fast at depth 1 or 2 instead of evaluating thousands of doomed leaves.',
  },
  {
    step: '03',
    icon: <Binary className="text-set-gold shrink-0" size={20} />,
    title: 'Bitmask Set-Bonus Bounds',
    body: 'Equipment sets grant bonuses only when ≥ 2 pieces are worn. Precompute sufOne[i] and sufTwo[i] bitmasks so only still-reachable set bonuses are added to a node’s upper bound.',
    takeaway: 'possibleSets = seenTwice | (seenOnce & sufOne[i]) | sufTwo[i] runs in 3 bitwise ops.',
  },
  {
    step: '04',
    icon: <Trophy className="text-cyan-400 shrink-0" size={20} />,
    title: 'Dynamic Top-K Incumbent Cutoff',
    body: 'Keep a bounded leaderboard of the top K valid builds found so far. Once full, any branch whose upper-bound objective cannot beat the Kth-best score is pruned immediately.',
    takeaway: 'Visiting strong items first raises the cutoff early and collapses later branches.',
  },
];

export default function BranchAndBoundConcepts() {
  return (
    <div className="space-y-6">
      {/* Problem Statement */}
      <section className="bg-editor-mid rounded-2xl p-6 border border-white/8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-2.5">
            <h3 className="text-lg font-semibold text-text-primary tracking-tight">
              The Problem: Searching Remaining Loadouts Under Hard Constraints
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Even after Pareto pruning trims every slot down to its best candidates, combining
              all slots still forms a huge tree—and most branches either miss required breakpoints
              (like <span className="font-mono text-text-primary">105% FCR</span> or{' '}
              <span className="font-mono text-text-primary">75% All Res</span>) or cannot beat the
              best builds already found.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              Branch-and-Bound searches slot by slot with DFS, but cuts off hopeless subtrees as
              soon as an upper bound proves no descendant can win.
            </p>
          </div>

          <div className="lg:col-span-4 bg-editor-dark rounded-xl p-4 border border-white/8 space-y-2 font-mono text-xs tabular-nums">
            <div className="flex items-center justify-between gap-2 text-text-secondary">
              <span>4 items/slot, 8 slots (4⁸)</span>
              <span className="text-gap font-bold">65,536</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-text-secondary">
              <span>Prune 1 bad pick at depth 1</span>
              <span className="text-cursor font-bold">−16,384</span>
            </div>
            <div className="pt-2 border-t border-white/8 flex items-center justify-between gap-2 text-text-primary">
              <span>Optimality guarantee</span>
              <span className="text-cursor font-bold">100% Exact</span>
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

      {/* Concrete Subtree Cut Examples */}
      <section className="bg-editor-mid rounded-2xl p-6 border border-white/8">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-text-primary">
            How Branch-and-Bound Cuts a Subtree
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            At every internal node, test both feasibility and objective upper bounds before branching into the next slot.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Case A: Feasibility Cut */}
          <div className="bg-editor-dark rounded-xl p-5 border border-white/8 space-y-4">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">Case A: Feasibility Cut</span>
              <span className="font-mono text-gap">Pruned at Depth 1</span>
            </div>

            <div className="space-y-3 text-xs font-mono tabular-nums">
              <div className="bg-editor-mid rounded-lg p-3 border border-white/10">
                <div className="text-text-secondary mb-1">Picked Weapon: Death&apos;s Fathom</div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Current FCR</span>
                  <span className="text-text-primary font-semibold">20%</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-text-secondary">+ Max remaining slots (suf[1])</span>
                  <span className="text-text-primary font-semibold">+70%</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-text-secondary">+ Reachable set bonus</span>
                  <span className="text-set-gold font-semibold">+10%</span>
                </div>
              </div>

              <div className="flex justify-center text-gap">
                <ArrowDown size={16} />
              </div>

              <div className="bg-editor-mid rounded-lg p-3 border border-gap/40 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-gap font-semibold">
                  <XCircle size={14} />
                  Max FCR = 100% &lt; 105%
                </span>
                <span className="text-text-secondary">Skip 12 leaves</span>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Even if we equip the highest-FCR Armor, Amulet, Gloves, and Tal&apos;s set bonus, we can never hit the 105% breakpoint—prune immediately.
            </p>
          </div>

          {/* Case B: Score Cutoff */}
          <div className="bg-editor-dark rounded-xl p-5 border border-white/8 space-y-4">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">Case B: Top-K Score Cutoff</span>
              <span className="font-mono text-set-gold">Pruned at Depth 2</span>
            </div>

            <div className="space-y-3 text-xs font-mono tabular-nums">
              <div className="bg-editor-mid rounded-lg p-3 border border-white/10">
                <div className="text-text-secondary mb-1">Picked: Spirit Sword + Vipermagi</div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Current +Skills</span>
                  <span className="text-text-primary font-semibold">+3</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-text-secondary">+ Max remaining slots (suf[2])</span>
                  <span className="text-text-primary font-semibold">+3</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-text-secondary">+ Reachable set bonus (bitmask = 0)</span>
                  <span className="text-text-secondary font-semibold">+0</span>
                </div>
              </div>

              <div className="flex justify-center text-set-gold">
                <ArrowDown size={16} />
              </div>

              <div className="bg-editor-mid rounded-lg p-3 border border-set-gold/40 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-set-gold font-semibold">
                  <XCircle size={14} />
                  Max +6 ≤ Cutoff (+7)
                </span>
                <span className="text-text-secondary">Skip 4 leaves</span>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              The bitmask confirms no 2-piece set is reachable and Top-2 already holds +7 builds, so this subtree can never enter the leaderboard.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
