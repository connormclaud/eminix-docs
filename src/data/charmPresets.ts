import type { CharmConstraints, CharmItem } from '@/utils/charmSolver';

export type CharmPresetId = 'sorc-skillers' | 'greedy-trap' | 'res-crunch';

export type CharmPreset = {
  id: CharmPresetId;
  label: string;
  summary: string;
  defaultConstraints: CharmConstraints;
  charms: CharmItem[];
};

export const CHARM_PRESETS: CharmPreset[] = [
  {
    id: 'sorc-skillers',
    label: 'Sorceress Skiller Pack',
    summary:
      'Maximize +Skills inside a 14-slot charm budget while closing +30% All Res and +10% FHR shortfalls. Pure Res/FHR small charms offload straight into O(1) 1D DP tables.',
    defaultConstraints: {
      slotBudget: 14,
      needRes: 30,
      needFhr: 10,
      objective: 'skills',
    },
    charms: [
      { id: 'c-anni', name: 'Annihilus', size: 1, skills: 1, allRes: 12, fhr: 0, mf: 0 },
      { id: 'c-torch', name: 'Hellfire Torch', size: 2, skills: 3, allRes: 10, fhr: 0, mf: 0 },
      { id: 'c-gc-cold-fhr', name: 'Chilling GC of Balance', size: 3, skills: 1, allRes: 0, fhr: 12, mf: 0 },
      { id: 'c-gc-cold-1', name: 'Chilling GC #1', size: 3, skills: 1, allRes: 0, fhr: 0, mf: 0 },
      { id: 'c-gc-cold-2', name: 'Chilling GC #2', size: 3, skills: 1, allRes: 0, fhr: 0, mf: 0 },
      { id: 'c-gc-cold-3', name: 'Chilling GC #3', size: 3, skills: 1, allRes: 0, fhr: 0, mf: 0 },
      { id: 'c-sc-res-5', name: 'Shimmering SC (+5 Res)', size: 1, skills: 0, allRes: 5, fhr: 0, mf: 0 },
      { id: 'c-sc-res-4', name: 'Shimmering SC (+4 Res)', size: 1, skills: 0, allRes: 4, fhr: 0, mf: 0 },
      { id: 'c-lc-res-8', name: 'Shimmering LC (+8 Res)', size: 2, skills: 0, allRes: 8, fhr: 0, mf: 0 },
      { id: 'c-sc-fhr-1', name: 'SC of Balance (+5 FHR)', size: 1, skills: 0, allRes: 0, fhr: 5, mf: 0 },
      { id: 'c-sc-fhr-2', name: 'SC of Balance (+5 FHR)', size: 1, skills: 0, allRes: 0, fhr: 5, mf: 0 },
      { id: 'c-lc-fhr-8', name: 'LC of Balance (+8 FHR)', size: 2, skills: 0, allRes: 0, fhr: 8, mf: 0 },
    ],
  },
  {
    id: 'greedy-trap',
    label: 'Greedy Knapsack Trap',
    summary:
      'Classic integer knapsack trap: greedy density picks a 3-slot charm that leaves awkward leftover space, while Exact Hybrid packs a tighter combination with higher total Magic Find.',
    defaultConstraints: {
      slotBudget: 10,
      needRes: 15,
      needFhr: 0,
      objective: 'mf',
    },
    charms: [
      { id: 'g-gheeds', name: "Gheed's Fortune", size: 3, skills: 0, allRes: 0, fhr: 0, mf: 36 },
      { id: 'g-lc-mf-res', name: 'Shimmering LC of Luck', size: 2, skills: 0, allRes: 6, fhr: 0, mf: 18 },
      { id: 'g-lc-mf-1', name: 'Fortune LC #1', size: 2, skills: 0, allRes: 0, fhr: 0, mf: 22 },
      { id: 'g-lc-mf-2', name: 'Fortune LC #2', size: 2, skills: 0, allRes: 0, fhr: 0, mf: 22 },
      { id: 'g-lc-mf-3', name: 'Fortune LC #3', size: 2, skills: 0, allRes: 0, fhr: 0, mf: 22 },
      { id: 'g-sc-mf-7a', name: 'Good Luck SC (7% MF)', size: 1, skills: 0, allRes: 0, fhr: 0, mf: 7 },
      { id: 'g-sc-mf-7b', name: 'Good Luck SC (7% MF)', size: 1, skills: 0, allRes: 0, fhr: 0, mf: 7 },
      { id: 'g-sc-res-5a', name: 'Shimmering SC (+5 Res)', size: 1, skills: 0, allRes: 5, fhr: 0, mf: 0 },
      { id: 'g-sc-res-5b', name: 'Shimmering SC (+5 Res)', size: 1, skills: 0, allRes: 5, fhr: 0, mf: 0 },
      { id: 'g-sc-res-5c', name: 'Shimmering SC (+5 Res)', size: 1, skills: 0, allRes: 5, fhr: 0, mf: 0 },
      { id: 'g-lc-res-9', name: 'Shimmering LC (+9 Res)', size: 2, skills: 0, allRes: 9, fhr: 0, mf: 0 },
    ],
  },
  {
    id: 'res-crunch',
    label: 'Resistance Crunch',
    summary:
      'Tight +32% All Res and +12% FHR survival requirements force the solver to reserve mandatory pure-DP slots early and prune over-budget skiller branches.',
    defaultConstraints: {
      slotBudget: 12,
      needRes: 32,
      needFhr: 12,
      objective: 'skills',
    },
    charms: [
      { id: 'r-anni', name: 'Annihilus', size: 1, skills: 1, allRes: 15, fhr: 0, mf: 0 },
      { id: 'r-gc-sk-res', name: 'Sparking GC of Prism', size: 3, skills: 1, allRes: 12, fhr: 0, mf: 0 },
      { id: 'r-gc-sk-fhr', name: 'Sparking GC of Balance', size: 3, skills: 1, allRes: 0, fhr: 12, mf: 0 },
      { id: 'r-gc-sk-1', name: 'Sparking GC #1', size: 3, skills: 1, allRes: 0, fhr: 0, mf: 0 },
      { id: 'r-gc-sk-2', name: 'Sparking GC #2', size: 3, skills: 1, allRes: 0, fhr: 0, mf: 0 },
      { id: 'r-sc-res-5a', name: 'Shimmering SC (+5 Res)', size: 1, skills: 0, allRes: 5, fhr: 0, mf: 0 },
      { id: 'r-sc-res-5b', name: 'Shimmering SC (+5 Res)', size: 1, skills: 0, allRes: 5, fhr: 0, mf: 0 },
      { id: 'r-lc-res-8', name: 'Shimmering LC (+8 Res)', size: 2, skills: 0, allRes: 8, fhr: 0, mf: 0 },
      { id: 'r-gc-res-14', name: 'Shimmering GC (+14 Res)', size: 3, skills: 0, allRes: 14, fhr: 0, mf: 0 },
      { id: 'r-sc-fhr-5a', name: 'SC of Balance (+5 FHR)', size: 1, skills: 0, allRes: 0, fhr: 5, mf: 0 },
      { id: 'r-sc-fhr-5b', name: 'SC of Balance (+5 FHR)', size: 1, skills: 0, allRes: 0, fhr: 5, mf: 0 },
      { id: 'r-sc-fhr-5c', name: 'SC of Balance (+5 FHR)', size: 1, skills: 0, allRes: 0, fhr: 5, mf: 0 },
    ],
  },
];
