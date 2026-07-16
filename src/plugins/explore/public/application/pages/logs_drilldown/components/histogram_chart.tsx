/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef } from 'react';
import moment from 'moment';
import * as echarts from 'echarts';
import {
  Chart,
  Dimensions,
  buildChartFromBreakdownSeries,
  buildPointSeriesData,
} from '../../../../components/chart/utils/point_series';
import {
  createHistogramSpec,
  getTimezone,
} from '../../../../components/chart/utils/echarts_histogram_utils';
import { DEFAULT_THEME } from '../../../../components/visualizations/theme/default';
import { ExploreServices } from '../../../../types';
import { HistogramResult } from '../hooks/fetch_histogram';
import { normalizeSeverity, severityColor } from '../severity';
import { useCursorBus } from '../../metrics/explore/hooks/cursor_context';

interface Props {
  services: ExploreServices;
  histogram: HistogramResult;
  height: number;
  /** Brush-select: selected [from,to] epoch-ms → caller updates the global time picker. */
  onBrush?: (from: number, to: number) => void;
  /** Stable key so cursor-sync can ignore self-originated pointer events. */
  chartId: string;
}

// Blue for the no-severity single-series count (matches the debug/blue status color).
const SINGLE_SERIES_BUCKET = 'debug' as const;
const SEVERITY_STACK_ORDER: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  unknown: 4,
};

/**
 * The per-card histogram — an ECharts bar chart built from our PPL severity series, sharing the
 * ONE severity→color system (getColors status palette) with the legend + log-line tokens. Reuses
 * the production `createHistogramSpec` (native tooltip, x/y axes, stacked bars, brush-to-select) so
 * the engine matches the Query-mode chart. A shared cursor bus syncs the crosshair across all cards.
 */
export const HistogramChart: React.FC<Props> = ({
  services,
  histogram,
  height,
  onBrush,
  chartId,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);
  const bus = useCursorBus();

  const isDarkMode = services.uiSettings.get('theme:darkMode');

  // Build the Chart + ordered palette (severity stack order: error→warn→info→debug→unknown, bottom→top).
  const { chart, palette } = useMemo(() => buildChart(histogram), [histogram]);

  // Init the ECharts instance once.
  useEffect(() => {
    if (!containerRef.current || instanceRef.current) return;
    const inst = echarts.init(containerRef.current, DEFAULT_THEME);
    instanceRef.current = inst;
    const resizeObserver = new ResizeObserver(() => {
      if (inst && !inst.isDisposed()) inst.resize();
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      if (!inst.isDisposed()) inst.dispose();
      instanceRef.current = null;
    };
  }, []);

  // Apply the spec whenever the data/theme changes.
  useEffect(() => {
    const inst = instanceRef.current;
    if (!inst || inst.isDisposed()) return;
    const spec = createHistogramSpec(chart, {
      chartType: 'HistogramBar',
      timeZone: getTimezone(services.uiSettings),
      isDarkMode,
      showYAxisLabel: false,
      yAxisLabel: 'Count',
      useSmartDateFormat: true,
      colorPalette: palette,
    });
    // The shared spec draws its OWN ECharts legend for multi-series charts. We render a richer
    // custom legend (with humanized totals) below the chart, so suppress the built-in one to avoid a
    // double legend — and reclaim the right margin it reserved so the bars use the full card width.
    const specNoLegend = {
      ...spec,
      legend: { show: false },
      grid: { ...(spec as any).grid, right: 8 },
      // Enable a hidden lineX brush so users can DRAG-select a time range on the chart (the toolbar
      // button stays hidden — the brush is activated programmatically below). Mirrors DiscoverHistogram.
      brush: { toolbox: ['lineX'], xAxisIndex: 0 },
      toolbox: { show: false },
    };
    // Disable entry animation — many small charts mounting/refetching on scroll shouldn't all animate.
    inst.setOption({ ...specNoLegend, animation: false } as echarts.EChartsOption, true);
    // Activate the brush cursor without a visible toolbar so a plain drag selects a range.
    if (onBrush) {
      inst.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'brush',
        brushOption: { brushType: 'lineX', brushMode: 'single' },
      });
    }
  }, [chart, palette, isDarkMode, services.uiSettings, onBrush]);

  // Time-range interactions → onBrush(from,to) → the parent updates the global time picker:
  //  • DRAG across bars (lineX brush) selects an arbitrary [from,to] range.
  //  • single-CLICK a bar zooms to that bucket's [start, start + interval].
  useEffect(() => {
    const inst = instanceRef.current;
    if (!inst || !onBrush) return;
    const onBrushEnd = (params: { areas?: Array<{ coordRange?: [number, number] }> }) => {
      const range = params.areas?.[0]?.coordRange;
      if (range && range[0] != null && range[1] != null) onBrush(range[0], range[1]);
    };
    const onClick = (params: { componentType?: string; value?: [number, number] }) => {
      if (params.componentType === 'series' && params.value) {
        const start = params.value[0];
        if (start != null) onBrush(start, start + histogram.intervalMs);
      }
    };
    // @ts-expect-error echarts event typing is loose for custom events
    inst.on('brushEnd', onBrushEnd);
    // @ts-expect-error echarts event typing is loose for click params
    inst.on('click', onClick);
    return () => {
      if (!inst.isDisposed()) {
        inst.off('brushEnd', onBrushEnd);
        inst.off('click', onClick);
      }
    };
  }, [onBrush, histogram.intervalMs]);

  // Cursor sync: publish this chart's hovered x-index; subscribe to show a crosshair when another
  // chart is hovered (like metrics explore's synced pointer). Uses echarts showTip/axisPointer.
  useEffect(() => {
    const inst = instanceRef.current;
    if (!inst || !bus) return;

    const zr = inst.getZr();
    const onMove = (e: { offsetX: number; offsetY: number }) => {
      const pointInGrid = inst.convertFromPixel({ seriesIndex: 0 }, [e.offsetX, e.offsetY]);
      if (!pointInGrid) return;
      const xs = chart.xAxisOrderedValues;
      if (!xs?.length) return;
      // Nearest bucket index to the hovered x.
      const hoveredX = pointInGrid[0];
      let idx = 0;
      let best = Infinity;
      xs.forEach((x, i) => {
        const d = Math.abs(x - hoveredX);
        if (d < best) {
          best = d;
          idx = i;
        }
      });
      bus.publish({ idx, yRatio: 0 });
    };
    const onOut = () => bus.publish(null);
    zr.on('mousemove', onMove);
    zr.on('globalout', onOut);

    const unsub = bus.subscribe((state) => {
      if (inst.isDisposed()) return;
      if (!state) {
        inst.dispatchAction({ type: 'hideTip' });
        inst.dispatchAction({ type: 'updateAxisPointer', currTrigger: 'leave' });
        return;
      }
      const xs = chart.xAxisOrderedValues;
      if (!xs || state.idx >= xs.length) return;
      // Show the crosshair/tooltip at the shared bucket index on every chart.
      inst.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: state.idx });
    });

    return () => {
      zr.off('mousemove', onMove);
      zr.off('globalout', onOut);
      unsub();
    };
  }, [bus, chart]);

  return (
    <div
      ref={containerRef}
      className="logStreamCard__histogram"
      data-test-subj="logsExploreSeverityHistogram"
      data-chart-id={chartId}
      style={{ height, width: '100%' }}
    />
  );
};

