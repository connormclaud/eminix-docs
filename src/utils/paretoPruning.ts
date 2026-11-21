export type StatKey = 'skills' | 'fcr' | 'allRes' | 'mf';

export type GearCandidate = {
  id: string;
  name: string;
  slot: string;
  skills: number;
  fcr: number;
  allRes: number;
  mf: number;
  reqStr: number;
  setGroup?: string;
};

export type PruneOptions = {
  /** Number of top distinct builds we want to preserve (K). */
  limit: number;
  /** Maximum duplicate rolls of the same item name that may dominate a candidate. */
  sameNameCap?: number;
  /** Only allow comparisons within the same setGroup (protects multi-piece set bonuses). */
  protectSetGroups?: boolean;
  /** Count distinct dominator item names instead of raw duplicate copies. */
  countDistinctNames?: boolean;
};

export type PruneReason =
  | 'pareto-optimal'
  | 'top-k-diversity'
  | 'set-protected'
  | 'pruned-distinct'
  | 'pruned-same-name';

export type PruneDecision = {
  item: GearCandidate;
  kept: boolean;
  dominators: GearCandidate[];
  distinctDominatorNames: string[];
  sameNameDominators: number;
  blockedBySetProtection: GearCandidate[];
  reason: PruneReason;
};

export type PruneSummary = {
  kept: GearCandidate[];
  pruned: GearCandidate[];
  decisions: PruneDecision[];
};

export type PruningTraceStep = {
  stepNumber: number;
  candidate: GearCandidate;
  decision: PruneDecision;
  keptSoFar: GearCandidate[];
  prunedSoFar: GearCandidate[];
  headline: string;
  explanation: string;
};

const BENEFIT_KEYS: StatKey[] = ['skills', 'fcr', 'allRes', 'mf'];

/**
 * Returns true if item `a` strictly Pareto-dominates item `b`.
 *
 * `a` must be at least as good as `b` on every benefit stat, require no more
 * Strength (`a.reqStr <= b.reqStr`), and be strictly better on at least one axis.
 */
export function dominates(a: GearCandidate, b: GearCandidate): boolean {
  if (a.id === b.id) return false;
  if (a.reqStr > b.reqStr) return false;

  let strictlyBetter = a.reqStr < b.reqStr;

  for (const key of BENEFIT_KEYS) {
    if (a[key] < b[key]) {
      return false;
    }
    if (a[key] > b[key]) {
      strictlyBetter = true;
    }
  }

  return strictlyBetter;
}

/**
 * Set-signature guard: when set protection is active, items are only compared
 * within the same set equivalence class.
 */
export function inSameComparisonGroup(
  a: GearCandidate,
  b: GearCandidate,
  protectSetGroups: boolean
): boolean {
  if (!protectSetGroups) return true;
  return (a.setGroup ?? '') === (b.setGroup ?? '');
}

/**
 * Set-aware, top-K Pareto dominance pruning for multi-slot gear optimization.
 *
 * A candidate `b` is KEPT when BOTH conditions hold:
 *   1. Fewer than `sameNameCap` copies of the same item name dominate `b`.
 *   2. Fewer than `limit` distinct dominator names (or raw items, if disabled)
 *      dominate `b` within its comparison group.
 */
