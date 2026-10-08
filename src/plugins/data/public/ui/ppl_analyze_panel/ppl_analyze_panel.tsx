/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiToolTip,
  EuiCallOut,
  EuiIcon,
  EuiButtonEmpty,
} from '@elastic/eui';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  PPLAnalyzeResult,
  PPLAnalyzePlanNode,
  PPLAnalyzeRecommendation,
} from '../../query/ppl_analyze_state';

// Theme-reactive colors that resolve to light/dark values automatically.
const { euiColorEmptyShade, euiColorLightShade, euiColorMediumShade } = euiThemeVars;

interface PPLAnalyzePanelProps {
  analyzeResult: PPLAnalyzeResult;
  onClose?: () => void;
}

const PHASE_COLORS: Record<string, string> = {
  analyze: '#54B399',
  optimize: '#6092C0',
  execute: '#D36086',
  format: '#D6BF57',
};

// Display name for the synthetic trailing stage that accounts for execute-phase time
// spent outside the operators (e.g. composing the result set).
const OVERHEAD_NODE = i18n.translate('data.pplAnalyze.overheadStageName', {
  defaultMessage: 'Result composition',
});
const OVERHEAD_BAR_COLOR = '#98A2B3';

const PHASE_DESCRIPTIONS: Record<string, string> = {
  analyze: i18n.translate('data.pplAnalyze.phaseDescription.analyze', {
    defaultMessage: 'Parsing and validating the query syntax and semantics.',
  }),
  optimize: i18n.translate('data.pplAnalyze.phaseDescription.optimize', {
    defaultMessage: 'Determining the most efficient execution plan and push-down strategy.',
  }),
  execute: i18n.translate('data.pplAnalyze.phaseDescription.execute', {
    defaultMessage: 'Running the query against OpenSearch and processing results.',
  }),
  format: i18n.translate('data.pplAnalyze.phaseDescription.format', {
    defaultMessage: 'Formatting the final result set for output.',
  }),
};

