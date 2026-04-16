/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { EuiText } from '@elastic/eui';
import { useSharedCursor } from './cursor_context';

interface SeriesData {
  name: string;
  values: Array<[number, string]>;
}

interface ChartProps {
  values?: Array<[number, string]>;
  height: number;
  stroke?: string;
  label?: string;
  series?: SeriesData[];
  yMin?: number;
  yMax?: number;
  isDarkMode?: boolean;
  onTimeRangeChange?: (from: string, to: string) => void;
}

const PADDING = { top: 8, right: 36, bottom: 28, left: 60 };

function formatValue(v: number, range?: number): string {
  // When range is provided and small relative to values, use enough precision to differentiate
  if (range !== undefined && range > 0) {
    const magnitude = Math.abs(v);
    if (magnitude > 0 && range / magnitude < 0.01) {
      // Very small range relative to value — need extra precision
      const decimals = Math.max(2, Math.ceil(-Math.log10(range)) + 1);
      return v.toFixed(Math.min(decimals, 6));
    }
  }
  const abs = Math.abs(v);
  if (abs >= 1e9) return (v / 1e9).toFixed(1) + ' G';
  if (abs >= 1e6) return (v / 1e6).toFixed(1) + ' M';
  if (abs >= 1e4) return (v / 1e3).toFixed(1) + ' k';
  if (abs >= 100) return v.toFixed(0);
  if (abs >= 1) return v.toFixed(1);
  if (abs >= 0.01) return v.toFixed(3);
  if (abs === 0) return '0';
  return v.toPrecision(3);
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatTooltipTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Classic series color palette
export const SERIES_COLORS = [
  '#73B460',
  '#E8B53B',
  '#62CCE3',
  '#F08838',
  '#DE4F45',
  '#1D74BE',
  '#BE47AC',
  '#6C59A3',
  '#4D8240',
  '#CFA502',
  '#4280BF',
  '#C45E19',
  '#8B1104',
  '#0C457E',
  '#6F2165',
  '#5A467A',
];

export const SparklineChart: React.FC<ChartProps> = ({
  values,
  height,
  stroke = '#006BB4',
  label = 'value',
  series: multiSeries,
  yMin: propYMin,
  yMax: propYMax,
  isDarkMode = false,
  onTimeRangeChange,
}) => {
  const colors = SERIES_COLORS;
  const gridColor = isDarkMode ? '#2a2a2a' : '#efefef';
  const textColor = isDarkMode ? '#8e8e8e' : '#999';
  const legendColor = isDarkMode ? '#aaa' : '#666';
  const tooltipBg = isDarkMode ? '#1e1e1e' : '#fff';
  const tooltipBorder = isDarkMode ? '#444' : '#ddd';
  const tooltipShadow = isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.12)';
  const crosshairColor = isDarkMode ? '#555' : '#999';
  const dotStroke = isDarkMode ? '#1e1e1e' : '#fff';
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    idx: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [sharedCursor, publishCursor] = useSharedCursor();
  const crosshairIdx = hover ? hover.idx : sharedCursor?.idx ?? null;
  const [dragStart, setDragStart] = useState<number | null>(null); // idx at mousedown
  const draggingRef = useRef(false);

  const allSeries = useMemo(() => {
    if (multiSeries && multiSeries.length > 0) return multiSeries;
    if (values) return [{ name: label, values }];
    return [];
  }, [multiSeries, values, label]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const parsed = useMemo(
    () =>
      allSeries.map((s) => ({
        name: s.name,
        nums: s.values.map(([, v]) => parseFloat(v)),
        timestamps: s.values.map(([t]) => t),
      })),
    [allSeries]
  );

  // Global min/max/timestamps from first series (all share same time range)
  const timestamps = useMemo(() => parsed[0]?.timestamps || [], [parsed]);
  const allNums = useMemo(() => parsed.flatMap((p) => p.nums).filter((v) => !isNaN(v)), [parsed]);

  const getIdxFromEvent = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || timestamps.length < 2) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const plotW = rect.width - PADDING.left - PADDING.right;
      const relX = mx - PADDING.left;
      const idx = Math.round((relX / plotW) * (timestamps.length - 1));
      return idx >= 0 && idx < timestamps.length ? idx : null;
    },
    [timestamps.length]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || timestamps.length < 2) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const plotW = rect.width - PADDING.left - PADDING.right;
      const relX = mx - PADDING.left;
      const idx = Math.round((relX / plotW) * (timestamps.length - 1));
      if (idx >= 0 && idx < timestamps.length) {
        setHover({ x: mx, y: my, idx, clientX: e.clientX, clientY: e.clientY });
        if (dragStart !== null && Math.abs(idx - dragStart) > 1) draggingRef.current = true;
        const plotH = rect.height - PADDING.top - PADDING.bottom;
        const yRatio = Math.max(0, Math.min(1, (my - PADDING.top) / plotH));
        publishCursor({ idx, yRatio });
      }
    },
    [timestamps.length, publishCursor, dragStart]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const idx = getIdxFromEvent(e);
      if (idx !== null) {
        setDragStart(idx);
        draggingRef.current = false;
      }
    },
    [getIdxFromEvent]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (dragStart === null || !draggingRef.current || !onTimeRangeChange) {
        setDragStart(null);
        draggingRef.current = false;
        return;
      }
      const endIdx = getIdxFromEvent(e);
      if (endIdx !== null && endIdx !== dragStart) {
        const lo = Math.min(dragStart, endIdx);
        const hi = Math.max(dragStart, endIdx);
        const from = new Date(timestamps[lo] * 1000).toISOString();
        const to = new Date(timestamps[hi] * 1000).toISOString();
        onTimeRangeChange(from, to);
      }
      setDragStart(null);
      draggingRef.current = false;
    },
    [dragStart, timestamps, onTimeRangeChange, getIdxFromEvent]
  );

  const handleMouseLeave = useCallback(() => {
    setHover(null);
    setDragStart(null);
    draggingRef.current = false;
    publishCursor(null);
  }, [publishCursor]);

  if (allNums.length < 2) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height,
        }}
      >
        <EuiText size="xs" color="subdued">
          No data
        </EuiText>
      </div>
    );
  }

  const isMulti = allSeries.length > 1;
  const min = propYMin !== undefined ? propYMin : Math.min(...allNums);
  const max = propYMax !== undefined ? propYMax : Math.max(...allNums);
  const range = max - min || 1;
  const legendH = isMulti ? Math.ceil(allSeries.length / 8) * 16 + 4 : 16;
  const pad = { ...PADDING, bottom: PADDING.bottom + legendH };

  const yTicks: number[] = [];
  const tickCount = 4;
  for (let i = 0; i <= tickCount; i++) yTicks.push(min + (range * i) / tickCount);

  const xTickCount = Math.min(4, timestamps.length - 1);
  const xTicks: number[] = [];
  for (let i = 0; i <= xTickCount; i++)
    xTicks.push(Math.round((i / xTickCount) * (timestamps.length - 1)));

  const plotW = containerWidth - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const totalH = height;

  const getColor = (i: number) => (isMulti ? colors[i % colors.length] : stroke);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: totalH,
        position: 'relative',
        userSelect: 'none',
        cursor: dragStart !== null && draggingRef.current ? 'col-resize' : 'crosshair',
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <svg width="100%" height={totalH} style={{ display: 'block' }}>
        {/* Y-axis grid */}
        {yTicks.map((v, i) => {
          const y = pad.top + plotH - ((v - min) / range) * plotH;
          return (
            <g key={`y-${i}`}>
              <line
                x1={pad.left}
                y1={y}
                x2="100%"
                y2={y}
                stroke={gridColor}
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill={textColor}>
                {formatValue(v, range)}
              </text>
            </g>
          );
        })}
        {/* X-axis labels */}
        {plotW > 0 &&
          xTicks.map((idx) => {
            const x = pad.left + (idx / (timestamps.length - 1)) * plotW;
            return (
              <text
                key={`x-${idx}`}
                x={x}
                y={pad.top + plotH + 16}
                textAnchor="middle"
                fontSize="10"
                fill={textColor}
              >
                {formatTime(timestamps[idx])}
              </text>
            );
          })}
        {/* Area fill + lines */}
        {plotW > 0 &&
          parsed.map((s, si) => {
            const linePoints = s.nums
              .map((v, i) => {
                const x = pad.left + (i / (s.nums.length - 1)) * plotW;
                const y = pad.top + plotH - ((v - min) / range) * plotH;
                return `${x},${y}`;
              })
              .join(' ');
            const firstX = pad.left;
            const lastX = pad.left + plotW;
            const baseY = pad.top + plotH;
            const areaPoints = `${firstX},${baseY} ${linePoints} ${lastX},${baseY}`;
            const color = getColor(si);
            return (
              <g key={si}>
                <polygon fill={color} fillOpacity={0.2} points={areaPoints} stroke="none" />
                <polyline fill="none" stroke={color} strokeWidth="1" points={linePoints} />
              </g>
            );
          })}
        {/* Drag selection overlay */}
        {dragStart !== null &&
          hover &&
          draggingRef.current &&
          plotW > 0 &&
          (() => {
            const lo = Math.min(dragStart, hover.idx);
            const hi = Math.max(dragStart, hover.idx);
            const x1 = pad.left + (lo / (timestamps.length - 1)) * plotW;
            const x2 = pad.left + (hi / (timestamps.length - 1)) * plotW;
            return (
              <rect
                x={x1}
                y={pad.top}
                width={x2 - x1}
                height={plotH}
                fill={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,100,200,0.1)'}
                stroke={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,100,200,0.3)'}
                strokeWidth="1"
              />
            );
          })()}
        {/* Hover crosshair */}
        {crosshairIdx !== null &&
          crosshairIdx >= 0 &&
          crosshairIdx < timestamps.length &&
          plotW > 0 && (
            <>
              <line
                x1={pad.left + (crosshairIdx / (timestamps.length - 1)) * plotW}
                y1={pad.top}
                x2={pad.left + (crosshairIdx / (timestamps.length - 1)) * plotW}
                y2={pad.top + plotH}
                stroke={crosshairColor}
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              {parsed.map((s, si) => {
                const v = s.nums[crosshairIdx];
                if (isNaN(v)) return null;
                const cx = pad.left + (crosshairIdx / (timestamps.length - 1)) * plotW;
                const cy = pad.top + plotH - ((v - min) / range) * plotH;
                return (
                  <g key={si}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill={getColor(si)}
                      stroke={dotStroke}
                      strokeWidth="1"
                    />
                  </g>
                );
              })}
              {(() => {
                const yRatio = hover
                  ? Math.max(0, Math.min(1, (hover.y - pad.top) / plotH))
                  : sharedCursor?.yRatio ?? null;
                if (yRatio === null) return null;
                const cy = pad.top + yRatio * plotH;
                return (
                  <line
                    x1={pad.left}
                    y1={cy}
                    x2={pad.left + plotW}
                    y2={cy}
                    stroke={crosshairColor}
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                );
              })()}
            </>
          )}
      </svg>
      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: pad.left,
          right: pad.right,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2px 8px',
          fontSize: 10,
          color: legendColor,
        }}
      >
        {allSeries.map((s, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 3,
                backgroundColor: getColor(i),
                borderRadius: 1,
              }}
            />
            {s.name}
          </span>
        ))}
      </div>
      {/* Tooltip */}
      {hover &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: hover.clientX + 12,
              top: hover.clientY - 40,
              background: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: 4,
              padding: '6px 10px',
              fontSize: 12,
              boxShadow: `0 2px 8px ${tooltipShadow}`,
              pointerEvents: 'none',
              zIndex: 10000,
              whiteSpace: 'nowrap',
              maxHeight: 400,
              overflowY: 'auto',
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              {formatTooltipTime(timestamps[hover.idx])}
            </div>
            {parsed
              .map((s, si) => ({ name: s.name, val: s.nums[hover.idx], color: getColor(si) }))
              .filter((r) => !isNaN(r.val))
              .sort((a, b) => b.val - a.val)
              .map((r, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: '18px' }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 3,
                      backgroundColor: r.color,
                      borderRadius: 1,
                    }}
                  />
                  <span>{r.name}</span>
                  <span style={{ fontWeight: 600, marginLeft: 'auto', paddingLeft: 12 }}>
                    {formatValue(r.val, range)}
                  </span>
                </div>
              ))}
          </div>,
          document.body
        )}
    </div>
  );
};

// Keep backward compat for any other callers
export function renderSvgLine(
  values: Array<[number, string]>,
  w: number,
  h: number,
  stroke = '#006BB4',
  isDark = false
): JSX.Element {
  return <SparklineChart values={values} height={h} stroke={stroke} isDarkMode={isDark} />;
}
