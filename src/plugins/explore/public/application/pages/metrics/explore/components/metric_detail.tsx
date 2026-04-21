/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiButton,
  EuiButtonIcon,
  EuiTitle,
  EuiText,
  EuiPanel,
  EuiBadge,
  EuiComboBox,
  EuiButtonGroup,
  EuiLoadingChart,
} from '@elastic/eui';
import { darkMode } from '@osd/ui-shared-deps/theme';
import { i18n } from '@osd/i18n';
import { LabelInfo, MetricType, inferMetricType, LayoutMode, breakdownGridStyle } from '../types';
import { useExploration } from '../contexts/exploration_context';
import { SparklineChart, SERIES_COLORS } from './sparkline';
import { LabelFilterBar } from './label_filter_bar';
import { LabelFilterBadges } from './label_filter_bar';
import { LoadingIndicator, ErrorCallout } from './loading_state';
import { useConcurrentQueries } from '../hooks/use_concurrent_queries';

interface BreakdownSeries {
  labelValue: string;
  values: Array<[number, string]>;
}

interface LabelBreakdownData {
  label: string;
  cardinality: number;
  series: BreakdownSeries[];
}

function seriesLabelForType(type: MetricType): string {
  switch (type) {
    case MetricType.COUNTER:
      return 'sum(rate)';
    case MetricType.HISTOGRAM:
      return 'histogram_quantile(0.95)';
    default:
      return 'avg';
  }
}

const BreakdownPanel: React.FC<{
  labelName: string;
  data: LabelBreakdownData | null;
  selectedLabelName: string;
  breakdownYRange?: { yMin: number; yMax: number };
  layout: LayoutMode;
  metricType: MetricType;
  onVisibilityChange: (key: string, visible: boolean) => void;
  onTimeRangeChange?: (from: string, to: string) => void;
}> = ({
  labelName,
  data,
  selectedLabelName,
  breakdownYRange,
  layout,
  metricType,
  onVisibilityChange,
  onTimeRangeChange,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => onVisibilityChange(labelName, entry.isIntersecting),
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      onVisibilityChange(labelName, false);
    };
  }, [labelName, onVisibilityChange]);

  if (!data) {
    return (
      <div ref={panelRef}>
        <EuiPanel paddingSize="s" hasBorder>
          <EuiTitle size="xxs">
            <h3>{labelName}</h3>
          </EuiTitle>
          <div
            style={{
              marginTop: 4,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 160,
            }}
          >
            <EuiLoadingChart size="m" />
          </div>
        </EuiPanel>
      </div>
    );
  }

  // When a specific label is selected, show individual series panels
  if (selectedLabelName) {
    return (
      <div
        ref={panelRef}
        style={{
          gridColumn: '1 / -1',
          ...breakdownGridStyle(layout),
        }}
      >
        {data.series.map((s, i) => (
          <EuiPanel key={`${data.label}-${s.labelValue}`} paddingSize="s" hasBorder>
            <EuiTitle size="xxs">
              <h3>{s.labelValue}</h3>
            </EuiTitle>
            <div style={{ marginTop: 4 }}>
              {s.values.length > 0 ? (
                <SparklineChart
                  values={s.values}
                  height={160}
                  label={seriesLabelForType(metricType)}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  isDarkMode={darkMode}
                  onTimeRangeChange={onTimeRangeChange}
                  {...breakdownYRange}
                />
              ) : (
                <EuiText size="xs" color="subdued">
                  {i18n.translate('explore.metricsExplore.noData', { defaultMessage: 'No data' })}
                </EuiText>
              )}
            </div>
          </EuiPanel>
        ))}
      </div>
    );
  }

  return (
    <div ref={panelRef}>
      <EuiPanel paddingSize="s" hasBorder>
        <EuiTitle size="xxs">
          <h3>
            {data.label} ({data.cardinality})
          </h3>
        </EuiTitle>
        <div style={{ marginTop: 4 }}>
          {data.series.length > 0 ? (
            <SparklineChart
              series={data.series.map((s) => ({
                name: s.labelValue,
                values: s.values,
              }))}
              height={160}
              label={data.label}
              isDarkMode={darkMode}
              onTimeRangeChange={onTimeRangeChange}
              {...breakdownYRange}
            />
          ) : (
            <EuiText size="xs" color="subdued">
              {i18n.translate('explore.metricsExplore.noData', { defaultMessage: 'No data' })}
            </EuiText>
          )}
        </div>
      </EuiPanel>
    </div>
  );
};

