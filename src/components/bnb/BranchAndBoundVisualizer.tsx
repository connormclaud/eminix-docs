import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Scissors,
  Trophy,
  RotateCcw,
  GitBranch,
} from 'lucide-react';
import { BNB_PRESETS, type BnBPresetId } from '@/data/branchAndBoundPresets';
import {
  solveBranchAndBound,
  type NodeStatus,
  type PruningFlags,
  type TreeNodeEvent,
} from '@/utils/branchAndBound';

type PositionedNode = {
  event: TreeNodeEvent;
  x: number;
  y: number;
};

function layoutTree(events: TreeNodeEvent[], maxDepth: number): {
  nodes: PositionedNode[];
  width: number;
  height: number;
} {
  const childrenMap = new Map<number, TreeNodeEvent[]>();
  for (const ev of events) {
    if (ev.parentId !== null) {
      const list = childrenMap.get(ev.parentId) ?? [];
      list.push(ev);
      childrenMap.set(ev.parentId, list);
    }
  }

  const eventMap = new Map<number, TreeNodeEvent>();
  for (const ev of events) {
    eventMap.set(ev.nodeId, ev);
  }

  // Assign leaf x-slots via DFS post-order so subtrees never overlap
  const xUnitMap = new Map<number, number>();
  let nextLeafSlot = 0;

  function assignX(nodeId: number): number {
    const kids = childrenMap.get(nodeId) ?? [];
    if (kids.length === 0) {
      const x = nextLeafSlot++;
      xUnitMap.set(nodeId, x);
      return x;
    }
    const childXs = kids.map((k) => assignX(k.nodeId));
    const mid = (childXs[0] + childXs[childXs.length - 1]) / 2;
    xUnitMap.set(nodeId, mid);
    return mid;
  }

  if (events.length > 0) {
    assignX(events[0].nodeId);
  }

  const leafCount = Math.max(1, nextLeafSlot);
  const padX = 82;
  const padRight = 24;
  const padY = 34;
  const rowGap = 72;
  const colSpacing = Math.max(24, Math.min(54, 580 / Math.max(1, leafCount - 1 || 1)));
  const width = Math.max(640, padX + padRight + (leafCount - 1) * colSpacing + 28);
  const height = padY * 2 + maxDepth * rowGap + 12;

  const usableW = width - padX - padRight;
  const nodes: PositionedNode[] = events.map((ev) => {
    const u = xUnitMap.get(ev.nodeId) ?? 0;
    const x =
      leafCount === 1
        ? padX + usableW / 2
        : padX + (u / (leafCount - 1)) * usableW;
    const y = padY + ev.depth * rowGap;
    return { event: ev, x, y };
  });

  return { nodes, width, height };
}

function statusDisplay(status: NodeStatus): {
  label: string;
  tone: string;
  fill: string;
  stroke: string;
} {
  switch (status) {
    case 'leaf-accepted':
      return {
        label: 'Accepted Top-K Leaf',
        tone: 'text-cursor',
        fill: '#00d4aa',
        stroke: '#00d4aa',
      };
    case 'pruned-feasibility':
      return {
        label: 'Pruned (Feasibility)',
        tone: 'text-gap',
        fill: '#1e1e2e',
        stroke: '#ff6b9d',
      };
    case 'pruned-score':
      return {
        label: 'Pruned (Score Cutoff)',
        tone: 'text-set-gold',
        fill: '#1e1e2e',
        stroke: '#f59e0b',
      };
    case 'expanded':
      return {
        label: 'Expanded Branch',
        tone: 'text-cyan-400',
        fill: '#2a2a3c',
        stroke: '#67e8f9',
      };
    case 'leaf-infeasible':
      return {
        label: 'Infeasible Leaf',
        tone: 'text-gap',
        fill: '#1e1e2e',
        stroke: '#ff6b9d',
      };
    case 'leaf-dominated':
      return {
        label: 'Below Cutoff Leaf',
        tone: 'text-text-secondary',
        fill: '#1e1e2e',
        stroke: '#6c7385',
      };
  }
}