function TimingBar({
  phases,
  totalTimeMs,
}: {
  phases: Record<string, { time_ms: number }>;
  totalTimeMs: number;
}) {
  const entries = Object.entries(phases);
  const phaseTotal = entries.reduce((sum, [, v]) => sum + v.time_ms, 0);

  return (
    <div>
      <EuiText size="s">
        <strong>
          <FormattedMessage
            id="data.pplAnalyze.timingBar.queryCompleted"
            defaultMessage="Query completed in {time}ms"
            values={{ time: totalTimeMs.toFixed(1) }}
          />
        </strong>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiFlexGroup gutterSize="s" alignItems="center" wrap responsive={false}>
        {entries.map(([name, { time_ms: timeMs }]) => {
          const pct = phaseTotal > 0 ? ((timeMs / phaseTotal) * 100).toFixed(0) : 0;
          return (
            <EuiFlexItem key={name} grow={false}>
              <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                <EuiFlexItem grow={false}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: PHASE_COLORS[name] || '#aaa',
                      display: 'inline-block',
                    }}
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs">
                    <FormattedMessage
                      id="data.pplAnalyze.timingBar.phaseLegend"
                      defaultMessage="{phase} {time}ms ({pct}%)"
                      values={{
                        phase: name.charAt(0).toUpperCase() + name.slice(1),
                        time: timeMs.toFixed(1),
                        pct,
                      }}
                    />
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          );
        })}
      </EuiFlexGroup>
      <EuiSpacer size="s" />
      <div style={{ display: 'flex', height: 20, borderRadius: 4, overflow: 'hidden' }}>
        {entries.map(([name, { time_ms: timeMs }]) => {
          const pct = phaseTotal > 0 ? (timeMs / phaseTotal) * 100 : 0;
          if (pct === 0) return null;
          const displayPct = Math.max(pct, 0.5);
          const label = name.charAt(0).toUpperCase() + name.slice(1);
          const description =
            PHASE_DESCRIPTIONS[name] ||
            i18n.translate('data.pplAnalyze.phaseDescription.fallback', {
              defaultMessage: 'No details available.',
            });
          return (
            <div key={name} style={{ width: `${displayPct}%`, height: 20 }}>
              <EuiToolTip
                position="bottom"
                content={
                  <>
                    <strong>{label}</strong>
                    <br />
                    {timeMs.toFixed(1)}ms ({pct.toFixed(0)}%)
                    <br />
                    <br />
                    {description}
                  </>
                }
                anchorClassName="eui-displayBlock"
              >
                <div
                  style={{
                    width: '100%',
                    height: 20,
                    backgroundColor: PHASE_COLORS[name] || '#aaa',
                    position: 'relative',
                    cursor: 'default',
                  }}
                >
                  {pct > 8 && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: 11,
                        color: '#000',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {timeMs.toFixed(1)}ms
                    </span>
                  )}
                </div>
              </EuiToolTip>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const LABEL_COL_WIDTH = 200;
const STATS_COL_WIDTH = 210;
const TICK_COUNT = 6;

// The in-bar label style is `font: 600 11px`; measure text against that. The bar has
// 6px of left padding, so a label needs (textWidth + 6 + a small right margin) px of
// bar to sit inside without clipping.
const BAR_LABEL_FONT = '600 11px sans-serif';
const BAR_LABEL_PADDING_PX = 6;
const BAR_LABEL_RIGHT_MARGIN_PX = 4;

function formatMs(ms: number): string {
  return `${ms.toFixed(1)} ms`;
}

// Measure rendered text width with a shared canvas — no DOM node, no reflow. Falls
// back to a rough per-character estimate when canvas is unavailable (e.g. in jsdom).
let measureCtx: CanvasRenderingContext2D | null = null;
// Track whether we've already tried to create the context: getContext('2d') can
// return null, so a `measureCtx === null` guard alone would re-allocate a canvas on
// every call. This latches the attempt so we only create one canvas, ever.
let measureCtxAttempted = false;
function measureTextWidth(text: string, font: string): number {
  if (!measureCtxAttempted && typeof document !== 'undefined') {
    measureCtxAttempted = true;
    measureCtx = document.createElement('canvas').getContext('2d');
  }
  if (measureCtx) {
    measureCtx.font = font;
    return measureCtx.measureText(text).width;
  }
  // ~6px/char is a reasonable estimate for 11px sans-serif when we can't measure.
  return text.length * 6;
}

// Calcite decorates physical operator names with their calling convention
// (e.g. "CalciteEnumerableIndexScan", "EnumerableMergeJoin"). Strip those tokens
// for display so only the operator itself shows; the full name stays available
// in the tooltip and expanded detail. Falls back to the original if stripping
// leaves nothing.
const CONVENTION_TOKENS = ['Calcite', 'Logical', 'OpenSearch', 'Enumerable', 'Bindable'];
function displayNodeName(node: string): string {
  let name = node;
  for (const token of CONVENTION_TOKENS) {
    name = name.split(token).join('');
  }
  return name.trim() || node;
}

// A physical-plan node flattened for tabular display. `selfTimeMs` is the node's
// own time excluding children (the bar width); `startMs` is where its bar begins on
// the timeline — the max of its children's inclusive times, since a node can only
// begin once its slowest child has finished (0 for leaves). `concurrentWith` holds
// the full names of the node's siblings (nodes sharing a parent), which run
// concurrently with it.
interface FlatPlanNode {
  node: string;
  depth: number;
  inclusiveTimeMs: number;
  selfTimeMs: number;
  startMs: number;
  rows?: number;
  rowsIn?: number;
  childNames: string[];
  concurrentWith: string[];
  // Marks the synthetic trailing row that accounts for execute-phase time not
  // attributed to any operator (e.g. composing the result set). Rendered grey.
  isOverhead?: boolean;
}

// Flatten the nested physical plan into a post-order list (children before their
// parent). Physical plans execute bottom-up — leaf scans run first, the root last
// — so post-order puts rows in execution order top-to-bottom. Each node's reported
// time_ms is inclusive of its children, so its bar starts at max(child time_ms) —
// when its slowest child finished — and its width (self-time) is time_ms minus that
// start (clamped at 0 to absorb rounding). Sibling bars overlap in real time; that
// is expected and rendered as-is. rowsIn is the sum of direct children's rows.
function flattenPlan(root: PPLAnalyzePlanNode): FlatPlanNode[] {
  const out: FlatPlanNode[] = [];
  // `siblingNames` is the full (undecorated) names of every node sharing this node's
  // parent (excluding itself) — those operators overlap in time with this one.
  const walk = (node: PPLAnalyzePlanNode, depth: number, siblingNames: string[]) => {
    const children = node.children || [];
    const childNames = children.map((c) => c.node);
    children.forEach((c, i) =>
      walk(
        c,
        depth + 1,
        childNames.filter((_, j) => j !== i)
      )
    );
    const startMs = children.reduce((max, c) => Math.max(max, c.time_ms || 0), 0);
    const inclusiveTimeMs = node.time_ms || 0;
    const childRows = children.reduce((sum, c) => sum + (c.rows || 0), 0);
    out.push({
      node: node.node,
      depth,
      inclusiveTimeMs,
      selfTimeMs: Math.max(inclusiveTimeMs - startMs, 0),
      startMs,
      rows: node.rows,
      rowsIn: children.length > 0 ? childRows : undefined,
      childNames: children.map((c) => c.node),
      concurrentWith: siblingNames,
    });
  };
  walk(root, 0, []);
  return out;
}

// Waterfall reconstruction from the physical plan tree (profile.plan). Stages are
// physical-plan operators; timing/rows come straight from the profile. There is no
// PPL-op mapping, push-down location, estimated rows, or cost share — only what the
// profile reports, which keeps this correct for any plan shape.
function PhysicalPlanSection({
  plan,
  executePhaseMs,
}: {
  plan: PPLAnalyzePlanNode;
  executePhaseMs: number;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  // Pixel width of the bar column, measured at runtime so we can decide whether each
  // label actually fits inside its bar rather than guessing from a fixed percentage.
  const barTrackRef = useRef<HTMLDivElement | null>(null);
  const [barTrackWidth, setBarTrackWidth] = useState(0);

  useEffect(() => {
    const el = barTrackRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      setBarTrackWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Flatten the plan, then append a synthetic "overhead" row for execute-phase time
  // not attributed to any operator (result-set composition, etc.). It spans from the
  // end of operator work (the root's inclusive time) to the end of the execute phase.
  // Memoized per plan/phase, not per hover/expand re-render.
  const nodes = React.useMemo(() => {
    const flat = flattenPlan(plan);
    const operatorEndMs = flat.reduce((max, n) => Math.max(max, n.startMs + n.selfTimeMs), 0);
    const overheadMs = executePhaseMs - operatorEndMs;
    // Only surface it when it's a meaningful slice (avoids a sliver from rounding).
    if (overheadMs > 0.05) {
      flat.push({
        node: OVERHEAD_NODE,
        depth: 0,
        inclusiveTimeMs: overheadMs,
        selfTimeMs: overheadMs,
        startMs: operatorEndMs,
        rows: undefined,
        rowsIn: undefined,
        childNames: [],
        concurrentWith: [],
        isOverhead: true,
      });
    }
    return flat;
  }, [plan, executePhaseMs]);

  // The whole waterfall — axis ticks, bar start offsets, bar widths, and the label
  // percentage — is scaled to the execute phase, so every number shares one
  // denominator. Each bar starts at its slowest child's inclusive time (0 for
  // leaves), so sibling bars may overlap and bars stop short of the right edge
  // where operator time doesn't fill the whole execute phase.
  const scaleMs = executePhaseMs;
  const tickInterval = scaleMs > 0 ? scaleMs / (TICK_COUNT - 1) : 1;
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => i * tickInterval);

  const barColor = PHASE_COLORS.execute;

  return (
    <div>
      <EuiTitle size="s">
        <h3>
          <FormattedMessage
            id="data.pplAnalyze.executionProfiling.title"
            defaultMessage="Execution Phase Profiling"
          />
        </h3>
      </EuiTitle>
      <EuiSpacer size="xs" />
      <EuiText size="xs" color="subdued">
        <FormattedMessage
          id="data.pplAnalyze.executionProfiling.description"
          defaultMessage="Each stage is a physical-plan operator produced by the query optimizer, which may not correspond directly to the commands in your PPL query. A stage's bar is positioned on the execution timeline and sized by the time attributed to that operator; operators whose bars overlap ran concurrently. Select a stage to view more information."
        />
      </EuiText>
      <EuiSpacer size="m" />
      <div
        style={{
          border: `1px solid ${euiColorLightShade}`,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {/* Column header row */}
        <div style={{ display: 'flex', backgroundColor: euiColorEmptyShade }}>
          <div
            style={{
              width: LABEL_COL_WIDTH,
              flexShrink: 0,
              borderRight: `1px solid ${euiColorLightShade}`,
              padding: '6px 12px',
            }}
          >
            <span style={{ fontSize: 10, color: euiColorMediumShade }}>
              {i18n.translate('data.pplAnalyze.column.stage', { defaultMessage: 'STAGE' })}
            </span>
          </div>
          <div
            style={{
              width: STATS_COL_WIDTH,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              paddingTop: 6,
              paddingBottom: 6,
            }}
          >
            {[
              i18n.translate('data.pplAnalyze.column.time', { defaultMessage: 'TIME' }),
              i18n.translate('data.pplAnalyze.column.rowsIn', { defaultMessage: 'ROWS IN' }),
              i18n.translate('data.pplAnalyze.column.rowsOut', { defaultMessage: 'ROWS OUT' }),
            ].map((h) => (
              <span
                key={h}
                style={{
                  width: `${STATS_COL_WIDTH / 3}px`,
                  flexShrink: 0,
                  fontSize: 10,
                  color: euiColorMediumShade,
                  textAlign: 'center',
                }}
              >
                {h}
              </span>
            ))}
          </div>
          <div
            ref={barTrackRef}
            style={{
              flex: 1,
              position: 'relative',
              height: 28,
              borderLeft: `1px solid ${euiColorLightShade}`,
            }}
          >
            {scaleMs > 0 &&
              ticks.map((t, i) =>
                i === 0 || i === ticks.length - 1 ? null : (
                  <span
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${(t / scaleMs) * 100}%`,
                      transform: 'translateX(-50%)',
                      fontSize: 10,
                      color: euiColorMediumShade,
                      top: 8,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.toFixed(0)} ms
                  </span>
                )
              )}
          </div>
        </div>
        {/* Node rows */}
        {nodes.map((n, idx) => {
          const isExpanded = expandedIdx === idx;
          const isHovered = hoveredIdx === idx;
          // Everything is scaled to the execute phase: start offset, width, and the
          // label percentage all share one denominator, so a bar's width matches the
          // percentage it prints.
          const startPct = scaleMs > 0 ? (n.startMs / scaleMs) * 100 : 0;
          const widthPct = scaleMs > 0 ? (n.selfTimeMs / scaleMs) * 100 : 0;
          // The synthetic overhead row is greyed to distinguish it from real operators.
          const rowBarColor = n.isOverhead ? OVERHEAD_BAR_COLOR : barColor;
          const rowBg = isHovered || isExpanded ? `${rowBarColor}28` : 'transparent';

          // Concurrent operators (those with siblings) overlap in time, so their
          // widths don't add up to a meaningful share of the timeline — omit the
          // percentage for them and show only the duration.
          const isConcurrent = n.concurrentWith.length > 0;
          const label = isConcurrent
            ? formatMs(n.selfTimeMs)
            : `${formatMs(n.selfTimeMs)} (${widthPct.toFixed(0)}%)`;
          // Decide inside vs. outside by measuring the label against the bar's actual
          // pixel width instead of a fixed percentage. Until the track width is known
          // (first paint / no ResizeObserver) keep every label outside so nothing clips.
          const barPx = (Math.max(widthPct, 0.5) / 100) * barTrackWidth;
          const labelPx = measureTextWidth(label, BAR_LABEL_FONT);
          const labelFitsInside =
            barTrackWidth > 0 &&
            barPx >= labelPx + BAR_LABEL_PADDING_PX + BAR_LABEL_RIGHT_MARGIN_PX;

          return (
            <React.Fragment key={idx}>
              <div
                role="button"
                tabIndex={0}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setExpandedIdx(isExpanded ? null : idx);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderTop: `1px solid ${euiColorLightShade}`,
                  backgroundColor: rowBg,
                  cursor: 'pointer',
                  transition: 'background-color 0.1s',
                }}
              >
                {/* Label column */}
                <div
                  style={{
                    width: LABEL_COL_WIDTH,
                    flexShrink: 0,
                    padding: '8px 8px 8px 12px',
                    borderRight: `1px solid ${euiColorLightShade}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    overflow: 'hidden',
                  }}
                >
                  <span style={{ flexShrink: 0 }}>
                    <EuiIcon
                      type={isExpanded ? 'arrowDown' : 'arrowRight'}
                      size="s"
                      color="subdued"
                    />
                  </span>
                  <EuiText
                    size="s"
                    style={{
                      minWidth: 0,
                      flex: 1,
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={n.node}
                  >
                    <strong>{displayNodeName(n.node)}</strong>
                  </EuiText>
                </div>
                {/* Stats column */}
                <div
                  style={{
                    width: STATS_COL_WIDTH,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {[
                    formatMs(n.selfTimeMs),
                    n.rowsIn?.toLocaleString() ?? '—',
                    n.rows?.toLocaleString() ?? '—',
                  ].map((val, i) => (
                    <EuiText
                      key={i}
                      size="xs"
                      style={{
                        width: `${STATS_COL_WIDTH / 3}px`,
                        textAlign: 'center',
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                      }}
                    >
                      {val}
                    </EuiText>
                  ))}
                </div>
                {/* Bar column — self-time waterfall */}
                <div
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    position: 'relative',
                    height: 46,
                    borderLeft: `1px solid ${euiColorLightShade}`,
                  }}
                >
                  {scaleMs > 0 &&
                    ticks.slice(1, -1).map((t, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: `${(t / scaleMs) * 100}%`,
                          top: 0,
                          bottom: 0,
                          width: 1,
                          backgroundColor: euiColorLightShade,
                        }}
                      />
                    ))}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${startPct}%`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: `${Math.max(widthPct, 0.5)}%`,
                      height: 20,
                      backgroundColor: rowBarColor,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 6,
                      boxSizing: 'border-box',
                      minWidth: 4,
                    }}
                  >
                    {labelFitsInside && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#000',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {label}
                      </span>
                    )}
                  </div>
                  {!labelFitsInside && startPct + widthPct < 85 && (
                    <span
                      style={{
                        position: 'absolute',
                        left: `${startPct + Math.max(widthPct, 0.5)}%`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        paddingLeft: 4,
                        fontSize: 11,
                        // Fixed dark color: sits just outside the bar and stays the
                        // most legible option across light/dark themes.
                        color: '#000',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </span>
                  )}
                </div>
              </div>
              {/* Expanded detail */}
              {isExpanded && n.isOverhead && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderTop: `1px solid ${euiColorLightShade}`,
                    backgroundColor: euiColorEmptyShade,
                  }}
                >
                  <EuiText size="xs" color="subdued">
                    <FormattedMessage
                      id="data.pplAnalyze.detail.overheadTime"
                      defaultMessage="OVERHEAD TIME"
                    />
                  </EuiText>
                  <EuiText size="s">
                    <strong>{formatMs(n.selfTimeMs)}</strong>
                  </EuiText>
                  <EuiSpacer size="s" />
                  <EuiText size="xs" color="subdued">
                    <FormattedMessage
                      id="data.pplAnalyze.detail.overheadExplanation"
                      defaultMessage="The execute phase ({execute}) is longer than the time spent in the plan's operators. This stage accounts for the difference — work done during execution but outside any operator, such as composing the individual operator outputs into the final result set. It is expected and generally small."
                      values={{ execute: formatMs(executePhaseMs) }}
                    />
                  </EuiText>
                </div>
              )}
              {isExpanded && !n.isOverhead && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderTop: `1px solid ${euiColorLightShade}`,
                    backgroundColor: euiColorEmptyShade,
                  }}
                >
                  <EuiFlexGroup gutterSize="l" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiText size="xs" color="subdued">
                        <FormattedMessage
                          id="data.pplAnalyze.detail.operator"
                          defaultMessage="OPERATOR"
                        />
                      </EuiText>
                      <EuiText size="s">
                        <strong>{n.node}</strong>
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="xs" color="subdued">
                        <FormattedMessage id="data.pplAnalyze.column.time" defaultMessage="TIME" />
                      </EuiText>
                      <EuiText size="s">
                        <strong>{formatMs(n.selfTimeMs)}</strong>
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="xs" color="subdued">
                        <FormattedMessage
                          id="data.pplAnalyze.column.rowsIn"
                          defaultMessage="ROWS IN"
                        />
                      </EuiText>
                      <EuiText size="s">
                        <strong>{n.rowsIn?.toLocaleString() ?? '—'}</strong>
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="xs" color="subdued">
                        <FormattedMessage
                          id="data.pplAnalyze.column.rowsOut"
                          defaultMessage="ROWS OUT"
                        />
                      </EuiText>
                      <EuiText size="s">
                        <strong>{n.rows?.toLocaleString() ?? '—'}</strong>
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="xs" color="subdued">
                        <FormattedMessage
                          id="data.pplAnalyze.detail.sourceNodes"
                          defaultMessage="SOURCE NODES"
                        />
                      </EuiText>
                      <EuiText size="s">
                        <strong>
                          {n.childNames.length > 0
                            ? n.childNames.map(displayNodeName).join(', ')
                            : i18n.translate('data.pplAnalyze.detail.noSourceNodes', {
                                defaultMessage: 'None',
                              })}
                        </strong>
                      </EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  {n.concurrentWith.length > 0 && (
                    <>
                      <EuiSpacer size="s" />
                      <EuiText size="xs" color="subdued">
                        <FormattedMessage
                          id="data.pplAnalyze.detail.concurrent"
                          defaultMessage="Ran concurrently with {count, plural, one {# other operation} other {# other operations}} ({operations})"
                          values={{
                            count: n.concurrentWith.length,
                            operations: n.concurrentWith.join(', '),
                          }}
                        />
                      </EuiText>
                    </>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
        {/* Summary row */}
        <div
          style={{
            display: 'flex',
            borderTop: `1px solid ${euiColorLightShade}`,
            padding: '8px 12px',
            gap: 24,
          }}
        >
          <EuiText size="xs">
            <FormattedMessage
              id="data.pplAnalyze.summary.totalExecutionPhase"
              defaultMessage="Total Execution Phase: {time}"
              values={{ time: <strong>{formatMs(executePhaseMs)}</strong> }}
            />
          </EuiText>
          <EuiText size="xs">
            <FormattedMessage
              id="data.pplAnalyze.summary.operators"
              defaultMessage="Operators: {count}"
              values={{ count: <strong>{nodes.filter((n) => !n.isOverhead).length}</strong> }}
            />
          </EuiText>
          {plan.rows !== undefined && (
            <EuiText size="xs">
              <FormattedMessage
                id="data.pplAnalyze.summary.result"
                defaultMessage="Result: {rows}"
                values={{
                  rows: (
                    <strong>
                      <FormattedMessage
                        id="data.pplAnalyze.summary.resultRows"
                        defaultMessage="{count} rows"
                        values={{ count: plan.rows?.toLocaleString() }}
                      />
                    </strong>
                  ),
                }}
              />
            </EuiText>
          )}
        </div>
      </div>
    </div>
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#FF6666',
  WARNING: '#FFCE7A',
  INFO: '#7DE2D1',
};

function parseRecommendationMessage(message: unknown): React.ReactNode {
  // The backend has shipped recommendations as both objects and bare strings, so
  // `message` isn't guaranteed to be a string. Coerce non-strings rather than
  // calling String.prototype.split on something that lacks it (which would throw).
  if (typeof message !== 'string') return message == null ? null : String(message);
  const parts = message.split(/\*([^*]+)\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

// A recommendation may arrive as a structured object or as a bare string (the
// backend's `recommendations` contract has been both). Coerce to the object shape
// the UI expects so every downstream field read is safe. Anything that isn't a
// usable object or string is dropped.
function normalizeRecommendation(rec: unknown): PPLAnalyzeRecommendation | null {
  if (typeof rec === 'string') return { message: rec };
  if (rec && typeof rec === 'object') return rec as PPLAnalyzeRecommendation;
  return null;
}

// Fraction of the execute phase below which a node isn't worth surfacing a
// recommendation for — small contributors are noise, not opportunities.
const MIN_NODE_EXECUTE_SHARE = 0.05;
// Cap on the number of recommendations shown; the highest-severity ones win.
const MAX_RECOMMENDATIONS = 3;
const SEVERITY_RANK: Record<string, number> = { CRITICAL: 0, WARNING: 1, INFO: 2 };

// Filter and order the recommendations worth showing:
//  1. drop any whose `affected_node` maps to a plan node using less than
//     MIN_NODE_EXECUTE_SHARE of the execute phase (small operators aren't the
//     right thing to tell customers to optimize),
//  2. order by severity so the most important ones come first.
// Recs with no `affected_node` (phase-level advice) or an unmatched name pass
// through the share filter — we can't judge their weight, so we don't drop them.
// The display cap (MAX_RECOMMENDATIONS) is applied in the component so the full
// list stays available behind a "show all" affordance.
function filterRecommendations(
  recs: Array<PPLAnalyzeRecommendation | string> | undefined,
  nodes: FlatPlanNode[],
  executePhaseMs: number
): PPLAnalyzeRecommendation[] {
  if (!recs || recs.length === 0) return [];
  // Coerce mixed string/object input to a uniform object shape up front, dropping
  // anything unusable, so the rest of the pipeline reads fields safely.
  const normalized = recs
    .map(normalizeRecommendation)
    .filter((rec): rec is PPLAnalyzeRecommendation => rec !== null);
  const selfTimeByNode = new Map<string, number>();
  nodes.forEach((n) => {
    // Multiple plan nodes can share a raw name (e.g. two IndexScans on a join);
    // sum their self-times so the filter reflects the operator's total weight.
    selfTimeByNode.set(n.node, (selfTimeByNode.get(n.node) || 0) + n.selfTimeMs);
  });
  const minSelfMs = executePhaseMs * MIN_NODE_EXECUTE_SHARE;
  const kept = normalized.filter((rec) => {
    if (!rec.affected_node) return true;
    const selfMs = selfTimeByNode.get(rec.affected_node);
    if (selfMs === undefined) return true;
    return selfMs >= minSelfMs;
  });
  return [...kept].sort((a, b) => {
    const sa = SEVERITY_RANK[(a.severity || 'INFO').toUpperCase()] ?? 2;
    const sb = SEVERITY_RANK[(b.severity || 'INFO').toUpperCase()] ?? 2;
    return sa - sb;
  });
}

function RecommendationsSection({
  recommendations,
}: {
  recommendations: PPLAnalyzeRecommendation[];
}) {
  const [showAll, setShowAll] = useState(false);
  // Cap the list by default; the rest stay reachable via the "show all" toggle so
  // nothing is silently hidden.
  const isCapped = recommendations.length > MAX_RECOMMENDATIONS;
  const visible = showAll ? recommendations : recommendations.slice(0, MAX_RECOMMENDATIONS);
  return (
    <div>
      <EuiTitle size="xxs">
        <h4>
          <FormattedMessage
            id="data.pplAnalyze.recommendations.title"
            defaultMessage="RECOMMENDATIONS"
          />
        </h4>
      </EuiTitle>
      <EuiSpacer size="s" />
      {!recommendations || recommendations.length === 0 ? (
        <EuiText size="s" color="subdued">
          <FormattedMessage
            id="data.pplAnalyze.recommendations.empty"
            defaultMessage="No recommendations for this query."
          />
        </EuiText>
      ) : (
        visible.map((rec: PPLAnalyzeRecommendation, idx: number) => {
          const severity = (rec.severity || 'INFO').toUpperCase();
          const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.INFO;
          return (
            <React.Fragment key={idx}>
              <EuiPanel
                paddingSize="s"
                hasShadow={false}
                hasBorder={true}
                style={{ borderLeft: `4px solid ${color}` }}
              >
                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiText size="xs" style={{ color, fontWeight: 700 }}>
                      {severity}
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size="s">
                      <strong>{rec.rule}</strong>
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size="xs" />
                <EuiText size="s">{parseRecommendationMessage(rec.message)}</EuiText>
                {rec.affected_node && (
                  <>
                    <EuiSpacer size="xs" />
                    <EuiText size="xs" color="subdued">
                      <FormattedMessage
                        id="data.pplAnalyze.recommendations.affects"
                        defaultMessage="Affects: {node}"
                        values={{ node: rec.affected_node }}
                      />
                    </EuiText>
                  </>
                )}
                {rec.suggestion && (
                  <>
                    <EuiSpacer size="xs" />
                    <EuiText size="xs">
                      <em>{rec.suggestion}</em>
                    </EuiText>
                  </>
                )}
              </EuiPanel>
              {idx < visible.length - 1 && <EuiSpacer size="s" />}
            </React.Fragment>
          );
        })
      )}
      {isCapped && !showAll && (
        <>
          <EuiSpacer size="xs" />
          <EuiButtonEmpty
            size="xs"
            flush="left"
            onClick={() => setShowAll(true)}
            data-test-subj="analyzeShowAllRecommendations"
          >
            <FormattedMessage
              id="data.pplAnalyze.recommendations.showAll"
              defaultMessage="Showing {shown} of {total} — Show all"
              values={{ shown: MAX_RECOMMENDATIONS, total: recommendations.length }}
            />
          </EuiButtonEmpty>
        </>
      )}
    </div>
  );
}

// An error response looks like { statusCode, error, message } where `message`
// may itself be a JSON string with { reason, details, type }.
function parseAnalyzeError(response: any): { title: string; message: string } | null {
  const isError =
    !!response &&
    ((typeof response.statusCode === 'number' && response.statusCode >= 400) ||
      (typeof response.error === 'string' && response.message !== undefined));
  if (!isError) return null;

  const title = response.error || `Error ${response.statusCode ?? ''}`.trim();

  let message = typeof response.message === 'string' ? response.message : '';
  try {
    const parsed = JSON.parse(message);
    if (parsed && typeof parsed === 'object') {
      message = [parsed.reason, parsed.details].filter(Boolean).join(': ') || message;
    }
  } catch {
    // message wasn't JSON — use it as-is
  }

  return { title, message };
}

export const PPLAnalyzePanel: React.FC<PPLAnalyzePanelProps> = ({ analyzeResult, onClose }) => {
  const { response } = analyzeResult;
  const analyzeError = parseAnalyzeError(response);
  const hasProfile = !!response.profile;
  const totalTimeMs = response.profile?.summary?.total_time_ms || 0;
  // The waterfall is reconstructed from the physical plan reported by the profiler
  // (profile.plan).
  const planTree = response.profile?.plan;
  const hasPlanTree = !!planTree;
  const executePhaseMs = response.profile?.phases?.execute?.time_ms || 0;
  // Drop recs on tiny operators and cap to the most critical few. Recomputes only
  // when the plan or execute-phase timing changes, not on hover/expand state.
  const filteredRecommendations = React.useMemo(
    () =>
      filterRecommendations(
        response.recommendations,
        planTree ? flattenPlan(planTree) : [],
        executePhaseMs
      ),
    [response.recommendations, planTree, executePhaseMs]
  );

  return (
    <EuiPanel paddingSize="m" hasShadow={false} hasBorder={false}>
      {onClose && (
        <>
          <EuiFlexGroup gutterSize="none" justifyContent="flexStart" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="xs"
                color="text"
                iconType="cross"
                onClick={onClose}
                data-test-subj="analyzeCloseButton"
              >
                <FormattedMessage
                  id="data.pplAnalyze.returnToResults"
                  defaultMessage="Return to query results"
                />
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="s" />
        </>
      )}
      {analyzeError ? (
        <EuiCallOut
          title={analyzeError.title}
          iconType="alert"
          color="danger"
          data-test-subj="analyzeErrorCallout"
        >
          <EuiText size="s">{analyzeError.message}</EuiText>
        </EuiCallOut>
      ) : !hasProfile ? (
        <EuiCallOut
          title={i18n.translate('data.pplAnalyze.profileUnavailable.title', {
            defaultMessage: 'Query Profiling Unavailable - Error',
          })}
          iconType="iInCircle"
          color="danger"
          data-test-subj="analyzeProfileUnavailable"
        >
          <EuiText size="s">
            <FormattedMessage
              id="data.pplAnalyze.profileUnavailable.body"
              defaultMessage="There was an error retrieving your query analysis from the backend. Typically, this is the result of an outdated version of the backend that does not support analyzing queries."
            />
          </EuiText>
        </EuiCallOut>
      ) : (
        <>
          {response.profile?.phases && (
            <TimingBar phases={response.profile.phases} totalTimeMs={totalTimeMs} />
          )}
          <EuiSpacer size="l" />
          <EuiFlexGroup gutterSize="l">
            <EuiFlexItem grow={3}>
              {hasPlanTree ? (
                <PhysicalPlanSection plan={planTree!} executePhaseMs={executePhaseMs} />
              ) : (
                <EuiCallOut
                  title={i18n.translate('data.pplAnalyze.executionUnavailable.title', {
                    defaultMessage: 'Execution Phase Profiling unavailable',
                  })}
                  iconType="iInCircle"
                  color="warning"
                >
                  <EuiText size="s">
                    <FormattedMessage
                      id="data.pplAnalyze.executionUnavailable.body"
                      defaultMessage="The per-stage execution breakdown is unavailable because the query profile did not include a physical plan. The phase timing bar above reflects the full query profile."
                    />
                  </EuiText>
                </EuiCallOut>
              )}
            </EuiFlexItem>
            {filteredRecommendations.length > 0 && (
              <EuiFlexItem grow={2}>
                <RecommendationsSection recommendations={filteredRecommendations} />
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </>
      )}
    </EuiPanel>
  );
};
