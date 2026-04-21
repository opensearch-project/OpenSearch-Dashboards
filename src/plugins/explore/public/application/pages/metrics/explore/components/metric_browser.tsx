/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonGroup,
  EuiSpacer,
  EuiButton,
  EuiTitle,
  EuiEmptyPrompt,
  EuiText,
  EuiButtonEmpty,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  MetricMetadata,
  MetricType,
  GroupingStrategy,
  SEARCH_DEBOUNCE_MS,
  LayoutMode,
  breakdownGridStyle,
} from '../types';
import { useExploration } from '../contexts/exploration_context';
import { MetricCard } from './metric_card';
import { LabelFilterBadges, LabelFilterPopover } from './label_filter_bar';
import { LoadingIndicator, ErrorCallout } from './loading_state';
import { useConcurrentQueries } from '../hooks/use_concurrent_queries';

const PAGE_SIZE = 20;

type SparklineMap = Map<string, Array<[number, string]>>;

function useSparklines(
  metadata: Record<string, MetricMetadata>,
  client: ReturnType<typeof useExploration>['client'],
  queryGen: ReturnType<typeof useExploration>['queryGen'],
  stepSec: number,
  filters: ReturnType<typeof useExploration>['state']['filters'],
  refreshCounter: number
) {
  const metadataRef = useRef(metadata);
  metadataRef.current = metadata;

  const fetchFn = useCallback(
    (name: string, signal: AbortSignal) => {
      const type = metadataRef.current[name]?.type || MetricType.UNKNOWN;
      const promql = queryGen.forSparkline(name, type, stepSec, filters);
      return client.queryRange(promql, signal).then((r) => r?.[0]?.values ?? []);
    },
    [client, queryGen, stepSec, filters]
  );

  const { results, onVisibilityChange } = useConcurrentQueries<Array<[number, string]>>(fetchFn, [
    client,
    filters,
    refreshCounter,
    metadata,
    stepSec,
  ]);

  return { sparklines: results as SparklineMap, onVisibilityChange };
}

