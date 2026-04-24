/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import * as echarts from 'echarts';
import { EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import { useSharedCursor } from '../hooks/cursor_context';

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
  const [sharedCursor, publishCursor] = useSharedCursor();

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
      grid: {
        top: 8,
        right: 36,
        bottom: 48,
        left: 60,
      },
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

  // Shared cursor: publish on hover
  useEffect(() => {
    const inst = instanceRef.current;
    if (!inst) return;

    const onAxisPointer = (params: any) => {
      const dataIndex = params.batch?.[0]?.dataIndex;
      if (dataIndex != null && timestamps.length > 0) {
        const plotH = inst.getHeight() - 8 - 28;
        publishCursor({ idx: dataIndex, yRatio: 0.5 });
      }
    };
    const onGlobalOut = () => publishCursor(null);

    inst.on('updateAxisPointer', onAxisPointer);
    inst.getZr().on('globalout', onGlobalOut);
    return () => {
      if (!inst.isDisposed()) {
        inst.off('updateAxisPointer', onAxisPointer);
        inst.getZr().off('globalout', onGlobalOut);
      }
    };
  }, [publishCursor, timestamps]);

  // Shared cursor: receive from other charts
  useEffect(() => {
    const inst = instanceRef.current;
    if (!inst || sharedCursor === null) {
      if (instanceRef.current && !instanceRef.current.isDisposed()) {
        instanceRef.current.dispatchAction({ type: 'hideTip' });
      }
      return;
    }
    if (sharedCursor.idx < timestamps.length) {
      inst.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
        dataIndex: sharedCursor.idx,
      });
    }
  }, [sharedCursor, timestamps]);

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
