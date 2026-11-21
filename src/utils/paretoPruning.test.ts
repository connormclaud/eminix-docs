import { describe, expect, it } from 'vitest';
import { PARETO_PRESETS, WALKTHROUGH_POOL } from '@/data/paretoPresets';
import {
  dominates,
  inSameComparisonGroup,
  pruneCandidates,
  tracePruning,
  type GearCandidate,
} from '@/utils/paretoPruning';

const baseItem: GearCandidate = {
  id: 'a',
  name: 'Base Amulet',
  slot: 'Amulet',
  skills: 2,
  fcr: 10,
  allRes: 20,
  mf: 10,
  reqStr: 50,
};

describe('dominates', () => {
  it('returns true when all benefits are >=, reqStr is <=, and at least one stat is strictly better', () => {
    const stronger: GearCandidate = { ...baseItem, id: 'b', allRes: 25 };
    expect(dominates(stronger, baseItem)).toBe(true);
    expect(dominates(baseItem, stronger)).toBe(false);
  });

  it('returns true when benefits tie but strength requirement is strictly lower', () => {
    const lighter: GearCandidate = { ...baseItem, id: 'b', reqStr: 35 };
    expect(dominates(lighter, baseItem)).toBe(true);
    expect(dominates(baseItem, lighter)).toBe(false);
  });

  it('returns false on exact ties or incomparable trade-offs', () => {
    const exactCopy: GearCandidate = { ...baseItem, id: 'copy' };
    const tradeOff: GearCandidate = { ...baseItem, id: 'trade', fcr: 20, allRes: 15 };

    expect(dominates(exactCopy, baseItem)).toBe(false);
    expect(dominates(tradeOff, baseItem)).toBe(false);
    expect(dominates(baseItem, tradeOff)).toBe(false);
  });
});

describe('pruneCandidates', () => {
  it('isolates set pieces from non-set items when protectSetGroups is enabled', () => {
    const setItem: GearCandidate = {
      id: 'tals',
      name: "Tal Rasha's Adjudication",
      slot: 'Amulet',
      skills: 2,
      fcr: 0,
      allRes: 10,
      mf: 0,
      reqStr: 0,
      setGroup: "Tal Rasha's Wrappings",
    };
    const strongerUnique: GearCandidate = {
      id: 'maras',
      name: "Mara's Kaleidoscope",
      slot: 'Amulet',
      skills: 2,
      fcr: 0,
      allRes: 30,
      mf: 0,
      reqStr: 0,
    };

    expect(inSameComparisonGroup(strongerUnique, setItem, true)).toBe(false);

    const protectedResult = pruneCandidates([strongerUnique, setItem], {
      limit: 1,
      protectSetGroups: true,
    });
    expect(protectedResult.kept.map((i) => i.id)).toContain('tals');
    const talsDecision = protectedResult.decisions.find((d) => d.item.id === 'tals');
    expect(talsDecision?.reason).toBe('set-protected');

    const unprotectedResult = pruneCandidates([strongerUnique, setItem], {
      limit: 1,
      protectSetGroups: false,
    });
    expect(unprotectedResult.pruned.map((i) => i.id)).toContain('tals');
  });

  it('counts distinct dominator names so duplicate rolls do not crowd out top-K diversity', () => {
    const dupPreset = PARETO_PRESETS.find((p) => p.id === 'duplicate-trap');
    expect(dupPreset).toBeDefined();

    const withDistinct = pruneCandidates(dupPreset!.items, {
      limit: 2,
      sameNameCap: 1,
      protectSetGroups: true,
      countDistinctNames: true,
    });
    // Bitter Heart is dominated by 3 rolls of Mara's Kaleidoscope (only 1 distinct name < limit 2)
    expect(withDistinct.kept.map((i) => i.id)).toContain('dup-rare-backup');
    // Lower rolls of Mara's ARE pruned because sameNameCap = 1
    expect(withDistinct.pruned.map((i) => i.id)).toContain('dup-maras-28');
    expect(withDistinct.pruned.map((i) => i.id)).toContain('dup-maras-26');

    const withRawCounts = pruneCandidates(dupPreset!.items, {
      limit: 2,
      sameNameCap: 1,
      protectSetGroups: true,
      countDistinctNames: false,
    });
    // Without distinct-name counting, 3 Mara's rolls >= limit 2 wrongly prune Bitter Heart
    expect(withRawCounts.pruned.map((i) => i.id)).toContain('dup-rare-backup');
  });

  it('produces a consistent step-by-step walkthrough trace matching pruneCandidates', () => {
    const options = {
      limit: 2,
      sameNameCap: 1,
      protectSetGroups: true,
      countDistinctNames: true,
    };
    const summary = pruneCandidates(WALKTHROUGH_POOL, options);
    const trace = tracePruning(WALKTHROUGH_POOL, options);

    expect(trace).toHaveLength(WALKTHROUGH_POOL.length);
    const lastStep = trace[trace.length - 1];
    expect(lastStep.keptSoFar.map((i) => i.id)).toEqual(summary.kept.map((i) => i.id));
    expect(lastStep.prunedSoFar.map((i) => i.id)).toEqual(summary.pruned.map((i) => i.id));
    expect(trace.some((s) => s.decision.reason === 'set-protected')).toBe(true);
    expect(trace.some((s) => s.decision.reason === 'pruned-same-name')).toBe(true);
    expect(trace.some((s) => s.decision.reason === 'pruned-distinct')).toBe(true);
  });
});