export const MetricBrowser: React.FC = () => {
  const {
    state,
    dispatch,
    client,
    queryGen,
    stepSec,
    executePromQL,
    refreshCounter,
  } = useExploration();
  const [allMetrics, setAllMetrics] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, MetricMetadata>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [debouncedSearch, setDebouncedSearch] = useState(state.search);
  const [searchResults, setSearchResults] = useState<string[] | null>(null);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE * 2);
  const [labelNames, setLabelNames] = useState<string[]>([]);
  const [labelValues, setLabelValues] = useState<Record<string, Array<{ label: string }>>>({});
  const [activeName, setActiveName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    client
      .getLabelNames()
      .then(setLabelNames)
      .catch((e) => {
        if (e?.name !== 'AbortError') {
          // eslint-disable-next-line no-console
          console.debug('Failed to fetch label names', e);
        }
        setLabelNames(['job', 'instance']);
      });
  }, [client]);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedSearch(state.search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [state.search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    client
      .getMetricNames()
      .then((names) => {
        if (cancelled) return;
        setAllMetrics(names);
      })
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [client, refreshCounter]);

  // Fetch all metadata in a single bulk call when the client changes (datasource switch)
  useEffect(() => {
    let cancelled = false;
    client
      .getMetadata()
      .then((result) => {
        if (!cancelled) setMetadata(result);
      })
      .catch((e) => {
        if (e?.name !== 'AbortError') {
          // eslint-disable-next-line no-console
          console.debug('Failed to fetch metric metadata', e);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  // Backend search when debounced search term changes
  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    client
      .searchMetricNames(debouncedSearch)
      .then((names) => {
        if (!cancelled) setSearchResults(names);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, client]);

  const displayedMetrics = useMemo(() => {
    const metrics = searchResults ?? allMetrics;
    return metrics.slice(0, displayCount);
  }, [allMetrics, searchResults, displayCount]);

  const grouped = useMemo(() => {
    if (state.grouping === GroupingStrategy.ALPHABETICAL) {
      return { 'All Metrics': displayedMetrics };
    }
    const groups: Record<string, string[]> = {};
    for (const m of displayedMetrics) {
      const idx = m.indexOf('_');
      const prefix = idx > 0 ? m.substring(0, idx + 1) : 'other';
      (groups[prefix] = groups[prefix] || []).push(m);
    }
    return groups;
  }, [displayedMetrics, state.grouping]);

  const { sparklines, onVisibilityChange } = useSparklines(
    metadata,
    client,
    queryGen,
    stepSec,
    state.filters,
    refreshCounter
  );

  const handleSelectMetric = useCallback(
    (metric: string) => {
      dispatch({ type: 'SELECT_METRIC', metric });
    },
    [dispatch]
  );

  const toggleSelection = useCallback((metric: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(metric)) next.delete(metric);
      else next.add(metric);
      return next;
    });
  }, []);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorCallout error={error} />;
  }

  if (!allMetrics.length) {
    return (
      <EuiEmptyPrompt
        iconType="metricsApp"
        title={
          <h2>
            {i18n.translate('explore.metricsExplore.emptyTitle', {
              defaultMessage: 'Explore Your Metrics',
            })}
          </h2>
        }
        body={
          <EuiText>
            <p>
              {i18n.translate('explore.metricsExplore.emptyBody', {
                defaultMessage:
                  'Browse, search, and drill into Prometheus metrics without writing PromQL.',
              })}
            </p>
            <p>
              {i18n.translate('explore.metricsExplore.noMetricsFound', {
                defaultMessage: 'No metrics found. Ensure a Prometheus data source is configured.',
              })}
            </p>
          </EuiText>
        }
      />
    );
  }

  const groupingOptions = [
    {
      id: GroupingStrategy.ALPHABETICAL,
      label: i18n.translate('explore.metricsExplore.groupingAlphabetical', {
        defaultMessage: 'A-Z',
      }),
    },
    {
      id: GroupingStrategy.PREFIX,
      label: i18n.translate('explore.metricsExplore.groupingPrefix', { defaultMessage: 'Prefix' }),
    },
  ];

  const layoutOptions = [
    {
      id: LayoutMode.GRID,
      label: i18n.translate('explore.metricsExplore.layoutGrid', { defaultMessage: 'Grid' }),
    },
    {
      id: LayoutMode.ROWS,
      label: i18n.translate('explore.metricsExplore.layoutRows', { defaultMessage: 'Rows' }),
    },
  ];

  const totalMetrics = searchResults?.length ?? allMetrics.length;

  return (
    <>
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <LabelFilterPopover
            labelNames={labelNames}
            loadValues={(name) => {
              setActiveName(name);
              if (labelValues[name]) return;
              client.getLabelValues(name).then((vals) => {
                const sorted = vals.every((v) => v !== '' && !isNaN(Number(v)))
                  ? vals.sort((a, b) => Number(a) - Number(b))
                  : vals.sort();
                setLabelValues((prev) => ({
                  ...prev,
                  [name]: sorted.map((v) => ({ label: v })),
                }));
              });
            }}
            valueOptions={labelValues[activeName] || []}
            onAdd={(filter) => dispatch({ type: 'ADD_FILTER', filter })}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFieldSearch
            placeholder={i18n.translate('explore.metricsExplore.searchPlaceholder', {
              defaultMessage: 'Search metrics...',
            })}
            value={state.search}
            onChange={(e) => dispatch({ type: 'SET_SEARCH', search: e.target.value })}
            isClearable
            fullWidth
            compressed
            isLoading={isSearching || (!!state.search && state.search !== debouncedSearch)}
            aria-label={i18n.translate('explore.metricsExplore.searchAriaLabel', {
              defaultMessage: 'Search metrics',
            })}
            data-test-subj="metricsExploreSearchInput"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonGroup
            legend={i18n.translate('explore.metricsExplore.groupingLegend', {
              defaultMessage: 'Grouping',
            })}
            options={groupingOptions}
            idSelected={state.grouping}
            onChange={(id) => dispatch({ type: 'SET_GROUPING', grouping: id as GroupingStrategy })}
            buttonSize="compressed"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonGroup
            legend={i18n.translate('explore.metricsExplore.layoutLegend', {
              defaultMessage: 'Layout',
            })}
            options={layoutOptions}
            idSelected={state.layout}
            onChange={(id) => dispatch({ type: 'SET_LAYOUT', layout: id as LayoutMode })}
            buttonSize="compressed"
          />
        </EuiFlexItem>
        {selected.size > 0 && (
          <>
            <EuiFlexItem grow={false}>
              <EuiButton
                fill
                onClick={() => {
                  const queries = Array.from(selected).map((selName) => {
                    const type = metadata[selName]?.type || MetricType.GAUGE;
                    return queryGen.forMetric(selName, type, stepSec, state.filters);
                  });
                  const multiQuery = queries.map((q) => `${q};`).join('\n');
                  executePromQL(multiQuery);
                }}
                iconType="play"
                size="s"
              >
                {i18n.translate('explore.metricsExplore.executeSelected', {
                  defaultMessage: 'Execute ({count})',
                  values: { count: selected.size },
                })}
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty onClick={() => setSelected(new Set())} size="s">
                {i18n.translate('explore.metricsExplore.clearSelection', {
                  defaultMessage: 'Clear',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
          </>
        )}
      </EuiFlexGroup>

      <LabelFilterBadges />
      <EuiSpacer size="s" />

      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([group, metrics]) => (
          <div key={group}>
            <EuiTitle size="xxs">
              <h3>
                {group} ({metrics.length} of {totalMetrics.toLocaleString()} metrics)
              </h3>
            </EuiTitle>
            <EuiSpacer size="xs" />
            <div style={breakdownGridStyle(state.layout)}>
              {metrics.map((m, mi) => (
                <MetricCard
                  key={m}
                  name={m}
                  metadata={metadata[m]}
                  sparkline={sparklines.get(m) ?? null}
                  isSelected={selected.has(m)}
                  colorIndex={mi}
                  onToggleSelect={() => toggleSelection(m)}
                  onNavigate={() => handleSelectMetric(m)}
                  onVisibilityChange={onVisibilityChange}
                />
              ))}
            </div>
            <EuiSpacer size="m" />
          </div>
        ))}
      {displayCount < totalMetrics && (
        <>
          <EuiSpacer size="m" />
          <EuiFlexGroup justifyContent="center">
            <EuiFlexItem grow={false}>
              <EuiButton
                onClick={() => setDisplayCount((c) => c + PAGE_SIZE)}
                iconType="arrowDown"
                data-test-subj="metricsExploreLoadMoreButton"
              >
                {i18n.translate('explore.metricsExplore.loadMore', {
                  defaultMessage: 'Load more ({displayed} of {total})',
                  values: { displayed: displayCount, total: totalMetrics.toLocaleString() },
                })}
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}
    </>
  );
};
