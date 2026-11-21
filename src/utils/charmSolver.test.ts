import { describe, expect, it } from 'vitest';
import { CHARM_PRESETS } from '@/data/charmPresets';
import {
  buildPureAxisDp,
  charmObjectiveValue,
  fractionalUpperBound,
  minSlotsForShortfall,
  solveCharmKnapsack,
  type CharmConstraints,
  type CharmItem,
} from '@/utils/charmSolver';

/**
 * Exhaustive 2^m brute-force oracle for small pools to mathematically verify
 * that the Hybrid Solver never loses optimality.
 */
function bruteForceOptimalScore(
  pool: CharmItem[],
  constraints: CharmConstraints
): number | null {
  let best: number | null = null;
  const totalSubsets = 1 << pool.length;

  for (let mask = 0; mask < totalSubsets; mask++) {
    let slots = 0;
    let res = 0;
    let fhr = 0;
    let score = 0;

    for (let i = 0; i < pool.length; i++) {
      if ((mask & (1 << i)) === 0) continue;
      const c = pool[i];
      slots += c.size;
      if (slots > constraints.slotBudget) break;
      res += c.allRes;
      fhr += c.fhr;
      score += charmObjectiveValue(c, constraints.objective);
    }

    if (
      slots <= constraints.slotBudget &&
      res >= constraints.needRes &&
      fhr >= constraints.needFhr
    ) {
      if (best === null || score > best) best = score;
    }
  }

  return best;
}

describe('Hybrid Charm Knapsack Solver', () => {
  it('computes exact 1D DP minimum slots for pure-axis shortfalls', () => {
    const pureRes: CharmItem[] = [
      { id: 's5', name: '+5 Res SC', size: 1, skills: 0, allRes: 5, fhr: 0, mf: 0 },
      { id: 's4', name: '+4 Res SC', size: 1, skills: 0, allRes: 4, fhr: 0, mf: 0 },
      { id: 'l8', name: '+8 Res LC', size: 2, skills: 0, allRes: 8, fhr: 0, mf: 0 },
    ];

    const dp = buildPureAxisDp(pureRes, 'allRes', 5);
    expect(dp.maxGain[0]).toBe(0);
    expect(dp.maxGain[1]).toBe(5);
    expect(dp.maxGain[2]).toBe(9); // 5 + 4 > 8
    expect(dp.maxGain[3]).toBe(13); // 5 + 8
    expect(dp.maxGain[4]).toBe(17); // 5 + 4 + 8
    expect(minSlotsForShortfall(dp, 9)).toBe(2);
    expect(minSlotsForShortfall(dp, 18)).toBeNull();
  });

  it('computes admissible fractional upper bounds', () => {
    const entries = [
      { index: 0, value: 36, size: 3 }, // 12/slot
      { index: 1, value: 22, size: 2 }, // 11/slot
      { index: 2, value: 7, size: 1 },  // 7/slot
    ];
    // 4 slots => take 36 (3 slots) + ceil(22 * 1 / 2) = 11 => 47
    expect(fractionalUpperBound(entries, 0, 4)).toBe(47);
    // Starting from index 1 with 3 slots => take 22 (2 slots) + 7 (1 slot) = 29
    expect(fractionalUpperBound(entries, 1, 3)).toBe(29);
  });

  it('matches exhaustive 2^m brute-force optimum across all presets while slashing DFS nodes', () => {
    for (const preset of CHARM_PRESETS) {
      const exactOracle = bruteForceOptimalScore(
        preset.charms,
        preset.defaultConstraints
      );

      const hybrid = solveCharmKnapsack(
        preset.charms,
        preset.defaultConstraints,
        {
          useGreedySeed: true,
          usePureAxisDp: true,
          useFractionalBound: true,
        }
      );

      const naiveDfs = solveCharmKnapsack(
        preset.charms,
        preset.defaultConstraints,
        {
          useGreedySeed: false,
          usePureAxisDp: false,
          useFractionalBound: false,
        }
      );

      expect(hybrid.optimal.feasible).toBe(exactOracle !== null);
      expect(hybrid.optimal.score).toBe(exactOracle);
      expect(hybrid.optimal.usedSlots).toBeLessThanOrEqual(
        preset.defaultConstraints.slotBudget
      );
      expect(hybrid.optimal.totalRes).toBeGreaterThanOrEqual(
        preset.defaultConstraints.needRes
      );
      expect(hybrid.optimal.totalFhr).toBeGreaterThanOrEqual(
        preset.defaultConstraints.needFhr
      );
      expect(hybrid.dfsNodes).toBeLessThan(naiveDfs.dfsNodes);
    }
  });

  it('proves Exact Hybrid beats Greedy on the Greedy Knapsack Trap preset', () => {
    const trap = CHARM_PRESETS.find((p) => p.id === 'greedy-trap');
    expect(trap).toBeDefined();

    const result = solveCharmKnapsack(trap!.charms, trap!.defaultConstraints, {
      useGreedySeed: true,
      usePureAxisDp: true,
      useFractionalBound: true,
    });

    expect(result.greedy.feasible).toBe(true);
    expect(result.optimal.feasible).toBe(true);
    expect(result.optimal.score).toBeGreaterThan(result.greedy.score);
  });
});
