export type CharmObjective = 'skills' | 'mf';

export type CharmSize = 1 | 2 | 3;

export type CharmItem = {
  id: string;
  name: string;
  /** Vertical inventory slots occupied: 1 = Small, 2 = Large, 3 = Grand. */
  size: CharmSize;
  skills: number;
  allRes: number;
  fhr: number;
  mf: number;
};

export type CharmConstraints = {
  slotBudget: number;
  needRes: number;
  needFhr: number;
  objective: CharmObjective;
};

export type SolverFlags = {
  useGreedySeed: boolean;
  usePureAxisDp: boolean;
  useFractionalBound: boolean;
};

export type PureAxisDpTable = {
  axis: 'allRes' | 'fhr';
  /** maxGain[s] = maximum stat gain achievable using at most `s` slots. */
  maxGain: number[];
  /** bestPicks[s] = exact charm list attaining maxGain[s]. */
  bestPicks: CharmItem[][];
  maxAchievable: number;
};

export type CharmStepKind =
  | 'greedy-seed'
  | 'dp-ready'
  | 'dfs-accept'
  | 'dfs-prune-feasibility'
  | 'dfs-prune-bound'
  | 'dfs-branch';

export type CharmStepEvent = {
  step: number;
  kind: CharmStepKind;
  charmName: string;
  pickedNames: string[];
  remSlots: number;
  needResLeft: number;
  needFhrLeft: number;
  dpReservedSlots: number;
  curScore: number;
  upperBoundScore: number;
  bestScore: number | null;
  detail: string;
};

export type CharmSolution = {
  feasible: boolean;
  score: number;
  usedSlots: number;
  totalRes: number;
  totalFhr: number;
  totalSkills: number;
  totalMf: number;
  charms: CharmItem[];
};

export type HybridCharmResult = {
  greedy: CharmSolution;
  optimal: CharmSolution;
  pureResDp: PureAxisDpTable;
  pureFhrDp: PureAxisDpTable;
  branchingCharms: CharmItem[];
  pureResCharms: CharmItem[];
  pureFhrCharms: CharmItem[];
  dfsNodes: number;
  prunedFeasibility: number;
  prunedBound: number;
  events: CharmStepEvent[];
};

export function charmObjectiveValue(c: CharmItem, obj: CharmObjective): number {
  return obj === 'skills' ? c.skills : c.mf;
}

function summarizeCharms(
  charms: CharmItem[],
  constraints: CharmConstraints
): CharmSolution {
  let usedSlots = 0;
  let totalRes = 0;
  let totalFhr = 0;
  let totalSkills = 0;
  let totalMf = 0;

  for (const c of charms) {
    usedSlots += c.size;
    totalRes += c.allRes;
    totalFhr += c.fhr;
    totalSkills += c.skills;
    totalMf += c.mf;
  }

  const feasible =
    usedSlots <= constraints.slotBudget &&
    totalRes >= constraints.needRes &&
    totalFhr >= constraints.needFhr;

  return {
    feasible,
    score: constraints.objective === 'skills' ? totalSkills : totalMf,
    usedSlots,
    totalRes,
    totalFhr,
    totalSkills,
    totalMf,
    charms,
  };
}

/**
 * 1D 0/1 Knapsack DP for pure single-axis charms (e.g., charms that only
 * provide All Res or only provide FHR, with zero objective value).
 *
 * Returns `maxGain[s]` and `bestPicks[s]` for every slot count `0..maxSlots`,
 * enabling O(1) minimum-slot lookups inside Branch-and-Bound DFS.
 */