export const MetricDetail: React.FC = () => {
  const {
    state,
    dispatch,
    client,
    queryGen,
    stepSec,
    executePromQL,
    refreshCounter,
    onTimeRangeChange,
  } = useExploration();
  const [chartData, setChartData] = useState<Array<[number, string]>>([]);
  const [labels, setLabels] = useState<LabelInfo[]>([]);
  const [metadata, setMetadata] = useState<{ type: MetricType; help: string; unit: string }>({
    type: MetricType.UNKNOWN,
    help: '',
    unit: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<Array<{ label: string }>>([]);

  const promql = queryGen.forMetric(state.metric, metadata.type, stepSec, state.filters);
  const selectedLabelName = selectedLabel[0]?.label || '';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const fetchAll = async () => {
      try {
        const metaMap = await client.getMetadata(state.metric);
        const meta = metaMap[state.metric];
        if (meta && !cancelled) setMetadata({ type: meta.type, help: meta.help, unit: meta.unit });
        const type = inferMetricType(state.metric, meta?.type || MetricType.UNKNOWN);
        const query = queryGen.forMetric(state.metric, type, stepSec, state.filters);
        const result = await client.queryRange(query);
        if (!cancelled) setChartData(result?.[0]?.values || []);
        const labelNames = await client.getLabelsForMetric(state.metric);
        if (!cancelled) {
          setLabels(labelNames.map((name) => ({ name, cardinality: 0 })));
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [state.metric, state.filters, client, queryGen, stepSec, refreshCounter]);

  // Clear selection when data source changes
  const filterKey = `${state.metric}|${JSON.stringify(state.filters)}|${refreshCounter}`;
  const prevFilterKeyRef = useRef(filterKey);
  useEffect(() => {
    if (filterKey !== prevFilterKeyRef.current) {
      prevFilterKeyRef.current = filterKey;
      setSelectedLabel([]);
    }
  }, [filterKey]);

  // Concurrent breakdown fetching via shared hook
  const metricType = inferMetricType(state.metric, metadata.type);
  const breakdownFetch = useCallback(
    (labelName: string, signal: AbortSignal) => {
      const query = queryGen.forBreakdown(
        state.metric,
        metricType,
        labelName,
        stepSec,
        state.filters
      );
      return client.queryRange(query, signal).then((result) => {
        const series: BreakdownSeries[] = (result || []).map((r: any) => ({
          labelValue: r.metric?.[labelName] ?? '',
          values: r.values || [],
        }));
        return { label: labelName, cardinality: series.length, series } as LabelBreakdownData;
      });
    },
    [client, queryGen, state.metric, metricType, stepSec, state.filters]
  );

  const { results: breakdowns, onVisibilityChange } = useConcurrentQueries<LabelBreakdownData>(
    breakdownFetch,
    [client, state.filters, refreshCounter, selectedLabelName, loading]
  );

  const labelOptions = useMemo(() => labels.map((l) => ({ label: l.name })), [labels]);

  const visibleBreakdowns = useMemo(() => {
    if (!selectedLabelName) {
      return labels.map((l) => breakdowns.get(l.name)).filter(Boolean) as LabelBreakdownData[];
    }
    const bd = breakdowns.get(selectedLabelName);
    return bd ? [bd] : [];
  }, [selectedLabelName, labels, breakdowns]);

  // Compute global y-axis range across all visible breakdown series
  const breakdownYRange = useMemo(() => {
    let gMin = Infinity;
    let gMax = -Infinity;
    for (const bd of visibleBreakdowns) {
      for (const s of bd.series) {
        for (const [, v] of s.values) {
          const n = parseFloat(v);
          if (!isNaN(n)) {
            if (n < gMin) gMin = n;
            if (n > gMax) gMax = n;
          }
        }
      }
    }
    return gMin <= gMax ? { yMin: gMin, yMax: gMax } : undefined;
  }, [visibleBreakdowns]);

  const labelsToShow = useMemo(
    () => (selectedLabelName ? labels.filter((l) => l.name === selectedLabelName) : labels),
    [labels, selectedLabelName]
  );

  if (loading) return <LoadingIndicator />;
  if (error) return <ErrorCallout error={error} />;

  return (
    <>
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType="arrowLeft"
            aria-label={i18n.translate('explore.metricsExplore.backToMetrics', {
              defaultMessage: 'Back to all metrics',
            })}
            onClick={() => dispatch({ type: 'GO_BACK' })}
            data-test-subj="metricsExploreBackButton"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup gutterSize="s" alignItems="baseline" wrap responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiTitle size="s">
                <h2 style={{ whiteSpace: 'nowrap' }} data-test-subj="metricsExploreDetailTitle">
                  {state.metric}
                </h2>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge>{metadata.type}</EuiBadge>
            </EuiFlexItem>
            {metadata.unit && (
              <EuiFlexItem grow={false}>
                <EuiBadge color="hollow">{metadata.unit}</EuiBadge>
              </EuiFlexItem>
            )}
            {metadata.help && (
              <EuiFlexItem grow={false}>
                <EuiText size="xs" color="subdued">
                  {metadata.help}
                </EuiText>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            iconType="play"
            onClick={() => executePromQL(promql)}
            size="s"
            fill
            data-test-subj="metricsExploreExecuteButton"
          >
            {i18n.translate('explore.metricsExplore.execute', { defaultMessage: 'Execute' })}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="s" />
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} wrap>
        <EuiFlexItem grow={false}>
          <LabelFilterBar
            metric={state.metric}
            client={client}
            onAdd={(filter) => dispatch({ type: 'ADD_FILTER', filter })}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false} className="metricsExploreDetail__queryDivider">
          <EuiText size="xs">
            <strong>
              {i18n.translate('explore.metricsExplore.queryLabel', { defaultMessage: 'Query' })}
            </strong>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow>
          <EuiText size="xs" color="subdued" style={{ fontFamily: 'monospace' }}>
            {promql}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <LabelFilterBadges />
      <EuiSpacer size="s" />

      <EuiPanel paddingSize="m" hasBorder>
        {chartData.length ? (
          <SparklineChart
            values={chartData}
            height={200}
            label="value"
            isDarkMode={darkMode}
            onTimeRangeChange={onTimeRangeChange}
          />
        ) : (
          <EuiText size="s" color="subdued">
            {i18n.translate('explore.metricsExplore.noData', { defaultMessage: 'No data' })}
          </EuiText>
        )}
      </EuiPanel>

      {labels.length > 0 && (
        <>
          <EuiSpacer size="m" />
          <EuiFlexGroup
            alignItems="center"
            gutterSize="s"
            data-test-subj="metricsExploreBreakdownSection"
          >
            <EuiFlexItem grow={false}>
              <EuiText size="xs">
                <strong>
                  {i18n.translate('explore.metricsExplore.breakdownLabel', {
                    defaultMessage: 'Breakdown',
                  })}
                </strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ minWidth: 180 }}>
              <EuiComboBox
                placeholder={i18n.translate('explore.metricsExplore.allLabels', {
                  defaultMessage: 'All',
                })}
                singleSelection={{ asPlainText: true }}
                options={labelOptions}
                selectedOptions={selectedLabel}
                onChange={setSelectedLabel}
                isClearable
                compressed
              />
            </EuiFlexItem>
            <EuiFlexItem grow />
            <EuiFlexItem grow={false}>
              <EuiButtonGroup
                legend={i18n.translate('explore.metricsExplore.layoutLegend', {
                  defaultMessage: 'Layout',
                })}
                options={[
                  {
                    id: LayoutMode.GRID,
                    label: i18n.translate('explore.metricsExplore.layoutGrid', {
                      defaultMessage: 'Grid',
                    }),
                  },
                  {
                    id: LayoutMode.ROWS,
                    label: i18n.translate('explore.metricsExplore.layoutRows', {
                      defaultMessage: 'Rows',
                    }),
                  },
                ]}
                idSelected={state.layout}
                onChange={(id) => dispatch({ type: 'SET_LAYOUT', layout: id as LayoutMode })}
                buttonSize="compressed"
              />
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="m" />

          <div style={breakdownGridStyle(state.layout)}>
            {labelsToShow.map((l) => (
              <BreakdownPanel
                key={l.name}
                labelName={l.name}
                data={breakdowns.get(l.name) ?? null}
                selectedLabelName={selectedLabelName}
                breakdownYRange={breakdownYRange}
                layout={state.layout}
                metricType={metricType}
                onVisibilityChange={onVisibilityChange}
                onTimeRangeChange={onTimeRangeChange}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
};
