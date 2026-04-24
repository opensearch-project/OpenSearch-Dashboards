/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import * as echarts from 'echarts';
import { EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import { useCursorBus } from '../hooks/cursor_context';

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

// Grid padding constants (kept in sync with the chart `grid` option below).
const GRID = { top: 8, right: 36, bottom: 48, left: 60 };

function formatValue(v: number): string {
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

export const SparklineChart: React.FC<ChartProps> = ({
  values,
  height,
  stroke = euiThemeVars.euiColorPrimary,
  label = 'value',
  series: multiSeries,
  yMin,
  yMax,
  isDarkMode = false,
  onTimeRangeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);
  const bus = useCursorBus();

  const allSeries = useMemo(() => {
    if (multiSeries && multiSeries.length > 0) return multiSeries;
    if (values) return [{ name: label, values }];
    return [];
  }, [multiSeries, values, label]);

  const parsed = useMemo(
    () =>
      allSeries.map((s) => ({
        name: s.name,
        data: s.values.map(([t, v]) => [t * 1000, parseFloat(v)] as [number, number]),
      })),
    [allSeries]
  );

  const hasData = useMemo(() => parsed.some((s) => s.data.length >= 2), [parsed]);

  const timestamps = useMemo(() => parsed[0]?.data.map(([t]) => t) || [], [parsed]);

  const getColor = useCallback(
    (i: number) => (allSeries.length > 1 ? SERIES_COLORS[i % SERIES_COLORS.length] : stroke),
    [allSeries.length, stroke]
  );

  const option = useMemo((): echarts.EChartsOption | null => {
    if (!hasData) return null;

    const textColor = isDarkMode ? '#8e8e8e' : '#999';
    const splitLineColor = isDarkMode ? '#2a2a2a' : '#efefef';

    const legendConfig: echarts.EChartsOption['legend'] = {
      type: 'scroll',
      bottom: 0,
      left: 60,
      right: 36,
      itemWidth: 12,
      itemHeight: 3,
      textStyle: { fontSize: 10, color: isDarkMode ? '#aaa' : '#666' },
      pageIconSize: 10,
      pageTextStyle: { fontSize: 10 },
    };

    const baseOption: echarts.EChartsOption = {
      animation: false,
      color: allSeries.map((_, i) => getColor(i)),
      grid: GRID,
      legend: legendConfig,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { show: false } },
        backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
        borderColor: isDarkMode ? '#444' : '#ddd',
        textStyle: { fontSize: 12, color: isDarkMode ? '#ddd' : '#333' },
        formatter: (params: any) => {
          const items = Array.isArray(params) ? params : [params];
          if (!items.length) return '';
          const time = new Date(items[0].value[0]).toLocaleString([], {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          const sorted = [...items].sort((a, b) => (b.value[1] ?? 0) - (a.value[1] ?? 0));
          const lines = sorted.map(
            (p: any) =>
              `<span style="display:inline-block;width:10px;height:3px;background:${
                p.color
              };border-radius:1px;margin-right:6px"></span>${
                p.seriesName
              } <b style="float:right;margin-left:12px">${formatValue(p.value[1])}</b>`
          );
          return `<div style="font-weight:500;margin-bottom:4px">${time}</div>${lines.join(
            '<br/>'
          )}`;
        },
      },
      xAxis: {
        type: 'time',
        axisLabel: { fontSize: 10, color: textColor },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: yMin,
        max: yMax,
        axisLabel: {
          fontSize: 10,
          color: textColor,
          formatter: (v: number) => formatValue(v),
        },
        splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
      },
      series: parsed.map((s, i) => ({
        name: s.name,
        type: 'line' as const,
        data: s.data,
        showSymbol: false,
        lineStyle: { width: 1 },
        areaStyle: { opacity: 0.2 },
        color: getColor(i),
      })),
    };

    // Add brush tool for drag-to-select time range when onTimeRangeChange is provided
    if (onTimeRangeChange) {
      baseOption.brush = {
        toolbox: ['lineX'],
        xAxisIndex: 0,
      };
      baseOption.toolbox = { show: false };
    }

    return baseOption;
  }, [hasData, parsed, allSeries, isDarkMode, yMin, yMax, getColor, onTimeRangeChange]);

  // Init / dispose
  useEffect(() => {
    if (!containerRef.current) return;
    const inst = echarts.init(containerRef.current);
    instanceRef.current = inst;
    const ro = new ResizeObserver(() => inst.resize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      inst.dispose();
      instanceRef.current = null;
    };
  }, []);

  // Set option and activate brush tool
  useEffect(() => {
    const inst = instanceRef.current;
    if (inst && option) {
      inst.setOption(option, { notMerge: true });
      // Activate brush tool for drag-to-select if configured
      if (onTimeRangeChange) {
        inst.dispatchAction({
          type: 'takeGlobalCursor',
          key: 'brush',
          brushOption: { brushType: 'lineX', brushMode: 'single' },
        });
      }
    }
  }, [option, onTimeRangeChange]);

  // Brush end → time range change
  useEffect(() => {
    const inst = instanceRef.current;
    if (!inst || !onTimeRangeChange) return;

    const onBrushEnd = (params: any) => {
      const [from, to] = params.areas?.[0]?.coordRange ?? [];
      if (from != null && to != null) {
        onTimeRangeChange(new Date(from).toISOString(), new Date(to).toISOString());
      }
    };

    inst.on('brushEnd', onBrushEnd);
    return () => {
      if (!inst.isDisposed()) {
        inst.off('brushEnd', onBrushEnd);
      }
    };
  }, [onTimeRangeChange]);

  // Shared cursor: draw crosshair + per-series dots directly on the zrender
  // layer. Using zrender shapes (not setOption/graphic) keeps mouse moves cheap
  // — we just mutate shape attrs. The chart under the real cursor also shows
  // the native tooltip; remote charts get lines + dots only.
  useEffect(() => {
    const inst = instanceRef.current;
    if (!inst || !bus) return;
    const zr = inst.getZr();
    const zrGraphic: any = (echarts as any).graphic;
    if (!zrGraphic?.Line || !zrGraphic?.Circle) return;

    const lineColor = isDarkMode ? '#555' : '#999';
    const dotStroke = isDarkMode ? '#1e1e1e' : '#fff';

    const vLine = new zrGraphic.Line({
      z: 100,
      silent: true,
      invisible: true,
      style: { stroke: lineColor, lineWidth: 1, lineDash: [3, 3] },
    });
    const hLine = new zrGraphic.Line({
      z: 100,
      silent: true,
      invisible: true,
      style: { stroke: lineColor, lineWidth: 1, lineDash: [3, 3] },
    });
    zr.add(vLine);
    zr.add(hLine);

    // One dot per series, positioned at (xIdx, seriesValue).
    const dots: any[] = parsed.map((_, i) => {
      const dot = new zrGraphic.Circle({
        z: 101,
        silent: true,
        invisible: true,
        shape: { cx: 0, cy: 0, r: 3 },
        style: { fill: getColor(i), stroke: dotStroke, lineWidth: 1 },
      });
      zr.add(dot);
      return dot;
    });

    let isLocalHover = false;

    const hideOverlay = () => {
      vLine.attr({ invisible: true });
      hLine.attr({ invisible: true });
      dots.forEach((d) => d.attr({ invisible: true }));
    };

    const showOverlay = (idx: number, yRatio: number) => {
      const plotTop = GRID.top;
      const plotBot = inst.getHeight() - GRID.bottom;
      const plotLeft = GRID.left;
      const plotRight = inst.getWidth() - GRID.right;
      if (plotBot <= plotTop || plotRight <= plotLeft) return;
      if (idx < 0 || idx >= timestamps.length) return;

      const xValue = timestamps[idx];
      const xyPx = inst.convertToPixel({ gridIndex: 0 }, [xValue, 0]) as
        | [number, number]
        | null
        | undefined;
      if (!xyPx) return;
      const xPx = xyPx[0];
      const yPx = plotTop + yRatio * (plotBot - plotTop);

      vLine.attr({
        invisible: false,
        shape: { x1: xPx, y1: plotTop, x2: xPx, y2: plotBot },
      });
      hLine.attr({
        invisible: false,
        shape: { x1: plotLeft, y1: yPx, x2: plotRight, y2: yPx },
      });

      // Position a dot at the data value of each series for the given index.
      parsed.forEach((s, i) => {
        const pt = s.data[idx];
        const dot = dots[i];
        if (!pt || isNaN(pt[1])) {
          dot.attr({ invisible: true });
          return;
        }
        const px = inst.convertToPixel({ gridIndex: 0 }, [pt[0], pt[1]]) as
          | [number, number]
          | null
          | undefined;
        if (!px) {
          dot.attr({ invisible: true });
          return;
        }
        dot.attr({
          invisible: false,
          shape: { cx: px[0], cy: px[1], r: 3 },
        });
      });
    };

    const onMouseMove = (params: any) => {
      if (timestamps.length === 0) return;
      const x = params.offsetX;
      const y = params.offsetY;

      const plotTop = GRID.top;
      const plotBot = inst.getHeight() - GRID.bottom;
      const plotLeft = GRID.left;
      const plotRight = inst.getWidth() - GRID.right;
      if (x < plotLeft || x > plotRight || y < plotTop || y > plotBot || plotBot <= plotTop) {
        return;
      }

      const pt = inst.convertFromPixel({ gridIndex: 0 }, [x, y]) as
        | [number, number]
        | null
        | undefined;
      if (!pt || pt[0] == null) return;
      const xValue = pt[0];

      let idx = 0;
      let minDist = Infinity;
      for (let i = 0; i < timestamps.length; i++) {
        const d = Math.abs(timestamps[i] - xValue);
        if (d < minDist) {
          minDist = d;
          idx = i;
        }
      }

      const yRatio = Math.max(0, Math.min(1, (y - plotTop) / (plotBot - plotTop)));

      isLocalHover = true;
      // Show overlay locally too — the per-series dots are useful even on the
      // hovered chart. The native axisPointer vertical line will also render
      // but they overlap visually; the tooltip stays local because we do not
      // hideTip here.
      showOverlay(idx, yRatio);
      bus.publish({ idx, yRatio });
    };

    const onGlobalOut = () => {
      isLocalHover = false;
      hideOverlay();
      bus.publish(null);
    };

    zr.on('mousemove', onMouseMove);
    zr.on('globalout', onGlobalOut);

    const unsubscribe = bus.subscribe((state) => {
      if (isLocalHover) return; // local hover is handled by onMouseMove
      if (!state) {
        hideOverlay();
        if (!inst.isDisposed()) inst.dispatchAction({ type: 'hideTip' });
        return;
      }
      // Remote update — make sure any lingering tooltip/pointer on this chart
      // is hidden, then render our overlay.
      if (!inst.isDisposed()) inst.dispatchAction({ type: 'hideTip' });
      showOverlay(state.idx, state.yRatio);
    });

    return () => {
      unsubscribe();
      if (!inst.isDisposed()) {
        zr.off('mousemove', onMouseMove);
        zr.off('globalout', onGlobalOut);
        zr.remove(vLine);
        zr.remove(hLine);
        dots.forEach((d) => zr.remove(d));
      }
    };
  }, [bus, timestamps, parsed, isDarkMode, getColor]);

  if (!hasData) {
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
          {i18n.translate('explore.metricsExplore.noData', { defaultMessage: 'No data' })}
        </EuiText>
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: '100%', height }} />;
};