export function buildPureAxisDp(
  charms: CharmItem[],
  axis: 'allRes' | 'fhr',
  maxSlots: number
): PureAxisDpTable {
  const cap = Math.max(0, maxSlots);
  const maxGain = new Array<number>(cap + 1).fill(0);
  const bestPicks: CharmItem[][] = Array.from({ length: cap + 1 }, () => []);

  for (const ch of charms) {
    const gain = ch[axis];
    if (gain <= 0 || ch.size > cap) continue;
    for (let s = cap; s >= ch.size; s--) {
      const candidate = maxGain[s - ch.size] + gain;
      if (candidate > maxGain[s]) {
        maxGain[s] = candidate;
        bestPicks[s] = [...bestPicks[s - ch.size], ch];
      }
    }
  }

  // Enforce non-decreasing prefix so index `s` means "at most s slots"
  for (let s = 1; s <= cap; s++) {
    if (maxGain[s - 1] > maxGain[s]) {
      maxGain[s] = maxGain[s - 1];
      bestPicks[s] = [...bestPicks[s - 1]];
    }
  }

  return {
    axis,
    maxGain,
    bestPicks,
    maxAchievable: maxGain[cap] ?? 0,
  };
}

/**
 * Returns the minimum slot count needed by a PureAxisDpTable to cover `need`,
 * or `null` if the shortfall is impossible even using all available pure charms.
 */
export function minSlotsForShortfall(
  dp: PureAxisDpTable,
  need: number
): number | null {
  if (need <= 0) return 0;
  for (let s = 0; s < dp.maxGain.length; s++) {
    if (dp.maxGain[s] >= need) return s;
  }
  return null;
}

/**
 * Admissible fractional knapsack upper bound over charms `startIdx..end`.
 * Sorts remaining charms by value-per-slot density and takes whole charms
 * plus the ceiling of the final fractional slice.
 */
export function fractionalUpperBound(
  sortedByDensity: { index: number; value: number; size: number }[],
  minIndex: number,
  remSlots: number
): number {
  if (remSlots <= 0) return 0;
  let slotsLeft = remSlots;
  let bound = 0;

  for (const entry of sortedByDensity) {
    if (entry.index < minIndex || entry.value <= 0) continue;
    if (entry.size <= slotsLeft) {
      bound += entry.value;
      slotsLeft -= entry.size;
    } else {
      bound += Math.ceil((entry.value * slotsLeft) / entry.size);
      break;
    }
    if (slotsLeft === 0) break;
  }

  return bound;
}

/**
 * Fast O(m log m) greedy heuristic:
 *   1. Repair All Res shortfall by best Res-per-slot density
 *   2. Repair FHR shortfall by best FHR-per-slot density
 *   3. Fill remaining slots by best objective-per-slot density
 */
export function greedySeedCharms(
  pool: CharmItem[],
  constraints: CharmConstraints
): CharmSolution {
  const used = new Set<string>();
  const picked: CharmItem[] = [];
  let remSlots = constraints.slotBudget;
  let curRes = 0;
  let curFhr = 0;

  const pickBestBy = (
    metric: (c: CharmItem) => number,
    done: () => boolean
  ) => {
    while (!done() && remSlots > 0) {
      let best: CharmItem | null = null;
      let bestDensity = 0;
      for (const c of pool) {
        if (used.has(c.id) || c.size > remSlots) continue;
        const val = metric(c);
        if (val <= 0) continue;
        const density = val / c.size;
        if (
          density > bestDensity ||
          (density === bestDensity &&
            best !== null &&
            charmObjectiveValue(c, constraints.objective) >
              charmObjectiveValue(best, constraints.objective))
        ) {
          bestDensity = density;
          best = c;
        }
      }
      if (!best) break;
      used.add(best.id);
      picked.push(best);
      remSlots -= best.size;
      curRes += best.allRes;
      curFhr += best.fhr;
    }
  };

  pickBestBy((c) => c.allRes, () => curRes >= constraints.needRes);
  pickBestBy((c) => c.fhr, () => curFhr >= constraints.needFhr);
  pickBestBy(
    (c) => charmObjectiveValue(c, constraints.objective),
    () => false
  );

  return summarizeCharms(picked, constraints);
}

