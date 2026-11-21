import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Shield,
  Plus,
  RotateCcw,
  Trash2,
  Layers,
} from 'lucide-react';
import {
  PARETO_PRESETS,
  STAT_META,
  type ParetoPresetId,
} from '@/data/paretoPresets';
import {
  pruneCandidates,
  type GearCandidate,
  type PruneDecision,
  type PruneReason,
  type StatKey,
} from '@/utils/paretoPruning';

const STAT_KEYS: StatKey[] = ['skills', 'fcr', 'allRes', 'mf'];

function statusLabel(reason: PruneReason): {
  text: string;
  tone: string;
  icon: React.ReactNode;
} {
  switch (reason) {
    case 'pareto-optimal':
      return {
        text: 'Pareto Optimal',
        tone: 'text-cursor',
        icon: <CheckCircle2 size={14} className="text-cursor shrink-0" />,
      };
    case 'top-k-diversity':
      return {
        text: 'Top-K Backup',
        tone: 'text-cyan-400',
        icon: <Layers size={14} className="text-cyan-400 shrink-0" />,
      };
    case 'set-protected':
      return {
        text: 'Set Protected',
        tone: 'text-set-gold',
        icon: <Shield size={14} className="text-set-gold shrink-0" />,
      };
    case 'pruned-same-name':
      return {
        text: 'Pruned (Duplicate)',
        tone: 'text-gap',
        icon: <XCircle size={14} className="text-gap shrink-0" />,
      };
    case 'pruned-distinct':
      return {
        text: 'Pruned (Dominated)',
        tone: 'text-gap',
        icon: <XCircle size={14} className="text-gap shrink-0" />,
      };
  }
}