/**
 * Fold the pre-gap-filled PPL series into a Chart + a palette ordered to match the series stacking
 * order, so `createHistogramSpec`'s index-based coloring lands the right severity color on each bar.
 * Exported for unit testing (the ECharts render path can't run in jsdom).
 */
export function buildChart(histogram: HistogramResult): { chart: Chart; palette: string[] } {
  const { series, intervalMs, from, to } = histogram;
  const dimensions = buildDimensions(intervalMs, from, to);

  const singleSeries = series.length === 1 && series[0].name === 'count';
  if (singleSeries) {
    const chart = buildPointSeriesData(
      {
        columns: [
          { id: 'x', name: '@timestamp' },
          { id: 'y', name: 'Count' },
        ],
        rows: series[0].dataPoints.map(([x, y]) => ({ x, y })),
      } as any,
      dimensions
    );
    return { chart, palette: [severityColor(SINGLE_SERIES_BUCKET)] };
  }

  // Severity breakdown: order series (and thus the palette) error→warn→info→debug→unknown.
  const ordered = [...series].sort(
    (a, b) =>
      (SEVERITY_STACK_ORDER[normalizeSeverity(a.name)] ?? 9) -
      (SEVERITY_STACK_ORDER[normalizeSeverity(b.name)] ?? 9)
  );
  const chart = buildChartFromBreakdownSeries(
    {
      breakdownField: 'severity',
      series: ordered.map((s) => ({ breakdownValue: s.name, dataPoints: s.dataPoints })),
    },
    dimensions
  );
  const palette = ordered.map((s) => severityColor(normalizeSeverity(s.name)));
  return { chart, palette };
}

/** Minimal Dimensions the Chart builders need: x = time bucket (moment interval + bounds), y = count. */
function buildDimensions(intervalMs: number, from: number, to: number): Dimensions {
  return ({
    x: {
      accessor: 0,
      format: { id: 'date', params: { pattern: 'HH:mm' } },
      params: {
        date: true,
        interval: moment.duration(intervalMs, 'ms'),
        intervalOpenSearchValue: 1,
        intervalOpenSearchUnit: 'm',
        format: 'HH:mm',
        bounds: { min: moment(from), max: moment(to) },
      },
    },
    y: { accessor: 1, format: { id: 'number' }, params: {} },
  } as unknown) as Dimensions;
}
