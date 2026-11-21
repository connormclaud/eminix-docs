export type ObjectiveKey = 'skills' | 'mf';

export type StatTotals = {
  skills: number;
  fcr: number;
  allRes: number;
  mf: number;
};

export type SlotItem = {
  id: string;
  name: string;
  skills: number;
  fcr: number;
  allRes: number;
  mf: number;
  /** Optional bit index (0..30) identifying an equipment set. */
  setBit?: number;
  setName?: string;
};

export type SetBonusRule = {
  bit: number;
  name: string;
  bonusSkills: number;
  bonusFcr: number;
  bonusAllRes: number;
  bonusMf: number;
};

export type SlotPool = {
  slot: string;
  items: SlotItem[];
};

export type SearchConstraints = {
  minFcr: number;
  minAllRes: number;
  topK: number;
  objective: ObjectiveKey;
};

export type PruningFlags = {
  useSuffixFeasibility: boolean;
  useSetBitmaskBounds: boolean;
  useScoreCutoff: boolean;
};

export type NodeStatus =
  | 'expanded'
  | 'pruned-feasibility'
  | 'pruned-score'
  | 'leaf-accepted'
  | 'leaf-infeasible'
  | 'leaf-dominated';

export type TreeNodeEvent = {
  nodeId: number;
  parentId: number | null;
  depth: number;
  slotName: string;
  pickedItem: SlotItem | null;
  acc: StatTotals;
  suffixMax: StatTotals;
  setBonusUb: StatTotals;
  upperBound: StatTotals;
  possibleSetMask: number;
  activeSetMask: number;
  status: NodeStatus;
  reason: string;
  cutoffAtVisit: number | null;
};

export type RankedBuild = {
  score: number;
  totals: StatTotals;
  items: { slot: string; item: SlotItem }[];
  activeSets: string[];
};

export type SearchResult = {
  topBuilds: RankedBuild[];
  visitedNodes: number;
  leafEvaluations: number;
  prunedFeasibility: number;
  prunedScore: number;
  totalCombinations: number;
  events: TreeNodeEvent[];
};

export const ZERO_STATS: StatTotals = { skills: 0, fcr: 0, allRes: 0, mf: 0 };

export function addStats(a: StatTotals, b: StatTotals): StatTotals {
  return {
    skills: a.skills + b.skills,
    fcr: a.fcr + b.fcr,
    allRes: a.allRes + b.allRes,
    mf: a.mf + b.mf,
  };
}

/**
 * Precomputes suffix upper bounds: `suf[i]` holds the maximum achievable
 * value for each stat across remaining slots `i..slots.length - 1`.
 */
export function computeSuffixBounds(slots: SlotPool[]): StatTotals[] {
  const n = slots.length;
  const suf: StatTotals[] = Array.from({ length: n + 1 }, () => ({ ...ZERO_STATS }));

  for (let i = n - 1; i >= 0; i--) {
    let maxSkills = 0;
    let maxFcr = 0;
    let maxRes = 0;
    let maxMf = 0;

    for (const item of slots[i].items) {
      if (item.skills > maxSkills) maxSkills = item.skills;
      if (item.fcr > maxFcr) maxFcr = item.fcr;
      if (item.allRes > maxRes) maxRes = item.allRes;
      if (item.mf > maxMf) maxMf = item.mf;
    }

    suf[i] = {
      skills: suf[i + 1].skills + maxSkills,
      fcr: suf[i + 1].fcr + maxFcr,
      allRes: suf[i + 1].allRes + maxRes,
      mf: suf[i + 1].mf + maxMf,
    };
  }

  return suf;
}

/**
 * Precomputes bitmask suffix tables for 2-piece set bonuses:
 *   - `sufOne[i]`: sets that have >= 1 piece in slots `i..n-1`
 *   - `sufTwo[i]`: sets that have >= 2 pieces in slots `i..n-1`
 */
export function computeSetSuffixMasks(slots: SlotPool[]): {
  sufOne: number[];
  sufTwo: number[];
  allSetsMask: number;
} {
  const n = slots.length;
  const slotMasks = slots.map((pool) => {
    let mask = 0;
    for (const item of pool.items) {
      if (item.setBit !== undefined) {
        mask |= 1 << item.setBit;
      }
    }
    return mask;
  });

  const sufOne = new Array<number>(n + 1).fill(0);
  const sufTwo = new Array<number>(n + 1).fill(0);

  for (let i = n - 1; i >= 0; i--) {
    sufTwo[i] = sufTwo[i + 1] | (sufOne[i + 1] & slotMasks[i]);
    sufOne[i] = sufOne[i + 1] | slotMasks[i];
  }

  return { sufOne, sufTwo, allSetsMask: sufTwo[0] };
}