export default function BranchAndBoundVisualizer() {
  const [presetId, setPresetId] = useState<BnBPresetId>('sorc-fcr');
  const activePreset =
    BNB_PRESETS.find((p) => p.id === presetId) ?? BNB_PRESETS[0];

  const [minFcr, setMinFcr] = useState(activePreset.defaultConstraints.minFcr);
  const [minAllRes, setMinAllRes] = useState(activePreset.defaultConstraints.minAllRes);
  const [topK, setTopK] = useState(activePreset.defaultConstraints.topK);
  const [flags, setFlags] = useState<PruningFlags>({
    useSuffixFeasibility: true,
    useSetBitmaskBounds: true,
    useScoreCutoff: true,
  });
  const [selectedNodeId, setSelectedNodeId] = useState<number>(0);

  const handleSelectPreset = (id: BnBPresetId) => {
    const preset = BNB_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPresetId(id);
    setMinFcr(preset.defaultConstraints.minFcr);
    setMinAllRes(preset.defaultConstraints.minAllRes);
    setTopK(preset.defaultConstraints.topK);
    setFlags({
      useSuffixFeasibility: true,
      useSetBitmaskBounds: true,
      useScoreCutoff: true,
    });
    setSelectedNodeId(0);
  };

  const constraints = useMemo(
    () => ({
      minFcr,
      minAllRes,
      topK,
      objective: activePreset.defaultConstraints.objective,
    }),
    [minFcr, minAllRes, topK, activePreset.defaultConstraints.objective]
  );

  const result = useMemo(
    () =>
      solveBranchAndBound(
        activePreset.slots,
        activePreset.setRules,
        constraints,
        flags
      ),
    [activePreset, constraints, flags]
  );

  const bruteBaseline = useMemo(
    () =>
      solveBranchAndBound(activePreset.slots, activePreset.setRules, constraints, {
        useSuffixFeasibility: false,
        useSetBitmaskBounds: false,
        useScoreCutoff: false,
      }),
    [activePreset, constraints]
  );

  const { nodes, width, height } = useMemo(
    () => layoutTree(result.events, activePreset.slots.length),
    [result.events, activePreset.slots.length]
  );

  const posById = useMemo(() => {
    const map = new Map<number, PositionedNode>();
    for (const n of nodes) map.set(n.event.nodeId, n);
    return map;
  }, [nodes]);

  const effectiveSelectedId = posById.has(selectedNodeId) ? selectedNodeId : 0;
  const selectedNode = posById.get(effectiveSelectedId)?.event ?? result.events[0];

  // Collect ancestor path of selected node for clear highlighting
  const selectedPathIds = useMemo(() => {
    const set = new Set<number>();
    let cur: TreeNodeEvent | undefined = selectedNode;
    while (cur) {
      set.add(cur.nodeId);
      cur = cur.parentId !== null ? posById.get(cur.parentId)?.event : undefined;
    }
    return set;
  }, [selectedNode, posById]);

  const selectedChain = useMemo(() => {
    const chain: TreeNodeEvent[] = [];
    let cur: TreeNodeEvent | undefined = selectedNode;
    while (cur) {
      chain.push(cur);
      cur = cur.parentId !== null ? posById.get(cur.parentId)?.event : undefined;
    }
    return chain.reverse();
  }, [selectedNode, posById]);

  const savedNodes = Math.max(0, bruteBaseline.visitedNodes - result.visitedNodes);
  const savedPct =
    bruteBaseline.visitedNodes > 0
      ? Math.round((savedNodes / bruteBaseline.visitedNodes) * 100)
      : 0;

  const objLabel = constraints.objective === 'skills' ? '+Skills' : 'MF';

  return (
    <div className="space-y-6">
      {/* Preset Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-editor-mid border border-white/8 rounded-xl"
          role="tablist"
          aria-label="Search scenarios"
        >
          {BNB_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor ${
                presetId === preset.id
                  ? 'bg-cursor/15 text-cursor border border-cursor/30'
                  : 'text-text-secondary hover:text-text-primary border border-transparent'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleSelectPreset(presetId)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-editor-mid hover:bg-editor-light border border-white/8 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor"
        >
          <RotateCcw size={14} />
          Reset Preset
        </button>
      </div>

      {/* Two-Zone Sandbox (8-col Tree + Leaderboard / 4-col Control Deck) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Stage */}
        <div className="lg:col-span-8 space-y-6">
          {/* Interactive SVG Search Tree */}
          <div className="bg-editor-mid rounded-2xl p-5 border border-white/8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  Live DFS Search Tree
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Click any node to inspect its accumulated stats, suffix bound, set bitmask, and prune reason.
                </p>
              </div>
              <div className="text-xs font-mono text-text-secondary tabular-nums">
                Visited <span className="text-cursor font-bold">{result.visitedNodes}</span> /{' '}
                {bruteBaseline.visitedNodes} nodes ({savedPct}% cut)
              </div>
            </div>

            <div className="bg-editor-dark rounded-xl border border-white/8 p-2 overflow-x-auto">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto min-w-[560px]"
                role="img"
                aria-label="Interactive Branch-and-Bound DFS search tree"
              >
                {/* Depth guide labels */}
                {['Root', ...activePreset.slots.map((s) => s.slot)].map((label, depth) => {
                  const y = 34 + depth * 72;
                  return (
                    <g key={label}>
                      <line
                        x1={70}
                        y1={y}
                        x2={width - 14}
                        y2={y}
                        stroke="rgba(255,255,255,0.04)"
                        strokeWidth="1"
                      />
                      <text
                        x={12}
                        y={y + 4}
                        fill="#a6adc8"
                        fontSize="11"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* Edges */}
                {nodes.map((node) => {
                  if (node.event.parentId === null) return null;
                  const parent = posById.get(node.event.parentId);
                  if (!parent) return null;
                  const onSelectedPath =
                    selectedPathIds.has(node.event.nodeId) &&
                    selectedPathIds.has(parent.event.nodeId);
                  const isPruned =
                    node.event.status === 'pruned-feasibility' ||
                    node.event.status === 'pruned-score';
                  return (
                    <line
                      key={`edge-${node.event.nodeId}`}
                      x1={parent.x}
                      y1={parent.y}
                      x2={node.x}
                      y2={node.y}
                      stroke={
                        onSelectedPath
                          ? '#00d4aa'
                          : isPruned
                            ? 'rgba(255, 107, 157, 0.4)'
                            : 'rgba(205, 214, 244, 0.22)'
                      }
                      strokeWidth={onSelectedPath ? 2.4 : 1.3}
                      strokeDasharray={isPruned ? '4 3' : undefined}
                    />
                  );
                })}

                {/* Nodes */}
                {nodes.map((node) => {
                  const { event, x, y } = node;
                  const style = statusDisplay(event.status);
                  const isSelected = event.nodeId === effectiveSelectedId;
                  const isPrunedFeas = event.status === 'pruned-feasibility';
                  const isPrunedScore = event.status === 'pruned-score';

                  return (
                    <g
                      key={`node-${event.nodeId}`}
                      transform={`translate(${x}, ${y})`}
                      onClick={() => setSelectedNodeId(event.nodeId)}
                      className="cursor-pointer"
                    >
                      {isSelected && (
                        <circle
                          r="15"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="1.6"
                          opacity="0.55"
                        />
                      )}

                      {isPrunedFeas ? (
                        <>
                          <rect
                            x="-7.5"
                            y="-7.5"
                            width="15"
                            height="15"
                            transform="rotate(45)"
                            fill={style.fill}
                            stroke={style.stroke}
                            strokeWidth="2"
                          />
                          <path d="M-3,-3 L3,3 M3,-3 L-3,3" stroke="#ff6b9d" strokeWidth="1.5" />
                        </>
                      ) : isPrunedScore ? (
                        <>
                          <rect
                            x="-7.5"
                            y="-7.5"
                            width="15"
                            height="15"
                            rx="2"
                            fill={style.fill}
                            stroke={style.stroke}
                            strokeWidth="2"
                          />
                          <path d="M-3,-3 L3,3 M3,-3 L-3,3" stroke="#f59e0b" strokeWidth="1.5" />
                        </>
                      ) : (
                        <circle
                          r={isSelected ? '9' : '7.5'}
                          fill={style.fill}
                          stroke={isSelected ? '#ffffff' : style.stroke}
                          strokeWidth="2"
                        />
                      )}

                      {event.depth <= 2 && event.pickedItem && (
                        <text
                          y="-13"
                          textAnchor="middle"
                          fill={isSelected ? '#ffffff' : '#cdd6f4'}
                          fontSize="9.5"
                          fontWeight={isSelected ? '700' : '500'}
                        >
                          {event.pickedItem.name.length > 12
                            ? `${event.pickedItem.name.slice(0, 11)}…`
                            : event.pickedItem.name}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Dual-Coded Legend */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-xs text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-cursor" />
                Accepted Top-K Leaf
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Scissors size={13} className="text-gap" />
                Feasibility Cut (Diamond)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Trophy size={13} className="text-set-gold" />
                Score Cutoff (Square)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GitBranch size={13} className="text-cyan-400" />
                Expanded Node
              </span>
            </div>
          </div>

          {/* Top-K Results Leaderboard */}
          <div className="bg-editor-mid rounded-2xl border border-white/8 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/8 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-text-primary">
                Top-{topK} Valid Loadouts (Objective: {objLabel})
              </h3>
              <span className="text-xs font-mono text-text-secondary tabular-nums">
                Leaves evaluated: {result.leafEvaluations} / {result.totalCombinations}
              </span>
            </div>

            {result.topBuilds.length === 0 ? (
              <div className="p-6 text-center text-sm text-text-secondary">
                No loadout meets Min FCR {minFcr}% and Min All Res {minAllRes}%. Lower a constraint slider to find valid builds.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8 text-xs text-text-secondary bg-editor-dark/60">
                      <th className="text-left px-4 py-2.5 font-medium">Rank</th>
                      <th className="text-left px-4 py-2.5 font-medium">Equipped Loadout</th>
                      <th className="text-right px-3 py-2.5 font-medium">+Sk</th>
                      <th className="text-right px-3 py-2.5 font-medium">FCR</th>
                      <th className="text-right px-3 py-2.5 font-medium">Res</th>
                      <th className="text-right px-4 py-2.5 font-medium">MF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {result.topBuilds.map((build, idx) => (
                      <tr key={idx} className={idx === 0 ? 'bg-cursor/[0.05]' : ''}>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-cursor tabular-nums">
                          #{idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-text-primary leading-relaxed">
                            {build.items.map((x) => x.item.name).join(' · ')}
                          </div>
                          {build.activeSets.length > 0 && (
                            <div className="text-[11px] text-set-gold mt-0.5 font-mono">
                              Active set: {build.activeSets.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-text-primary">
                          +{build.totals.skills}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-text-primary">
                          {build.totals.fcr}%
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-text-primary">
                          {build.totals.allRes}%
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-text-primary">
                          {build.totals.mf}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Control Deck */}
        <div className="lg:col-span-4 space-y-5">
          {/* Pruning Toggles & Constraints */}
          <div className="bg-editor-mid rounded-2xl p-5 border border-white/8 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Search Controls &amp; Bounds
              </h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                {activePreset.summary}
              </p>
            </div>

            {/* Live Efficiency Counters */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono tabular-nums">
              <div className="bg-editor-dark rounded-xl p-2.5 border border-white/8">
                <div className="text-base font-bold text-cursor">{result.visitedNodes}</div>
                <div className="text-[10px] text-text-secondary">Visited</div>
              </div>
              <div className="bg-editor-dark rounded-xl p-2.5 border border-white/8">
                <div className="text-base font-bold text-gap">{result.prunedFeasibility}</div>
                <div className="text-[10px] text-text-secondary">Feas. Cuts</div>
              </div>
              <div className="bg-editor-dark rounded-xl p-2.5 border border-white/8">
                <div className="text-base font-bold text-set-gold">{result.prunedScore}</div>
                <div className="text-[10px] text-text-secondary">Score Cuts</div>
              </div>
            </div>

            {/* Constraint Sliders */}
            <div className="space-y-3.5 pt-2 border-t border-white/8">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label htmlFor="bnb-fcr" className="text-text-primary font-medium">
                    Min FCR Breakpoint
                  </label>
                  <span className="font-mono font-bold text-cursor tabular-nums">{minFcr}%</span>
                </div>
                <input
                  id="bnb-fcr"
                  type="range"
                  min={0}
                  max={105}
                  step={5}
                  value={minFcr}
                  onChange={(e) => setMinFcr(Number(e.target.value))}
                  className="w-full accent-[#00d4aa] cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label htmlFor="bnb-res" className="text-text-primary font-medium">
                    Min All Resistances
                  </label>
                  <span className="font-mono font-bold text-cursor tabular-nums">
                    {minAllRes}%
                  </span>
                </div>
                <input
                  id="bnb-res"
                  type="range"
                  min={0}
                  max={80}
                  step={5}
                  value={minAllRes}
                  onChange={(e) => setMinAllRes(Number(e.target.value))}
                  className="w-full accent-[#00d4aa] cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label htmlFor="bnb-topk" className="text-text-primary font-medium">
                    Top-K Leaderboard Size
                  </label>
                  <span className="font-mono font-bold text-cursor tabular-nums">K = {topK}</span>
                </div>
                <input
                  id="bnb-topk"
                  type="range"
                  min={1}
                  max={3}
                  step={1}
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-full accent-[#00d4aa] cursor-pointer"
                />
              </div>
            </div>

            {/* Optimization Toggles */}
            <div className="space-y-3 pt-3 border-t border-white/8">
              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-text-primary">
                    Suffix Feasibility Bounds
                  </div>
                  <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    Prune when current + suf[i] cannot reach Min FCR or All Res.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={flags.useSuffixFeasibility}
                  onChange={(e) =>
                    setFlags((f) => ({ ...f, useSuffixFeasibility: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 accent-[#ff6b9d] cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-text-primary">
                    Bitmask Set-Bonus Bounds
                  </div>
                  <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    Only add 2-piece set bonuses still reachable in remaining slots.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={flags.useSetBitmaskBounds}
                  onChange={(e) =>
                    setFlags((f) => ({ ...f, useSetBitmaskBounds: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 accent-[#f59e0b] cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-text-primary">
                    Top-K Score Cutoff
                  </div>
                  <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    Prune subtrees whose best possible {objLabel} ≤ Kth-best score.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={flags.useScoreCutoff}
                  onChange={(e) =>
                    setFlags((f) => ({ ...f, useScoreCutoff: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 accent-[#00d4aa] cursor-pointer shrink-0"
                />
              </label>
            </div>
          </div>

          {/* Selected Node Bound Inspector */}
          {selectedNode && (
            <div className="bg-editor-mid rounded-2xl p-5 border border-white/8 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-mono text-text-secondary">
                    Node #{selectedNode.nodeId} · Depth {selectedNode.depth} ({selectedNode.slotName})
                  </div>
                  <h4 className="text-sm font-semibold text-text-primary mt-0.5">
                    {selectedNode.pickedItem ? selectedNode.pickedItem.name : 'Search Root'}
                  </h4>
                </div>
                <span
                  className={`text-xs font-semibold whitespace-nowrap ${
                    statusDisplay(selectedNode.status).tone
                  }`}
                >
                  {statusDisplay(selectedNode.status).label}
                </span>
              </div>

              {selectedChain.length > 1 && (
                <div className="text-[11px] text-text-secondary font-mono leading-relaxed">
                  Path:{' '}
                  {selectedChain
                    .slice(1)
                    .map((n) => n.pickedItem?.name)
                    .join(' → ')}
                </div>
              )}

              <div className="bg-editor-dark rounded-xl p-3.5 border border-white/8 space-y-2 text-xs font-mono tabular-nums">
                <div className="grid grid-cols-4 text-[10px] text-text-secondary pb-1 border-b border-white/8">
                  <span>Stat</span>
                  <span className="text-right">Cur</span>
                  <span className="text-right">+UB</span>
                  <span className="text-right">Max</span>
                </div>
                {(
                  [
                    ['FCR', selectedNode.acc.fcr, selectedNode.suffixMax.fcr + selectedNode.setBonusUb.fcr, selectedNode.upperBound.fcr],
                    ['All Res', selectedNode.acc.allRes, selectedNode.suffixMax.allRes + selectedNode.setBonusUb.allRes, selectedNode.upperBound.allRes],
                    ['+Skills', selectedNode.acc.skills, selectedNode.suffixMax.skills + selectedNode.setBonusUb.skills, selectedNode.upperBound.skills],
                    ['MF', selectedNode.acc.mf, selectedNode.suffixMax.mf + selectedNode.setBonusUb.mf, selectedNode.upperBound.mf],
                  ] as const
                ).map(([label, cur, rem, max]) => (
                  <div key={label} className="grid grid-cols-4">
                    <span className="text-text-secondary">{label}</span>
                    <span className="text-right text-text-primary">{cur}</span>
                    <span className="text-right text-text-secondary">+{rem}</span>
                    <span className="text-right font-bold text-cursor">{max}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-white/8 flex justify-between text-[11px]">
                  <span className="text-text-secondary">Reachable Set Mask</span>
                  <span className="text-set-gold">
                    0b{selectedNode.possibleSetMask.toString(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed">
                {selectedNode.status === 'pruned-feasibility' ||
                selectedNode.status === 'pruned-score' ? (
                  <XCircle size={14} className="text-gap shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 size={14} className="text-cursor shrink-0 mt-0.5" />
                )}
                <span>{selectedNode.reason}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
