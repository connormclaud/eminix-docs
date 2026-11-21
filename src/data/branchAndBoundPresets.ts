import type {
  SearchConstraints,
  SetBonusRule,
  SlotPool,
} from '@/utils/branchAndBound';

export type BnBPresetId = 'sorc-fcr' | 'tals-set' | 'mf-farmer';

export type BnBPreset = {
  id: BnBPresetId;
  label: string;
  summary: string;
  slots: SlotPool[];
  setRules: SetBonusRule[];
  defaultConstraints: SearchConstraints;
};

const TAL_RASHA_BIT = 0;

export const BNB_PRESETS: BnBPreset[] = [
  {
    id: 'sorc-fcr',
    label: '105% FCR Sorceress',
    summary:
      'Maximize +Skills while hitting the 105% Faster Cast Rate breakpoint and 60% All Res. Watch low-FCR branches prune at depth 1 and 2.',
    setRules: [
      {
        bit: TAL_RASHA_BIT,
        name: "Tal Rasha's (2pc)",
        bonusSkills: 1,
        bonusFcr: 10,
        bonusAllRes: 15,
        bonusMf: 65,
      },
    ],
    defaultConstraints: {
      minFcr: 105,
      minAllRes: 60,
      topK: 2,
      objective: 'skills',
    },
    slots: [
      {
        slot: 'Weapon',
        items: [
          { id: 'w-hoto', name: 'Heart of the Oak', skills: 3, fcr: 40, allRes: 35, mf: 0 },
          { id: 'w-occy', name: 'The Oculus', skills: 3, fcr: 30, allRes: 20, mf: 50 },
          { id: 'w-fathom', name: "Death's Fathom", skills: 3, fcr: 20, allRes: 15, mf: 0 },
        ],
      },
      {
        slot: 'Armor',
        items: [
          { id: 'a-viper', name: 'Vipermagi', skills: 1, fcr: 30, allRes: 35, mf: 24 },
          {
            id: 'a-tals',
            name: "Tal's Armor",
            skills: 0,
            fcr: 0,
            allRes: 25,
            mf: 88,
            setBit: TAL_RASHA_BIT,
            setName: "Tal Rasha's",
          },
          { id: 'a-skullder', name: "Skullder's Ire", skills: 1, fcr: 0, allRes: 0, mf: 110 },
        ],
      },
      {
        slot: 'Amulet',
        items: [
          { id: 'am-craft', name: 'Storm Torc', skills: 2, fcr: 20, allRes: 18, mf: 12 },
          {
            id: 'am-tals',
            name: "Tal's Amulet",
            skills: 2,
            fcr: 0,
            allRes: 12,
            mf: 0,
            setBit: TAL_RASHA_BIT,
            setName: "Tal Rasha's",
          },
        ],
      },
      {
        slot: 'Gloves',
        items: [
          { id: 'g-magefist', name: 'Magefist', skills: 1, fcr: 20, allRes: 0, mf: 0 },
          { id: 'g-chancies', name: 'Chance Guards', skills: 0, fcr: 0, allRes: 0, mf: 40 },
        ],
      },
    ],
  },
  {
    id: 'tals-set',
    label: 'Set-Bonus Bitmask',
    summary:
      'Toggle "Bitmask Set-Bonus Bounds" off and on. When a branch skips Tal Rasha pieces, the bitmask drops the unreachable +65% MF / +10% FCR bonus immediately.',
    setRules: [
      {
        bit: TAL_RASHA_BIT,
        name: "Tal Rasha's (2pc)",
        bonusSkills: 1,
        bonusFcr: 10,
        bonusAllRes: 15,
        bonusMf: 65,
      },
    ],
    defaultConstraints: {
      minFcr: 65,
      minAllRes: 55,
      topK: 1,
      objective: 'mf',
    },
    slots: [
      {
        slot: 'Weapon',
        items: [
          { id: 'tw-occy', name: 'The Oculus', skills: 3, fcr: 30, allRes: 20, mf: 50 },
          { id: 'tw-hoto', name: 'Heart of the Oak', skills: 3, fcr: 40, allRes: 35, mf: 0 },
        ],
      },
      {
        slot: 'Armor',
        items: [
          {
            id: 'ta-tals',
            name: "Tal's Armor",
            skills: 0,
            fcr: 0,
            allRes: 25,
            mf: 88,
            setBit: TAL_RASHA_BIT,
            setName: "Tal Rasha's",
          },
          { id: 'ta-viper', name: 'Vipermagi', skills: 1, fcr: 30, allRes: 35, mf: 24 },
          { id: 'ta-coh', name: 'Chains of Honor', skills: 2, fcr: 0, allRes: 65, mf: 25 },
        ],
      },
      {
        slot: 'Amulet',
        items: [
          {
            id: 'tam-tals',
            name: "Tal's Amulet",
            skills: 2,
            fcr: 0,
            allRes: 12,
            mf: 0,
            setBit: TAL_RASHA_BIT,
            setName: "Tal Rasha's",
          },
          { id: 'tam-craft', name: 'Storm Torc', skills: 2, fcr: 20, allRes: 18, mf: 12 },
        ],
      },
      {
        slot: 'Gloves',
        items: [
          { id: 'tg-magefist', name: 'Magefist', skills: 1, fcr: 20, allRes: 0, mf: 0 },
          { id: 'tg-chancies', name: 'Chance Guards', skills: 0, fcr: 0, allRes: 0, mf: 40 },
        ],
      },
    ],
  },
  {
    id: 'mf-farmer',
    label: 'Magic Find Farmer',
    summary:
      'Maximize Magic Find while maintaining at least 63% FCR and 50% All Res. High-MF branches establish a strong Top-1 cutoff early.',
    setRules: [
      {
        bit: TAL_RASHA_BIT,
        name: "Tal Rasha's (2pc)",
        bonusSkills: 1,
        bonusFcr: 10,
        bonusAllRes: 15,
        bonusMf: 65,
      },
    ],
    defaultConstraints: {
      minFcr: 63,
      minAllRes: 50,
      topK: 2,
      objective: 'mf',
    },
    slots: [
      {
        slot: 'Weapon',
        items: [
          { id: 'mw-occy', name: 'The Oculus', skills: 3, fcr: 30, allRes: 20, mf: 50 },
          { id: 'mw-spirit', name: 'Spirit Sword', skills: 2, fcr: 35, allRes: 0, mf: 0 },
          { id: 'mw-alibaba', name: 'Ali Baba', skills: 0, fcr: 0, allRes: 0, mf: 95 },
        ],
      },
      {
        slot: 'Armor',
        items: [
          {
            id: 'ma-tals',
            name: "Tal's Armor",
            skills: 0,
            fcr: 0,
            allRes: 25,
            mf: 88,
            setBit: TAL_RASHA_BIT,
            setName: "Tal Rasha's",
          },
          { id: 'ma-viper', name: 'Vipermagi', skills: 1, fcr: 30, allRes: 35, mf: 24 },
        ],
      },
      {
        slot: 'Amulet',
        items: [
          {
            id: 'mam-tals',
            name: "Tal's Amulet",
            skills: 2,
            fcr: 0,
            allRes: 12,
            mf: 0,
            setBit: TAL_RASHA_BIT,
            setName: "Tal Rasha's",
          },
          { id: 'mam-craft', name: 'Storm Torc', skills: 2, fcr: 20, allRes: 18, mf: 12 },
          { id: 'mam-luck', name: 'Amulet of Luck', skills: 0, fcr: 0, allRes: 0, mf: 35 },
        ],
      },
      {
        slot: 'Gloves',
        items: [
          { id: 'mg-chancies', name: 'Chance Guards', skills: 0, fcr: 0, allRes: 0, mf: 40 },
          { id: 'mg-magefist', name: 'Magefist', skills: 1, fcr: 20, allRes: 0, mf: 0 },
        ],
      },
    ],
  },
];