/**
 * Sums the 2-piece set bonuses for every bit currently set in `mask`.
 */
export function bonusForSetMask(mask: number, setRules: SetBonusRule[]): StatTotals {
  let acc: StatTotals = { ...ZERO_STATS };
  for (const rule of setRules) {
    if ((mask & (1 << rule.bit)) !== 0) {
      acc = {
        skills: acc.skills + rule.bonusSkills,
        fcr: acc.fcr + rule.bonusFcr,
        allRes: acc.allRes + rule.bonusAllRes,
        mf: acc.mf + rule.bonusMf,
      };
    }
  }
  return acc;
}

function objectiveValue(stats: StatTotals, objective: ObjectiveKey): number {
  return objective === 'skills' ? stats.skills : stats.mf;
}

/**
 * Branch-and-Bound DFS gear search with:
 *   1. O(1) suffix upper-bound feasibility checks (FCR & All Res)
 *   2. Bitmask 2-piece set-bonus reachability bounds
 *   3. Bounded Top-K incumbent score cutoff
 */
export function solveBranchAndBound(
  slots: SlotPool[],
  setRules: SetBonusRule[],
  constraints: SearchConstraints,
  flags: PruningFlags
): SearchResult {
  const topK = Math.max(1, constraints.topK);
  const suf = computeSuffixBounds(slots);
  const { sufOne, sufTwo, allSetsMask } = computeSetSuffixMasks(slots);
  const totalCombinations = slots.reduce((prod, s) => prod * Math.max(1, s.items.length), 1);

  const topBuilds: RankedBuild[] = [];
  const events: TreeNodeEvent[] = [];
  let nextNodeId = 0;
  let visitedNodes = 0;
  let leafEvaluations = 0;
  let prunedFeasibility = 0;
  let prunedScore = 0;

  const currentCutoff = (): number | null => {
    if (topBuilds.length < topK) return null;
    return topBuilds[topK - 1].score;
  };

  const insertCandidate = (build: RankedBuild): boolean => {
    const cutoff = currentCutoff();
    if (cutoff !== null && build.score <= cutoff) {
      return false;
    }
    topBuilds.push(build);
    topBuilds.sort(
      (a, b) =>
        b.score - a.score ||
        b.totals.allRes - a.totals.allRes ||
        b.totals.fcr - a.totals.fcr
    );
    if (topBuilds.length > topK) {
      topBuilds.length = topK;
    }
    return true;
  };

  const chosen: { slot: string; item: SlotItem }[] = [];

  function dfs(
    depth: number,
    parentId: number | null,
    pickedItem: SlotItem | null,
    acc: StatTotals,
    seenOnce: number,
    seenTwice: number
  ): void {
    const nodeId = nextNodeId++;
    visitedNodes += 1;

    const slotName = depth === 0 ? 'Root' : slots[depth - 1].slot;
    const suffixMax = suf[depth];
    const possibleSetMask = flags.useSetBitmaskBounds
      ? seenTwice | (seenOnce & sufOne[depth]) | sufTwo[depth]
      : allSetsMask;
    const setBonusUb = bonusForSetMask(possibleSetMask, setRules);
    const upperBound = addStats(addStats(acc, suffixMax), setBonusUb);
    const cutoff = currentCutoff();

    // Leaf evaluation
    if (depth === slots.length) {
      leafEvaluations += 1;
      const activeBonus = bonusForSetMask(seenTwice, setRules);
      const finalTotals = addStats(acc, activeBonus);
      const score = objectiveValue(finalTotals, constraints.objective);

      if (finalTotals.fcr < constraints.minFcr || finalTotals.allRes < constraints.minAllRes) {
        events.push({
          nodeId,
          parentId,
          depth,
          slotName,
          pickedItem,
          acc,
          suffixMax,
          setBonusUb: activeBonus,
          upperBound: finalTotals,
          possibleSetMask: seenTwice,
          activeSetMask: seenTwice,
          status: 'leaf-infeasible',
          reason:
            finalTotals.fcr < constraints.minFcr
              ? `Leaf FCR ${finalTotals.fcr}% < min ${constraints.minFcr}%`
              : `Leaf All Res ${finalTotals.allRes}% < min ${constraints.minAllRes}%`,
          cutoffAtVisit: cutoff,
        });
        return;
      }

      const activeSets = setRules
        .filter((r) => (seenTwice & (1 << r.bit)) !== 0)
        .map((r) => r.name);

      const accepted = insertCandidate({
        score,
        totals: finalTotals,
        items: [...chosen],
        activeSets,
      });

      events.push({
        nodeId,
        parentId,
        depth,
        slotName,
        pickedItem,
        acc,
        suffixMax,
        setBonusUb: activeBonus,
        upperBound: finalTotals,
        possibleSetMask: seenTwice,
        activeSetMask: seenTwice,
        status: accepted ? 'leaf-accepted' : 'leaf-dominated',
        reason: accepted
          ? `Accepted into Top-${topK} (score ${score})`
          : `Score ${score} does not beat Top-${topK} cutoff (${cutoff})`,
        cutoffAtVisit: cutoff,
      });
      return;
    }

    // 1. Suffix feasibility pruning
    if (flags.useSuffixFeasibility) {
      if (upperBound.fcr < constraints.minFcr) {
        prunedFeasibility += 1;
        events.push({
          nodeId,
          parentId,
          depth,
          slotName,
          pickedItem,
          acc,
          suffixMax,
          setBonusUb,
          upperBound,
          possibleSetMask,
          activeSetMask: seenTwice,
          status: 'pruned-feasibility',
          reason: `Max FCR ${upperBound.fcr}% < min ${constraints.minFcr}%`,
          cutoffAtVisit: cutoff,
        });
        return;
      }
      if (upperBound.allRes < constraints.minAllRes) {
        prunedFeasibility += 1;
        events.push({
          nodeId,
          parentId,
          depth,
          slotName,
          pickedItem,
          acc,
          suffixMax,
          setBonusUb,
          upperBound,
          possibleSetMask,
          activeSetMask: seenTwice,
          status: 'pruned-feasibility',
          reason: `Max All Res ${upperBound.allRes}% < min ${constraints.minAllRes}%`,
          cutoffAtVisit: cutoff,
        });
        return;
      }
    }

    // 2. Dynamic Top-K incumbent score cutoff
    if (flags.useScoreCutoff && cutoff !== null) {
      const maxPossibleScore = objectiveValue(upperBound, constraints.objective);
      if (maxPossibleScore <= cutoff) {
        prunedScore += 1;
        events.push({
          nodeId,
          parentId,
          depth,
          slotName,
          pickedItem,
          acc,
          suffixMax,
          setBonusUb,
          upperBound,
          possibleSetMask,
          activeSetMask: seenTwice,
          status: 'pruned-score',
          reason: `Max score ${maxPossibleScore} <= Top-${topK} cutoff (${cutoff})`,
          cutoffAtVisit: cutoff,
        });
        return;
      }
    }

    // Node is viable — record expansion and branch into next slot
    events.push({
      nodeId,
      parentId,
      depth,
      slotName,
      pickedItem,
      acc,
      suffixMax,
      setBonusUb,
      upperBound,
      possibleSetMask,
      activeSetMask: seenTwice,
      status: 'expanded',
      reason: `Feasible (UB: ${upperBound.fcr}% FCR, ${upperBound.allRes}% Res, score <= ${objectiveValue(upperBound, constraints.objective)})`,
      cutoffAtVisit: cutoff,
    });

    const nextPool = slots[depth];
    for (const item of nextPool.items) {
      const nextAcc = addStats(acc, item);
      let nextOnce = seenOnce;
      let nextTwice = seenTwice;
      if (item.setBit !== undefined) {
        const bitMask = 1 << item.setBit;
        if ((seenOnce & bitMask) !== 0) {
          nextTwice |= bitMask;
        }
        nextOnce |= bitMask;
      }
      chosen.push({ slot: nextPool.slot, item });
      dfs(depth + 1, nodeId, item, nextAcc, nextOnce, nextTwice);
      chosen.pop();
    }
  }

  dfs(0, null, null, { ...ZERO_STATS }, 0, 0);

  return {
    topBuilds,
    visitedNodes,
    leafEvaluations,
    prunedFeasibility,
    prunedScore,
    totalCombinations,
    events,
  };
}