/**
 * Hybrid Charm Knapsack Solver combining:
 *   1. Greedy incumbent seeding
 *   2. 1D DP offloading for pure single-axis Res / FHR charms
 *   3. Density-sorted fractional upper-bound pruning inside exact DFS
 */
export function solveCharmKnapsack(
  pool: CharmItem[],
  constraints: CharmConstraints,
  flags: SolverFlags
): HybridCharmResult {
  const greedy = greedySeedCharms(pool, constraints);
  const events: CharmStepEvent[] = [];

  // Partition pure single-axis filler charms when 1D DP offloading is enabled
  const pureResCharms: CharmItem[] = [];
  const pureFhrCharms: CharmItem[] = [];
  const branchingCharms: CharmItem[] = [];

  for (const ch of pool) {
    const objVal = charmObjectiveValue(ch, constraints.objective);
    if (flags.usePureAxisDp && objVal === 0 && ch.allRes > 0 && ch.fhr === 0) {
      pureResCharms.push(ch);
    } else if (flags.usePureAxisDp && objVal === 0 && ch.fhr > 0 && ch.allRes === 0) {
      pureFhrCharms.push(ch);
    } else {
      branchingCharms.push(ch);
    }
  }

  // Sort branching charms by objective density descending to find strong solutions early
  branchingCharms.sort((a, b) => {
    const da = charmObjectiveValue(a, constraints.objective) / a.size;
    const db = charmObjectiveValue(b, constraints.objective) / b.size;
    return db - da || b.allRes + b.fhr - (a.allRes + a.fhr);
  });

  const pureResDp = buildPureAxisDp(pureResCharms, 'allRes', constraints.slotBudget);
  const pureFhrDp = buildPureAxisDp(pureFhrCharms, 'fhr', constraints.slotBudget);

  // Suffix totals for O(1) feasibility checks over branching charms
  const m = branchingCharms.length;
  const sufRes = new Array<number>(m + 1).fill(0);
  const sufFhr = new Array<number>(m + 1).fill(0);
  const sufObj = new Array<number>(m + 1).fill(0);
  for (let i = m - 1; i >= 0; i--) {
    sufRes[i] = sufRes[i + 1] + branchingCharms[i].allRes;
    sufFhr[i] = sufFhr[i + 1] + branchingCharms[i].fhr;
    sufObj[i] =
      sufObj[i + 1] + charmObjectiveValue(branchingCharms[i], constraints.objective);
  }

  const objDensity = branchingCharms
    .map((c, index) => ({
      index,
      value: charmObjectiveValue(c, constraints.objective),
      size: c.size,
    }))
    .sort((a, b) => b.value / b.size - a.value / a.size);

  const resDensity = branchingCharms
    .map((c, index) => ({ index, value: c.allRes, size: c.size }))
    .sort((a, b) => b.value / b.size - a.value / a.size);

  const fhrDensity = branchingCharms
    .map((c, index) => ({ index, value: c.fhr, size: c.size }))
    .sort((a, b) => b.value / b.size - a.value / a.size);

  let bestSolution: CharmSolution | null =
    flags.useGreedySeed && greedy.feasible ? greedy : null;

  const pushEvent = (ev: Omit<CharmStepEvent, 'step'>) => {
    if (events.length < 120) {
      events.push({ ...ev, step: events.length + 1 });
    }
  };

  if (flags.useGreedySeed) {
    pushEvent({
      kind: 'greedy-seed',
      charmName: 'Greedy Heuristic Pass',
      pickedNames: greedy.charms.map((c) => c.name),
      remSlots: constraints.slotBudget - greedy.usedSlots,
      needResLeft: Math.max(0, constraints.needRes - greedy.totalRes),
      needFhrLeft: Math.max(0, constraints.needFhr - greedy.totalFhr),
      dpReservedSlots: 0,
      curScore: greedy.score,
      upperBoundScore: greedy.score,
      bestScore: greedy.feasible ? greedy.score : null,
      detail: greedy.feasible
        ? `Greedy seed found a valid baseline (score ${greedy.score}, ${greedy.usedSlots}/${constraints.slotBudget} slots) to tighten early pruning.`
        : 'Greedy seed could not satisfy all constraints; exact DFS starts without an initial bound.',
    });
  }

  if (flags.usePureAxisDp) {
    pushEvent({
      kind: 'dp-ready',
      charmName: '1D Pure-Axis DP Tables',
      pickedNames: [],
      remSlots: constraints.slotBudget,
      needResLeft: constraints.needRes,
      needFhrLeft: constraints.needFhr,
      dpReservedSlots: 0,
      curScore: 0,
      upperBoundScore: sufObj[0],
      bestScore: bestSolution ? bestSolution.score : null,
      detail: `Offloaded ${pureResCharms.length} pure Res and ${pureFhrCharms.length} pure FHR charms into O(1) DP tables — DFS only branches over ${branchingCharms.length} charms.`,
    });
  }

  let dfsNodes = 0;
  let prunedFeasibility = 0;
  let prunedBound = 0;
  const curPicked: CharmItem[] = [];

  function dfs(
    idx: number,
    remSlots: number,
    curRes: number,
    curFhr: number,
    curScore: number
  ): void {
    dfsNodes += 1;
    const needResLeft = Math.max(0, constraints.needRes - curRes);
    const needFhrLeft = Math.max(0, constraints.needFhr - curFhr);

    // Check if pure-axis DP tables can immediately close all remaining shortfalls
    const resDpSlots = minSlotsForShortfall(pureResDp, needResLeft);
    const fhrDpSlots = minSlotsForShortfall(pureFhrDp, needFhrLeft);
    if (
      resDpSlots !== null &&
      fhrDpSlots !== null &&
      resDpSlots + fhrDpSlots <= remSlots
    ) {
      if (bestSolution === null || curScore > bestSolution.score) {
        const combined = [
          ...curPicked,
          ...pureResDp.bestPicks[resDpSlots],
          ...pureFhrDp.bestPicks[fhrDpSlots],
        ];
        bestSolution = summarizeCharms(combined, constraints);
        pushEvent({
          kind: 'dfs-accept',
          charmName: idx > 0 ? branchingCharms[idx - 1].name : 'DP Completion',
          pickedNames: combined.map((c) => c.name),
          remSlots: remSlots - resDpSlots - fhrDpSlots,
          needResLeft: 0,
          needFhrLeft: 0,
          dpReservedSlots: resDpSlots + fhrDpSlots,
          curScore,
          upperBoundScore: curScore,
          bestScore: bestSolution.score,
          detail: `New best packing found (score ${bestSolution.score}) using ${curPicked.length} branching charm(s) + ${resDpSlots + fhrDpSlots} DP slot(s).`,
        });
      }
    }

    if (idx === m || remSlots === 0) return;

    // 1. O(1) suffix + DP reachability check
    if (
      needResLeft > sufRes[idx] + pureResDp.maxAchievable ||
      needFhrLeft > sufFhr[idx] + pureFhrDp.maxAchievable
    ) {
      prunedFeasibility += 1;
      pushEvent({
        kind: 'dfs-prune-feasibility',
        charmName: branchingCharms[idx].name,
        pickedNames: curPicked.map((c) => c.name),
        remSlots,
        needResLeft,
        needFhrLeft,
        dpReservedSlots: 0,
        curScore,
        upperBoundScore: curScore,
        bestScore: bestSolution ? bestSolution.score : null,
        detail: `Pruned: remaining branching + DP charms cannot close Res (${needResLeft}) or FHR (${needFhrLeft}) shortfall.`,
      });
      return;
    }

    // 2. Reserve mandatory pure-DP slots when branching charms alone cannot meet shortfalls
    const mustResFromDp = Math.max(0, needResLeft - sufRes[idx]);
    const mustFhrFromDp = Math.max(0, needFhrLeft - sufFhr[idx]);
    const mustResSlots = minSlotsForShortfall(pureResDp, mustResFromDp);
    const mustFhrSlots = minSlotsForShortfall(pureFhrDp, mustFhrFromDp);
    if (
      mustResSlots === null ||
      mustFhrSlots === null ||
      mustResSlots + mustFhrSlots > remSlots
    ) {
      prunedFeasibility += 1;
      pushEvent({
        kind: 'dfs-prune-feasibility',
        charmName: branchingCharms[idx].name,
        pickedNames: curPicked.map((c) => c.name),
        remSlots,
        needResLeft,
        needFhrLeft,
        dpReservedSlots: (mustResSlots ?? 99) + (mustFhrSlots ?? 99),
        curScore,
        upperBoundScore: curScore,
        bestScore: bestSolution ? bestSolution.score : null,
        detail: `Pruned: mandatory DP slots exceed remaining ${remSlots} slot(s).`,
      });
      return;
    }

    const reservedDpSlots = mustResSlots + mustFhrSlots;
    const remDfsSlots = remSlots - reservedDpSlots;

    // 3. Fractional density upper-bound pruning on objective & shortfalls
    if (flags.useFractionalBound) {
      if (
        needResLeft >
        fractionalUpperBound(resDensity, idx, remSlots) + pureResDp.maxAchievable
      ) {
        prunedFeasibility += 1;
        return;
      }
      if (
        needFhrLeft >
        fractionalUpperBound(fhrDensity, idx, remSlots) + pureFhrDp.maxAchievable
      ) {
        prunedFeasibility += 1;
        return;
      }
      if (bestSolution !== null) {
        const ub = curScore + fractionalUpperBound(objDensity, idx, remDfsSlots);
        if (ub <= bestSolution.score) {
          prunedBound += 1;
          pushEvent({
            kind: 'dfs-prune-bound',
            charmName: branchingCharms[idx].name,
            pickedNames: curPicked.map((c) => c.name),
            remSlots,
            needResLeft,
            needFhrLeft,
            dpReservedSlots: reservedDpSlots,
            curScore,
            upperBoundScore: ub,
            bestScore: bestSolution.score,
            detail: `Pruned by fractional upper bound: max score ${ub} <= current best ${bestSolution.score} with ${remDfsSlots} DFS slot(s) left.`,
          });
          return;
        }
      }
    }

    const charm = branchingCharms[idx];
    const ubPreview = flags.useFractionalBound
      ? curScore + fractionalUpperBound(objDensity, idx, remDfsSlots)
      : curScore + sufObj[idx];

    pushEvent({
      kind: 'dfs-branch',
      charmName: charm.name,
      pickedNames: curPicked.map((c) => c.name),
      remSlots,
      needResLeft,
      needFhrLeft,
      dpReservedSlots: reservedDpSlots,
      curScore,
      upperBoundScore: ubPreview,
      bestScore: bestSolution ? bestSolution.score : null,
      detail: `Branch on ${charm.name} (size ${charm.size}): try Pick then Skip (upper bound ${ubPreview}).`,
    });

    // Branch A: Pick charm[idx] if it fits
    if (charm.size <= remDfsSlots) {
      curPicked.push(charm);
      dfs(
        idx + 1,
        remSlots - charm.size,
        curRes + charm.allRes,
        curFhr + charm.fhr,
        curScore + charmObjectiveValue(charm, constraints.objective)
      );
      curPicked.pop();
    }

    // Branch B: Skip charm[idx]
    dfs(idx + 1, remSlots, curRes, curFhr, curScore);
  }

  dfs(0, constraints.slotBudget, 0, 0, 0);

  const optimal = bestSolution ?? summarizeCharms([], constraints);

  return {
    greedy,
    optimal,
    pureResDp,
    pureFhrDp,
    branchingCharms,
    pureResCharms,
    pureFhrCharms,
    dfsNodes,
    prunedFeasibility,
    prunedBound,
    events,
  };
}