export default function ParetoVisualizer() {
  const [presetId, setPresetId] = useState<ParetoPresetId>('sorc-amulets');
  const activePreset =
    PARETO_PRESETS.find((p) => p.id === presetId) ?? PARETO_PRESETS[0];

  const [items, setItems] = useState<GearCandidate[]>(() => [...activePreset.items]);
  const [xAxis, setXAxis] = useState<StatKey>(activePreset.defaultAxes[0]);
  const [yAxis, setYAxis] = useState<StatKey>(activePreset.defaultAxes[1]);
  const [limit, setLimit] = useState<number>(activePreset.defaultLimit);
  const [protectSetGroups, setProtectSetGroups] = useState<boolean>(true);
  const [countDistinctNames, setCountDistinctNames] = useState<boolean>(true);
  const [selectedId, setSelectedId] = useState<string | null>(
    activePreset.items[0]?.id ?? null
  );

  // Custom item builder state
  const [newName, setNewName] = useState('Arcane Pendant');
  const [newSkills, setNewSkills] = useState(2);
  const [newFcr, setNewFcr] = useState(15);
  const [newRes, setNewRes] = useState(20);
  const [newMf, setNewMf] = useState(15);
  const [newSetGroup, setNewSetGroup] = useState(false);

  const handleSelectPreset = (id: ParetoPresetId) => {
    const preset = PARETO_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPresetId(id);
    setItems([...preset.items]);
    setXAxis(preset.defaultAxes[0]);
    setYAxis(preset.defaultAxes[1]);
    setLimit(preset.defaultLimit);
    setProtectSetGroups(true);
    setCountDistinctNames(true);
    setSelectedId(preset.items[0]?.id ?? null);
  };

  const handleReset = () => {
    handleSelectPreset(presetId);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    const created: GearCandidate = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      slot: activePreset.slot,
      skills: Math.max(0, Math.min(6, newSkills)),
      fcr: Math.max(0, Math.min(50, newFcr)),
      allRes: Math.max(0, Math.min(50, newRes)),
      mf: Math.max(0, Math.min(150, newMf)),
      reqStr: 0,
      setGroup: newSetGroup ? "Tal Rasha's Wrappings" : undefined,
    };
    setItems((prev) => [...prev, created]);
    setSelectedId(created.id);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const summary = useMemo(
    () =>
      pruneCandidates(items, {
        limit,
        sameNameCap: 1,
        protectSetGroups,
        countDistinctNames,
      }),
    [items, limit, protectSetGroups, countDistinctNames]
  );

  const decisionById = useMemo(() => {
    const map = new Map<string, PruneDecision>();
    for (const d of summary.decisions) {
      map.set(d.item.id, d);
    }
    return map;
  }, [summary]);

  const selectedDecision = selectedId ? decisionById.get(selectedId) ?? null : null;

  // Items dominated BY the selected item
  const dominatedBySelected = useMemo(() => {
    if (!selectedId) return [];
    return summary.decisions
      .filter((d) => d.dominators.some((dom) => dom.id === selectedId))
      .map((d) => d.item);
  }, [summary, selectedId]);

  // SVG plot geometry
  const plotW = 620;
  const plotH = 320;
  const padL = 54;
  const padR = 28;
  const padT = 24;
  const padB = 46;
  const innerW = plotW - padL - padR;
  const innerH = plotH - padT - padB;

  const maxX = Math.max(10, ...items.map((i) => i[xAxis])) * 1.12;
  const maxY = Math.max(10, ...items.map((i) => i[yAxis])) * 1.12;

  const toSvgX = (val: number) => padL + (val / maxX) * innerW;
  const toSvgY = (val: number) => padT + innerH - (val / maxY) * innerH;

  // Compute 2D staircase frontier line across kept items on active (xAxis, yAxis)
  const frontierPolyline = useMemo(() => {
    const kept = summary.kept;
    if (kept.length === 0) return '';
    // Keep only 2D non-dominated points on the currently projected axes for a crisp visual skyline
    const sorted = [...kept].sort((a, b) => b[xAxis] - a[xAxis] || b[yAxis] - a[yAxis]);
    const skyline: GearCandidate[] = [];
    let bestY = -Infinity;
    for (const pt of sorted) {
      if (pt[yAxis] > bestY) {
        skyline.push(pt);
        bestY = pt[yAxis];
      }
    }
    skyline.sort((a, b) => a[xAxis] - b[xAxis]);
    return skyline.map((pt) => `${toSvgX(pt[xAxis]).toFixed(1)},${toSvgY(pt[yAxis]).toFixed(1)}`).join(' ');
  }, [summary.kept, xAxis, yAxis, maxX, maxY]);

  const reductionPct =
    items.length > 0 ? Math.round((summary.pruned.length / items.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Preset Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-editor-mid border border-white/8 rounded-xl"
          role="tablist"
          aria-label="Scenario presets"
        >
          {PARETO_PRESETS.map((preset) => (
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
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-editor-mid hover:bg-editor-light border border-white/8 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor"
        >
          <RotateCcw size={14} />
          Reset Preset
        </button>
      </div>

      {/* Two-Zone Sandbox Layout (8-col Interactive Stage + 4-col Control Deck) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Zone: Interactive Plot + Candidate Roster */}
        <div className="lg:col-span-8 space-y-6">
          {/* 2D Pareto Frontier Plot */}
          <div className="bg-editor-mid rounded-2xl p-5 border border-white/8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  2D Pareto Frontier Projection
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Click any point to inspect incoming dominators and outgoing dominated items.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1.5 text-text-secondary">
                  <span>X:</span>
                  <select
                    value={xAxis}
                    onChange={(e) => setXAxis(e.target.value as StatKey)}
                    className="bg-editor-dark text-text-primary border border-white/10 rounded-lg px-2.5 py-1.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor"
                  >
                    {STAT_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {STAT_META[k].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1.5 text-text-secondary">
                  <span>Y:</span>
                  <select
                    value={yAxis}
                    onChange={(e) => setYAxis(e.target.value as StatKey)}
                    className="bg-editor-dark text-text-primary border border-white/10 rounded-lg px-2.5 py-1.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor"
                  >
                    {STAT_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {STAT_META[k].label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center bg-editor-dark rounded-xl border border-white/8 text-center p-6">
                <p className="text-sm text-text-secondary mb-3">
                  No candidate items in this slot pool.
                </p>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold bg-cursor/15 text-cursor border border-cursor/30 rounded-lg hover:bg-cursor/25 transition-colors"
                >
                  Restore {activePreset.label}
                </button>
              </div>
            ) : (
              <div className="bg-editor-dark rounded-xl border border-white/8 p-2 overflow-x-auto">
                <svg
                  viewBox={`0 0 ${plotW} ${plotH}`}
                  className="w-full h-auto min-w-[440px]"
                  role="img"
                  aria-label={`Pareto scatter plot comparing ${STAT_META[xAxis].label} and ${STAT_META[yAxis].label}`}
                >
                  <defs>
                    <marker
                      id="arrow-dominator"
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                    >
                      <path d="M0,1 L7,4 L0,7 Z" fill="#ff6b9d" />
                    </marker>
                    <marker
                      id="arrow-dominated"
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                    >
                      <path d="M0,1 L7,4 L0,7 Z" fill="#00d4aa" />
                    </marker>
                  </defs>

                  {/* Gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                    const gx = padL + t * innerW;
                    const gy = padT + innerH - t * innerH;
                    const xVal = Math.round(t * maxX);
                    const yVal = Math.round(t * maxY);
                    return (
                      <g key={t}>
                        <line
                          x1={gx}
                          y1={padT}
                          x2={gx}
                          y2={padT + innerH}
                          stroke="rgba(255,255,255,0.06)"
                          strokeWidth="1"
                        />
                        <line
                          x1={padL}
                          y1={gy}
                          x2={padL + innerW}
                          y2={gy}
                          stroke="rgba(255,255,255,0.06)"
                          strokeWidth="1"
                        />
                        <text
                          x={gx}
                          y={padT + innerH + 18}
                          textAnchor="middle"
                          fill="#a6adc8"
                          fontSize="11"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {xVal}
                        </text>
                        <text
                          x={padL - 10}
                          y={gy + 4}
                          textAnchor="end"
                          fill="#a6adc8"
                          fontSize="11"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {yVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* Axes */}
                  <line
                    x1={padL}
                    y1={padT + innerH}
                    x2={padL + innerW}
                    y2={padT + innerH}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1.2"
                  />
                  <line
                    x1={padL}
                    y1={padT}
                    x2={padL}
                    y2={padT + innerH}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1.2"
                  />
                  <text
                    x={padL + innerW / 2}
                    y={plotH - 6}
                    textAnchor="middle"
                    fill="#cdd6f4"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {STAT_META[xAxis].label} {STAT_META[xAxis].unit && `(${STAT_META[xAxis].unit})`} →
                  </text>
                  <text
                    x={16}
                    y={padT + innerH / 2}
                    textAnchor="middle"
                    fill="#cdd6f4"
                    fontSize="12"
                    fontWeight="600"
                    transform={`rotate(-90 16 ${padT + innerH / 2})`}
                  >
                    {STAT_META[yAxis].label} {STAT_META[yAxis].unit && `(${STAT_META[yAxis].unit})`} →
                  </text>

                  {/* 2D Frontier Guide Line */}
                  {frontierPolyline && (
                    <polyline
                      points={frontierPolyline}
                      fill="none"
                      stroke="#00d4aa"
                      strokeWidth="1.75"
                      strokeDasharray="5 4"
                      opacity="0.55"
                    />
                  )}

                  {/* Dominance Arrows for Selected Item */}
                  {selectedDecision &&
                    selectedDecision.dominators.map((dom) => {
                      const x1 = toSvgX(dom[xAxis]);
                      const y1 = toSvgY(dom[yAxis]);
                      const x2 = toSvgX(selectedDecision.item[xAxis]);
                      const y2 = toSvgY(selectedDecision.item[yAxis]);
                      if (Math.hypot(x2 - x1, y2 - y1) < 2) return null;
                      return (
                        <line
                          key={`in-${dom.id}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#ff6b9d"
                          strokeWidth="1.8"
                          strokeDasharray="4 3"
                          markerEnd="url(#arrow-dominator)"
                          opacity="0.85"
                        />
                      );
                    })}

                  {selectedDecision &&
                    dominatedBySelected.map((sub) => {
                      const x1 = toSvgX(selectedDecision.item[xAxis]);
                      const y1 = toSvgY(selectedDecision.item[yAxis]);
                      const x2 = toSvgX(sub[xAxis]);
                      const y2 = toSvgY(sub[yAxis]);
                      if (Math.hypot(x2 - x1, y2 - y1) < 2) return null;
                      return (
                        <line
                          key={`out-${sub.id}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#00d4aa"
                          strokeWidth="1.8"
                          markerEnd="url(#arrow-dominated)"
                          opacity="0.85"
                        />
                      );
                    })}

                  {/* Item Points */}
                  {summary.decisions.map((decision, idx) => {
                    const { item, kept, reason } = decision;
                    const cx = toSvgX(item[xAxis]);
                    const cy = toSvgY(item[yAxis]);
                    const isSelected = item.id === selectedId;
                    const isSetProtected = reason === 'set-protected';
                    const isTopK = reason === 'top-k-diversity';

                    const fill = !kept
                      ? '#1e1e2e'
                      : isSetProtected
                        ? '#f59e0b'
                        : isTopK
                          ? '#22d3ee'
                          : '#00d4aa';
                    const stroke = !kept
                      ? '#ff6b9d'
                      : isSelected
                        ? '#ffffff'
                        : fill;

                    // Small offset for overlapping coordinates on the active 2D projection
                    const sameCoordIndex = summary.decisions
                      .slice(0, idx)
                      .filter(
                        (d) =>
                          d.item[xAxis] === item[xAxis] &&
                          d.item[yAxis] === item[yAxis]
                      ).length;
                    const jitterX = sameCoordIndex * 9;
                    const jitterY = -sameCoordIndex * 9;

                    return (
                      <g
                        key={item.id}
                        transform={`translate(${cx + jitterX}, ${cy + jitterY})`}
                        onClick={() => setSelectedId(item.id)}
                        className="cursor-pointer"
                      >
                        {isSelected && (
                          <circle
                            r="13"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            opacity="0.45"
                          />
                        )}
                        {isSetProtected ? (
                          <rect
                            x="-7"
                            y="-7"
                            width="14"
                            height="14"
                            transform="rotate(45)"
                            fill={fill}
                            stroke={stroke}
                            strokeWidth="2"
                          />
                        ) : (
                          <circle
                            r={isSelected ? '8' : '6.5'}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth="2"
                          />
                        )}
                        {!kept && (
                          <path
                            d="M-3,-3 L3,3 M3,-3 L-3,3"
                            stroke="#ff6b9d"
                            strokeWidth="1.5"
                          />
                        )}
                        <text
                          x="10"
                          y="-8"
                          fill={isSelected ? '#ffffff' : '#cdd6f4'}
                          fontSize="10.5"
                          fontWeight={isSelected ? '700' : '500'}
                          opacity={kept || isSelected ? 1 : 0.65}
                        >
                          {item.name.length > 20 ? `${item.name.slice(0, 19)}…` : item.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-xs text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-cursor" />
                Pareto Optimal
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers size={13} className="text-cyan-400" />
                Top-K Backup
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield size={13} className="text-set-gold" />
                Set Protected (Diamond)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <XCircle size={13} className="text-gap" />
                Pruned (Crossed)
              </span>
              <span className="text-text-secondary/70 ml-auto">
                Note: Dominance checks all 4 stats + Str Req, not just the 2 projected axes.
              </span>
            </div>
          </div>

          {/* Candidate Roster Table */}
          <div className="bg-editor-mid rounded-2xl border border-white/8 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/8 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-text-primary">
                Candidate Pool ({items.length})
              </h3>
              <div className="text-xs text-text-secondary font-mono tabular-nums">
                Kept {summary.kept.length} · Pruned {summary.pruned.length} · Reduction {reductionPct}%
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-xs text-text-secondary bg-editor-dark/60">
                    <th className="text-left px-4 py-2.5 font-medium">Item</th>
                    <th className="text-right px-3 py-2.5 font-medium">+Sk</th>
                    <th className="text-right px-3 py-2.5 font-medium">FCR</th>
                    <th className="text-right px-3 py-2.5 font-medium">Res</th>
                    <th className="text-right px-3 py-2.5 font-medium">MF</th>
                    <th className="text-right px-3 py-2.5 font-medium">Str</th>
                    <th className="text-left px-4 py-2.5 font-medium">Decision</th>
                    <th className="px-2 py-2.5" aria-label="Remove item"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {summary.decisions.map((decision) => {
                    const { item, kept, reason } = decision;
                    const badge = statusLabel(reason);
                    const isSelected = item.id === selectedId;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cursor/10'
                            : 'hover:bg-white/[0.025]'
                        } ${!kept ? 'opacity-70' : ''}`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-text-primary leading-tight">
                            {item.name}
                          </div>
                          {item.setGroup && (
                            <div className="text-[11px] text-set-gold mt-0.5">
                              Set: {item.setGroup}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-text-primary">
                          +{item.skills}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-text-primary">
                          {item.fcr}%
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-text-primary">
                          {item.allRes}%
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-text-primary">
                          {item.mf}%
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-text-secondary">
                          {item.reqStr}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${badge.tone}`}>
                            {badge.icon}
                            {badge.text}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveItem(item.id);
                            }}
                            title={`Remove ${item.name}`}
                            aria-label={`Remove ${item.name}`}
                            className="p-1.5 text-text-secondary/60 hover:text-gap rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Zone: Control & Inspection Deck */}
        <div className="lg:col-span-4 space-y-5">
          {/* Pruning Rules Deck */}
          <div className="bg-editor-mid rounded-2xl p-5 border border-white/8 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Pruning Controls</h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                {activePreset.summary}
              </p>
            </div>

            {/* Top-K Limit Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="topk-slider" className="font-medium text-text-primary">
                  Top-K Limit (domThreshold)
                </label>
                <span className="font-mono font-bold text-cursor tabular-nums">
                  K = {limit} {limit === 1 ? 'build' : 'builds'}
                </span>
              </div>
              <input
                id="topk-slider"
                type="range"
                min={1}
                max={4}
                step={1}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full accent-[#00d4aa] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-text-secondary/70 tabular-nums">
                <span>1 (strict)</span>
                <span>2</span>
                <span>3</span>
                <span>4 (broad)</span>
              </div>
            </div>

            {/* Algorithm Switches */}
            <div className="space-y-3 pt-2 border-t border-white/8">
              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-text-primary">
                    Set-Signature Protection
                  </div>
                  <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    Only compare dominance inside the same set group.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={protectSetGroups}
                  onChange={(e) => setProtectSetGroups(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#f59e0b] cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-text-primary">
                    Distinct-Name Counting
                  </div>
                  <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    Count unique dominator names instead of duplicate copies.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={countDistinctNames}
                  onChange={(e) => setCountDistinctNames(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#00d4aa] cursor-pointer shrink-0"
                />
              </label>
            </div>
          </div>

          {/* Selected Item Proof Inspector */}
          {selectedDecision && (
            <div className="bg-editor-mid rounded-2xl p-5 border border-white/8 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-medium text-text-secondary">
                    Dominance Proof
                  </div>
                  <h4 className="text-base font-semibold text-text-primary mt-0.5">
                    {selectedDecision.item.name}
                  </h4>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap ${
                    statusLabel(selectedDecision.reason).tone
                  }`}
                >
                  {statusLabel(selectedDecision.reason).icon}
                  {statusLabel(selectedDecision.reason).text}
                </span>
              </div>

              <div className="bg-editor-dark rounded-xl p-3.5 border border-white/8 space-y-2 text-xs">
                <div className="flex justify-between text-text-secondary">
                  <span>In-group dominators</span>
                  <span className="font-mono text-text-primary tabular-nums">
                    {selectedDecision.dominators.length} item(s) ·{' '}
                    {selectedDecision.distinctDominatorNames.length} distinct name(s)
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Same-name better rolls</span>
                  <span className="font-mono text-text-primary tabular-nums">
                    {selectedDecision.sameNameDominators} (cap: 1)
                  </span>
                </div>
                {selectedDecision.blockedBySetProtection.length > 0 && (
                  <div className="flex justify-between text-set-gold">
                    <span>Blocked by set guard</span>
                    <span className="font-mono tabular-nums">
                      {selectedDecision.blockedBySetProtection.length} item(s)
                    </span>
                  </div>
                )}
              </div>

              {selectedDecision.dominators.length > 0 ? (
                <div className="text-xs text-text-secondary leading-relaxed">
                  <span className="text-gap font-semibold">Dominated by: </span>
                  {selectedDecision.dominators.map((d) => d.name).join(', ')}.
                </div>
              ) : selectedDecision.blockedBySetProtection.length > 0 ? (
                <div className="text-xs text-set-gold leading-relaxed">
                  Standalone stats lose to{' '}
                  {selectedDecision.blockedBySetProtection.map((d) => d.name).join(', ')},
                  but set-signature isolation keeps this piece eligible for multi-piece bonuses.
                </div>
              ) : (
                <div className="text-xs text-cursor leading-relaxed">
                  Undominated across all 4 stats and Strength requirement — sits directly on the Pareto frontier.
                </div>
              )}

              {dominatedBySelected.length > 0 && (
                <div className="text-xs text-text-secondary leading-relaxed pt-2 border-t border-white/8">
                  <span className="text-cursor font-semibold">Dominates: </span>
                  {dominatedBySelected.map((d) => d.name).join(', ')}.
                </div>
              )}
            </div>
          )}

          {/* Add Custom Item Form */}
          <form
            onSubmit={handleAddItem}
            className="bg-editor-mid rounded-2xl p-5 border border-white/8 space-y-3"
          >
            <h4 className="text-sm font-semibold text-text-primary">Add Custom Candidate</h4>
            <div>
              <label htmlFor="custom-item-name" className="block text-[11px] text-text-secondary mb-1">
                Item Name
              </label>
              <input
                id="custom-item-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={32}
                className="w-full bg-editor-dark border border-white/10 rounded-lg px-3 py-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <label className="text-[11px] text-text-secondary">
                +Skills
                <input
                  type="number"
                  min={0}
                  max={6}
                  value={newSkills}
                  onChange={(e) => setNewSkills(Number(e.target.value))}
                  className="mt-1 w-full bg-editor-dark border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums text-text-primary"
                />
              </label>
              <label className="text-[11px] text-text-secondary">
                FCR (%)
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={5}
                  value={newFcr}
                  onChange={(e) => setNewFcr(Number(e.target.value))}
                  className="mt-1 w-full bg-editor-dark border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums text-text-primary"
                />
              </label>
              <label className="text-[11px] text-text-secondary">
                All Res (%)
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={newRes}
                  onChange={(e) => setNewRes(Number(e.target.value))}
                  className="mt-1 w-full bg-editor-dark border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums text-text-primary"
                />
              </label>
              <label className="text-[11px] text-text-secondary">
                Magic Find (%)
                <input
                  type="number"
                  min={0}
                  max={150}
                  value={newMf}
                  onChange={(e) => setNewMf(Number(e.target.value))}
                  className="mt-1 w-full bg-editor-dark border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums text-text-primary"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={newSetGroup}
                onChange={(e) => setNewSetGroup(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#f59e0b]"
              />
              <span>Part of Tal Rasha&apos;s Wrappings set</span>
            </label>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-cursor text-editor-dark rounded-lg hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Plus size={14} />
              Add to Slot Pool
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
