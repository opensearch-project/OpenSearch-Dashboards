/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { PPLAnalyzeResult } from '../../query/ppl_analyze_state';

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

const OPERATOR_COLORS = {
  pushedDown: '#7DE2D1',
  inMemory: '#FFCE7A',
  bottleneck: '#FF6666',
};

const PHASE_DESCRIPTIONS: Record<string, string> = {
  analyze: 'Parsing and validating the query syntax and semantics.',
  optimize: 'Determining the most efficient execution plan and push-down strategy.',
  execute: 'Running the query against OpenSearch and processing results.',
  format: 'Formatting the final result set for output.',
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
        <strong>Query completed in {totalTimeMs.toFixed(1)}ms</strong>
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
                    {name.charAt(0).toUpperCase() + name.slice(1)} {timeMs.toFixed(1)}ms ({pct}%)
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
          const description = PHASE_DESCRIPTIONS[name] || 'No details available.';
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

function formatMs(ms: number): string {
  return `${ms.toFixed(1)} ms`;
}

function StageBadge({ isPushedDown }: { isPushedDown: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 600,
        padding: '1px 5px',
        borderRadius: 3,
        backgroundColor: isPushedDown
          ? `${OPERATOR_COLORS.pushedDown}33`
          : `${OPERATOR_COLORS.inMemory}33`,
        color: isPushedDown ? OPERATOR_COLORS.pushedDown : OPERATOR_COLORS.inMemory,
        border: `1px solid ${isPushedDown ? OPERATOR_COLORS.pushedDown : OPERATOR_COLORS.inMemory}`,
        marginLeft: 6,
        verticalAlign: 'middle',
      }}
    >
      {isPushedDown ? 'data' : 'coord'}
    </span>
  );
}

// Split a PPL source fragment into one command string per node_type entry.
function splitSourceCommands(source: string, count: number): string[] {
  const parts = source.split('|').map((s) => s.trim());
  if (parts.length >= count) return parts.slice(0, count);
  while (parts.length < count) parts.push(parts[parts.length - 1] || source);
  return parts;
}

// Extract the command keyword — stop at space, =, (, |, or comma
function parseCommand(cmd: string): { keyword: string; args: string } {
  const match = cmd.match(/^([^=\s(|,]+)/);
  return { keyword: match?.[1] || cmd, args: cmd };
}

function OperationSubTable({
  op,
  nodeTimeMs,
  barColor,
  injectedTimeFilter,
}: {
  op: any;
  nodeTimeMs: number;
  barColor: string;
  injectedTimeFilter?: string;
}) {
  const commands = splitSourceCommands(op.source || '', (op.node_type || ['Stage']).length);
  const types: string[] = op.node_type || ['Stage'];

  const nodeColor = op.is_pushed_down ? OPERATOR_COLORS.pushedDown : OPERATOR_COLORS.inMemory;

  return (
    <div style={{ borderTop: `1px solid ${euiColorLightShade}` }}>
      {/* Sub-header */}
      <div
        style={{
          display: 'flex',
          padding: '6px 12px 6px 36px',
          borderBottom: `1px solid ${euiColorLightShade}`,
          backgroundColor: euiColorEmptyShade,
          gap: 8,
        }}
      >
        {['OPERATIONS IN THIS STAGE', 'ESTIMATED TIME', 'SHARE OF STAGE'].map((h, i) => (
          <span
            key={h}
            style={{
              fontSize: 10,
              color: euiColorMediumShade,
              flex: i === 0 ? 3 : i === 2 ? 2 : 1,
              textAlign: i === 0 ? 'left' : 'center',
            }}
          >
            {h}
          </span>
        ))}
      </div>
      {/* Operation rows */}
      {types.map((type, typeIdx) => {
        const { keyword, args } = parseCommand(commands[typeIdx]);
        const sharePct = types.length > 0 ? 100 / types.length : 100;
        const isDatePickerFilter =
          !!injectedTimeFilter && args.trim() === injectedTimeFilter.trim();
        return (
          <div
            key={typeIdx}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 12px 6px 8px',
              borderBottom: typeIdx < types.length - 1 ? `1px solid ${euiColorLightShade}` : 'none',
              backgroundColor: euiColorEmptyShade,
              gap: 8,
            }}
          >
            <div style={{ width: 20, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              {isDatePickerFilter && (
                <EuiToolTip
                  position="right"
                  content="This filter was automatically added from the date picker, not written by you."
                >
                  <EuiIcon
                    type="iInCircle"
                    size="s"
                    color="subdued"
                    style={{ cursor: 'default' }}
                  />
                </EuiToolTip>
              )}
            </div>
            <EuiText size="xs" style={{ flex: 3 }}>
              <span style={{ fontFamily: 'monospace' }}>
                <strong>{keyword}</strong>{' '}
                <span style={{ color: euiColorMediumShade }}>
                  {args.replace(keyword, '').trim()}
                </span>
              </span>
            </EuiText>
            <EuiText size="xs" style={{ flex: 1, textAlign: 'center' }}>
              {formatMs(nodeTimeMs)}
            </EuiText>
            <div style={{ flex: 2, paddingRight: 8 }}>
              <div
                style={{
                  height: 8,
                  borderRadius: 2,
                  backgroundColor: barColor,
                  width: `${sharePct}%`,
                  minWidth: 4,
                }}
              />
            </div>
          </div>
        );
      })}
      {/* Detail panel below the operation breakdown */}
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
              LOCATION
            </EuiText>
            <EuiText size="s">
              {op.is_pushed_down ? 'OpenSearch data nodes' : 'Coordinator'}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="xs" color="subdued">
              ESTIMATED ROWS
            </EuiText>
            <EuiText size="s">
              <strong>{op.estimated_rows?.toLocaleString() ?? '—'}</strong>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="xs" color="subdued">
              ACTUAL ROWS
            </EuiText>
            <EuiText size="s">
              <strong>{op.actual_rows?.toLocaleString() ?? '—'}</strong>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="xs" color="subdued">
              EXECUTION TIME
            </EuiText>
            <EuiText size="s">
              <strong>{formatMs(nodeTimeMs)}</strong>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <div
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: nodeColor,
            width: '100%',
          }}
        />
        <EuiSpacer size="xs" />
        <EuiText size="xs" color="subdued">
          {/* <em>Detailed per-operation metrics are not yet available.</em> */}
        </EuiText>
      </div>
    </div>
  );
}