export function pruneCandidates(
  items: GearCandidate[],
  options: PruneOptions
): PruneSummary {
  const limit = Math.max(1, options.limit);
  const sameNameCap = Math.max(1, options.sameNameCap ?? limit);
  const protectSetGroups = options.protectSetGroups ?? true;
  const countDistinctNames = options.countDistinctNames ?? true;

  const decisions: PruneDecision[] = items.map((candidate) => {
    const dominators: GearCandidate[] = [];
    const blockedBySetProtection: GearCandidate[] = [];
    const distinctNames = new Set<string>();
    let sameNameDominators = 0;

    for (const other of items) {
      if (!dominates(other, candidate)) continue;

      if (!inSameComparisonGroup(other, candidate, protectSetGroups)) {
        blockedBySetProtection.push(other);
        continue;
      }

      dominators.push(other);
      distinctNames.add(other.name);
      if (other.name === candidate.name) {
        sameNameDominators += 1;
      }
    }

    const effectiveDominators = countDistinctNames
      ? distinctNames.size
      : dominators.length;

    let kept = true;
    let reason: PruneReason = 'pareto-optimal';

    if (sameNameDominators >= sameNameCap) {
      kept = false;
      reason = 'pruned-same-name';
    } else if (effectiveDominators >= limit) {
      kept = false;
      reason = 'pruned-distinct';
    } else if (dominators.length > 0) {
      kept = true;
      reason = 'top-k-diversity';
    } else if (candidate.setGroup && blockedBySetProtection.length > 0) {
      kept = true;
      reason = 'set-protected';
    }

    return {
      item: candidate,
      kept,
      dominators,
      distinctDominatorNames: Array.from(distinctNames),
      sameNameDominators,
      blockedBySetProtection,
      reason,
    };
  });

  return {
    kept: decisions.filter((d) => d.kept).map((d) => d.item),
    pruned: decisions.filter((d) => !d.kept).map((d) => d.item),
    decisions,
  };
}

/**
 * Generates an educational step-by-step trace directly from `pruneCandidates`
 * so the Walkthrough tab always matches the live algorithm.
 */
export function tracePruning(
  items: GearCandidate[],
  options: PruneOptions
): PruningTraceStep[] {
  const { decisions } = pruneCandidates(items, options);
  const limit = Math.max(1, options.limit);
  const keptSoFar: GearCandidate[] = [];
  const prunedSoFar: GearCandidate[] = [];

  return decisions.map((decision, index) => {
    if (decision.kept) {
      keptSoFar.push(decision.item);
    } else {
      prunedSoFar.push(decision.item);
    }

    const name = decision.item.name;
    let headline = '';
    let explanation = '';

    switch (decision.reason) {
      case 'pareto-optimal':
        headline = `Keep ${name} — Undominated Frontier Item`;
        explanation = `No other item in the same group beats or ties ${name} on every stat. It sits directly on the Pareto frontier and must stay in the search pool.`;
        break;
      case 'set-protected':
        headline = `Protect ${name} — Isolated by Set Signature`;
        explanation = `${decision.blockedBySetProtection.map((d) => d.name).join(', ')} beat its standalone stats, but ${name} belongs to "${decision.item.setGroup}". Comparing across set signatures would wrongly discard multi-piece set bonuses.`;
        break;
      case 'top-k-diversity':
        headline = `Keep ${name} — Preserved for Top-${limit} Diversity`;
        explanation = `Dominated by ${decision.distinctDominatorNames.join(', ')} (${decision.distinctDominatorNames.length} distinct name${decision.distinctDominatorNames.length === 1 ? '' : 's'} < limit ${limit}). Kept so the top-${limit} leaderboard still has distinct backup builds.`;
        break;
      case 'pruned-same-name':
        headline = `Prune ${name} — Worse Duplicate Roll`;
        explanation = `Strictly beaten by ${decision.sameNameDominators} better roll${decision.sameNameDominators === 1 ? '' : 's'} of "${name}". Keeping lower rolls of the exact same item only wastes search branches.`;
        break;
      case 'pruned-distinct':
        headline = `Prune ${name} — Dominated by ${decision.distinctDominatorNames.length} Distinct Items`;
        explanation = `${decision.distinctDominatorNames.join(', ')} strictly beat ${name} on every tracked stat. Even for a top-${limit} build list, ${name} can never place above them.`;
        break;
    }

    return {
      stepNumber: index + 1,
      candidate: decision.item,
      decision,
      keptSoFar: [...keptSoFar],
      prunedSoFar: [...prunedSoFar],
      headline,
      explanation,
    };
  });
}
