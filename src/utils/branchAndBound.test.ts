import { describe, expect, it } from 'vitest';
import { BNB_PRESETS } from '@/data/branchAndBoundPresets';
import {
  computeSetSuffixMasks,
  computeSuffixBounds,
  solveBranchAndBound,
  type PruningFlags,
} from '@/utils/branchAndBound';

const NO_PRUNING: PruningFlags = {
  useSuffixFeasibility: false,
  useSetBitmaskBounds: false,
  useScoreCutoff: false,
};

const FULL_PRUNING: PruningFlags = {
  useSuffixFeasibility: true,
  useSetBitmaskBounds: true,
  useScoreCutoff: true,
};

describe('Branch-and-Bound Gear Search', () => {
  it('computes exact per-slot suffix upper bounds', () => {
    const preset = BNB_PRESETS[0];
    const suf = computeSuffixBounds(preset.slots);

    expect(suf).toHaveLength(preset.slots.length + 1);
    expect(suf[preset.slots.length]).toEqual({ skills: 0, fcr: 0, allRes: 0, mf: 0 });
    // Weapon(40) + Armor(30) + Amulet(20) + Gloves(20) = 110 max FCR
    expect(suf[0].fcr).toBe(110);
    // Armor(30) + Amulet(20) + Gloves(20) = 70 max FCR after Weapon
    expect(suf[1].fcr).toBe(70);
  });

  it('tracks 2-piece set reachability accurately with bitmasks', () => {
    const preset = BNB_PRESETS[1]; // Tal's Armor at slot 1, Tal's Amulet at slot 2
    const { sufOne, sufTwo } = computeSetSuffixMasks(preset.slots);

    expect(sufTwo[0]).toBe(1); // Both pieces reachable from root
    expect(sufTwo[1]).toBe(1); // Both pieces reachable from Armor slot
    expect(sufTwo[2]).toBe(0); // Only 1 piece (Amulet) left at slot 2
    expect(sufOne[2]).toBe(1); // At least 1 piece still left at slot 2
    expect(sufOne[3]).toBe(0); // No Tal pieces in Gloves slot
  });

  it('produces identical Top-K results to brute-force DFS across all presets while pruning nodes', () => {
    for (const preset of BNB_PRESETS) {
      const brute = solveBranchAndBound(
        preset.slots,
        preset.setRules,
        preset.defaultConstraints,
        NO_PRUNING
      );
      const pruned = solveBranchAndBound(
        preset.slots,
        preset.setRules,
        preset.defaultConstraints,
        FULL_PRUNING
      );

      expect(pruned.topBuilds.length).toBe(brute.topBuilds.length);
      expect(pruned.topBuilds.map((b) => b.score)).toEqual(
        brute.topBuilds.map((b) => b.score)
      );
      expect(pruned.topBuilds.map((b) => b.items.map((x) => x.item.id))).toEqual(
        brute.topBuilds.map((b) => b.items.map((x) => x.item.id))
      );
      expect(pruned.visitedNodes).toBeLessThan(brute.visitedNodes);
      expect(pruned.prunedFeasibility + pruned.prunedScore).toBeGreaterThan(0);
    }
  });

  it('prunes strictly more or equal nodes when bitmask set bounds are enabled vs loose bounds', () => {
    const preset = BNB_PRESETS[1]; // Set-Bonus Bitmask preset
    const looseSetBounds = solveBranchAndBound(
      preset.slots,
      preset.setRules,
      preset.defaultConstraints,
      { useSuffixFeasibility: true, useSetBitmaskBounds: false, useScoreCutoff: true }
    );
    const tightBitmaskBounds = solveBranchAndBound(
      preset.slots,
      preset.setRules,
      preset.defaultConstraints,
      FULL_PRUNING
    );

    expect(tightBitmaskBounds.topBuilds.map((b) => b.score)).toEqual(
      looseSetBounds.topBuilds.map((b) => b.score)
    );
    expect(tightBitmaskBounds.visitedNodes).toBeLessThan(looseSetBounds.visitedNodes);
  });
});