function OperatorPlanSection({
  operatorTree,
  executionPhaseMs,
  injectedTimeFilter,
}: {
  operatorTree: any[];
  executionPhaseMs: number;
  injectedTimeFilter?: string;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const timings = operatorTree.map((op) => parseFloat(op.actual_time_ms) || 0);
  const totalTimeMs = timings.reduce((a, b) => a + b, 0);
  const maxTimeMs = Math.max(...timings);
  const bottleneckNodeIdx = timings.indexOf(maxTimeMs);
  const execBase = executionPhaseMs > 0 ? executionPhaseMs : totalTimeMs;

  // Compute cumulative start times per node
  let cursor = 0;
  const nodeStarts: number[] = [];
  operatorTree.forEach((_, i) => {
    nodeStarts.push(cursor);
    cursor += timings[i];
  });

  const pushedDownMs = operatorTree.reduce(
    (sum, op, i) => (op.is_pushed_down ? sum + timings[i] : sum),
    0
  );
  const coordMs = totalTimeMs - pushedDownMs;

  const tickInterval = totalTimeMs > 0 ? totalTimeMs / (TICK_COUNT - 1) : 1;
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => i * tickInterval);

  return (
    <div>
      <EuiTitle size="s">
        <h3>Execution Phase Profiling</h3>
      </EuiTitle>
      <EuiSpacer size="xs" />
      <EuiText size="xs" color="subdued">
        Each row is one execution stage. Click a stage to see the individual operations inside it.
      </EuiText>
      <EuiSpacer size="s" />
      <EuiFlexGroup gutterSize="m" alignItems="center" responsive={false}>
        {[
          { color: OPERATOR_COLORS.pushedDown, label: 'Optimized by OpenSearch' },
          { color: OPERATOR_COLORS.inMemory, label: 'Ran on coordinator' },
        ].map(({ color, label }) => (
          <EuiFlexItem key={label} grow={false}>
            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: color,
                    display: 'inline-block',
                  }}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="xs">{label}</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <div
        style={{
          border: `1px solid ${euiColorLightShade}`,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {/* Column header row */}
        <div
          style={{
            display: 'flex',
            backgroundColor: euiColorEmptyShade,
          }}
        >
          <div
            style={{
              width: LABEL_COL_WIDTH,
              flexShrink: 0,
              borderRight: `1px solid ${euiColorLightShade}`,
              padding: '6px 12px',
            }}
          >
            <span style={{ fontSize: 10, color: euiColorMediumShade }}>STAGE</span>
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
            {['TIME', 'ROWS IN', 'ROWS OUT'].map((h) => (
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
            style={{
              flex: 1,
              position: 'relative',
              height: 28,
              borderLeft: `1px solid ${euiColorLightShade}`,
            }}
          >
            {totalTimeMs > 0 &&
              ticks.map((t, i) =>
                i === 0 || i === ticks.length - 1 ? null : (
                  <span
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${(t / totalTimeMs) * 100}%`,
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
        {operatorTree.map((op, nodeIdx) => {
          const timeMs = timings[nodeIdx];
          const startMs = nodeStarts[nodeIdx];
          const isBottleneck = nodeIdx === bottleneckNodeIdx;
          const isPushedDown = !!op.is_pushed_down;
          const isExpanded = expandedIdx === nodeIdx;
          const isHovered = hoveredIdx === nodeIdx;
          const barColor = PHASE_COLORS.execute;
          const nodeColor = isPushedDown ? OPERATOR_COLORS.pushedDown : OPERATOR_COLORS.inMemory;
          const startPct = totalTimeMs > 0 ? (startMs / totalTimeMs) * 100 : 0;
          const widthPct = totalTimeMs > 0 ? (timeMs / totalTimeMs) * 100 : 0;
          const pctOfExec = ((timeMs / execBase) * 100).toFixed(0);
          const rowBg = isHovered || isExpanded ? `${nodeColor}28` : 'transparent';

          // Label for the node
          const types: string[] = op.node_type || ['Stage'];
          const commands = splitSourceCommands(op.source || '', types.length);
          const nodeTitle = isPushedDown
            ? `Pushed down to OpenSearch (${types.length} op${types.length > 1 ? 's' : ''})`
            : parseCommand(commands[0]).keyword.toUpperCase();
          const nodeSublabel = isPushedDown
            ? types.map((t, i) => parseCommand(commands[i]).keyword).join(' › ')
            : commands[0];

          return (
            <React.Fragment key={nodeIdx}>
              <div
                role="button"
                tabIndex={0}
                onMouseEnter={() => setHoveredIdx(nodeIdx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setExpandedIdx(isExpanded ? null : nodeIdx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setExpandedIdx(isExpanded ? null : nodeIdx);
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
                  }}
                >
                  <span style={{ flexShrink: 0 }}>
                    <EuiIcon
                      type={isExpanded ? 'arrowDown' : 'arrowRight'}
                      size="s"
                      color="subdued"
                    />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <EuiFlexGroup gutterSize="none" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiText size="s">
                          <strong>{nodeTitle}</strong>
                        </EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <StageBadge isPushedDown={isPushedDown} />
                      </EuiFlexItem>
                      {isBottleneck && (
                        <EuiFlexItem grow={false}>
                          <span
                            style={{
                              marginLeft: 4,
                              fontSize: 12,
                              color: OPERATOR_COLORS.bottleneck,
                            }}
                            title="Bottleneck"
                          >
                            ⚠
                          </span>
                        </EuiFlexItem>
                      )}
                    </EuiFlexGroup>
                    <EuiText
                      size="xs"
                      color="subdued"
                      style={{
                        marginTop: 2,
                        fontFamily: 'monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={nodeSublabel}
                    >
                      {nodeSublabel}
                    </EuiText>
                  </div>
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
                    formatMs(timeMs),
                    nodeIdx === 0
                      ? '—'
                      : (operatorTree[nodeIdx - 1]?.actual_rows?.toLocaleString() ?? '—'),
                    op.actual_rows?.toLocaleString() ?? '—',
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
                {/* Bar column */}
                <div
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    position: 'relative',
                    height: 46,
                    borderLeft: `1px solid ${euiColorLightShade}`,
                  }}
                >
                  {totalTimeMs > 0 &&
                    ticks.slice(1, -1).map((t, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: `${(t / totalTimeMs) * 100}%`,
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
                      backgroundColor: barColor,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 6,
                      boxSizing: 'border-box',
                      minWidth: 4,
                    }}
                  >
                    {isBottleneck ? (
                      <span style={{ fontSize: 11, color: '#000', whiteSpace: 'nowrap' }}>
                        {formatMs(timeMs)} ({pctOfExec}% of Execution Phase)
                      </span>
                    ) : widthPct > 10 ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#000',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatMs(timeMs)}
                      </span>
                    ) : null}
                  </div>
                  {!isBottleneck && widthPct <= 10 && startPct + widthPct < 85 && (
                    <span
                      style={{
                        position: 'absolute',
                        left: `${startPct + Math.max(widthPct, 0.5)}%`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        paddingLeft: 4,
                        fontSize: 11,
                        // Kept as a fixed dark color on purpose. This label sits just
                        // outside the bar, but a theme-reactive euiTextColor renders
                        // near-white in dark mode and is actually harder to read here
                        // against the surrounding bar/gridline area, so black stays
                        // the most legible option across themes.
                        color: '#000',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatMs(timeMs)}
                    </span>
                  )}
                </div>
              </div>
              {/* Expanded sub-table */}
              {isExpanded && (
                <OperationSubTable
                  op={op}
                  nodeTimeMs={timeMs}
                  barColor={barColor}
                  injectedTimeFilter={injectedTimeFilter}
                />
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
            Total Execution Phase: <strong>{formatMs(totalTimeMs)}</strong>
          </EuiText>
          <EuiText size="xs">
            On data nodes: <strong>{formatMs(pushedDownMs)}</strong>
          </EuiText>
          <EuiText size="xs">
            On coordinator: <strong>{formatMs(coordMs)}</strong>
          </EuiText>
          {operatorTree[0]?.actual_rows !== undefined && (
            <EuiText size="xs">
              Result: <strong>{operatorTree[0].actual_rows?.toLocaleString()} rows</strong>
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

function parseRecommendationMessage(message: string): React.ReactNode {
  const parts = message.split(/\*([^*]+)\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

function RecommendationsSection({ recommendations }: { recommendations: any[] }) {
  return (
    <div>
      <EuiTitle size="xxs">
        <h4>RECOMMENDATIONS</h4>
      </EuiTitle>
      <EuiSpacer size="s" />
      {!recommendations || recommendations.length === 0 ? (
        <EuiText size="s" color="subdued">
          No recommendations for this query.
        </EuiText>
      ) : (
        recommendations.map((rec: any, idx: number) => {
          const severity = (rec.serverity || rec.severity || 'INFO').toUpperCase();
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
                      Affects: {rec.affected_node}
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
              {idx < recommendations.length - 1 && <EuiSpacer size="s" />}
            </React.Fragment>
          );
        })
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
  const { response, injectedTimeFilter } = analyzeResult;
  const analyzeError = parseAnalyzeError(response);
  const hasProfile = !!response.profile;
  const totalTimeMs = response.profile?.summary?.total_time_ms || 0;
  const hasOperatorTree = response.operator_tree && response.operator_tree.length > 0;
  const possibleCacheHit = !!response.possibleCacheHit;

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
                Return to query results
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
          title="Query Profiling Unavailable - Error"
          iconType="iInCircle"
          color="danger"
          data-test-subj="analyzeProfileUnavailable"
        >
          <EuiText size="s">
            There was an error retrieving your query analysis from the backend. Typically, this is
            the result of an outdated version of the backend that does not support analyzing
            queries.
          </EuiText>
        </EuiCallOut>
      ) : (
        <>
          {possibleCacheHit && (
            <>
              <EuiCallOut title="Possible cache hit detected" iconType="iInCircle" color="primary">
                <EuiText size="s">
                  This query may have been previously cached, which can produce a much faster
                  execution phase time than normal. Cache hits can make profiling results
                  inaccurate. This behavior can be toggled in Settings.
                </EuiText>
              </EuiCallOut>
              <EuiSpacer size="m" />
            </>
          )}
          {response.profile?.phases && (
            <TimingBar phases={response.profile.phases} totalTimeMs={totalTimeMs} />
          )}
          <EuiSpacer size="l" />
          <EuiFlexGroup gutterSize="l">
            <EuiFlexItem grow={3}>
              {hasOperatorTree ? (
                <OperatorPlanSection
                  operatorTree={response.operator_tree}
                  executionPhaseMs={response.profile?.phases?.execute?.time_ms || 0}
                  injectedTimeFilter={injectedTimeFilter}
                />
              ) : (
                <EuiCallOut
                  title="Execution Phase Profiling unavailable"
                  iconType="iInCircle"
                  color="warning"
                >
                  <EuiText size="s">
                    The per-stage execution breakdown is only available for queries with a linear
                    execution plan. Queries that produce non-linear plans (e.g. JOINs) are not yet
                    supported and fall back to profile-only output. The phase timing bar above
                    reflects the full query profile.
                  </EuiText>
                </EuiCallOut>
              )}
            </EuiFlexItem>
            {response.recommendations && response.recommendations.length > 0 && (
              <EuiFlexItem grow={2}>
                <RecommendationsSection recommendations={response.recommendations} />
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </>
      )}
    </EuiPanel>
  );
};
