/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EuiButton, EuiButtonEmpty, EuiEmptyPrompt, EuiText, EuiTextColor } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Dataset } from '../../../../../../data/common';
import { ExploreServices } from '../../../../types';
import { BrowsableItem, IndexClassification } from '../types';
import { deriveRowState, isDead, formatRangeLabel, LogRowState } from '../row_state';
import { useIndexList } from '../hooks/use_index_list';
import { useDatasetList } from '../hooks/use_dataset_list';
import { useConcurrentQueries } from '../../metrics/explore/hooks/use_concurrent_queries';
import { fetchPreview, DEFAULT_PREVIEW_SIZE } from '../hooks/fetch_preview';
import { fetchHistogram } from '../hooks/fetch_histogram';
import { useCreateDataset } from '../hooks/use_create_dataset';
import { useActivateDataset } from '../hooks/use_activate_dataset';
import { indexCoveredByAnyDataset } from '../dataset_coverage';
import { suggestWildcardFromName, suggestWildcardFromNames } from '../suggest_wildcard';
import { PreviewEmptyIllustration } from './preview_empty_illustration';
import { LogStreamCard, CardData } from './log_stream_card';

/** The batch action the toolbar button runs, reported up from RowsView (null = nothing selected). */
export interface BatchAction {
  count: number;
  label: string;
  pattern: string;
  onClick: () => void;
}

interface Props {
  services: ExploreServices;
  dataSourceId?: string;
  dataSource?: Dataset['dataSource'];
  search: string;
  /** Primitive that changes when the global time range changes; drives re-fetch of all cards. */
  refreshKey: string;
  /** Lazily classify an index (time-based? severity fields?) — from useIndexClassification. */
  classify: (
    name: string
  ) => Promise<{
    classification: IndexClassification;
    timeFieldName?: string;
    dateFields?: string[];
    severityField?: string;
  }>;
  getCached: (
    name: string
  ) =>
    | {
        classification: IndexClassification;
        timeFieldName?: string;
        dateFields?: string[];
        severityField?: string;
      }
    | undefined;
  /** Brush-select on any card's histogram → update the global time range. */
  onBrushTime: (from: number, to: number) => void;
  /** Selected-range bounds (epoch ms) → humanized label for "No events in the last {range}". */
  rangeFrom: number;
  rangeTo: number;
  /** Report the current batch (multi-select) action up to the page's toolbar button. */
  onBatchActionChange: (action: BatchAction | null) => void;
}

// Show the first 20 rows; each "Load more" reveals 10 more.
const INITIAL_PAGE_SIZE = 20;
const LOAD_MORE_STEP = 10;

interface CombinedResult {
  preview: any;
  histogram?: any;
}

/**
 * The Rows (Grafana-drilldown) layout: a full-width vertical stack of per-item cards — existing
 * datasets first, then raw indexes, newest-first, filtered by the shared search. Each visible card
 * lazily fetches its raw log lines + severity histogram (viewport-gated, ≤6 concurrent).
 */
export const RowsView: React.FC<Props> = ({
  services,
  dataSourceId,
  dataSource,
  search,
  refreshKey,
  classify,
  getCached,
  onBrushTime,
  rangeFrom,
  rangeTo,
  onBatchActionChange,
}) => {
  const { datasets } = useDatasetList({ services, dataSourceId, search });
  const { items: indexItems } = useIndexList({ services, dataSourceId, search });

  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);
  // Multi-select: checked INDEX names (only raw indexes are selectable for dataset creation).
  const [checkedIndexes, setCheckedIndexes] = useState<string[]>([]);
  // Per-index user overrides of the auto-picked time field (multi-timestamp indexes).
  const [timeFieldOverrides, setTimeFieldOverrides] = useState<Record<string, string>>({});
  // Whether the collapsed "no recent data" drawer is expanded.
  const [deadOpen, setDeadOpen] = useState(false);

  useEffect(() => setVisibleCount(INITIAL_PAGE_SIZE), [search, dataSourceId]);
  // Switching data source / search clears the selection (names differ per source).
  useEffect(() => setCheckedIndexes([]), [dataSourceId]);

  // Invalidate-one hook wired below (after useConcurrentQueries). Held in a ref so onTimeFieldChange
  // can call it without depending on hook-declaration order.
  const invalidateRef = useRef<(name: string) => void>(() => {});

  // Picking a different time field for ONE index re-fetches only that card: update its override,
  // then invalidate just that key. It must NOT reset the whole scheduler (which would refetch every
  // other index/dataset card) — fetchFn reads overrides from a ref, so its identity stays stable.
  const onTimeFieldChange = useCallback((name: string, field: string) => {
    setTimeFieldOverrides((prev) => ({ ...prev, [name]: field }));
    invalidateRef.current(name);
  }, []);

  const onToggleCheck = useCallback((name: string) => {
    setCheckedIndexes((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }, []);

  // Combined: datasets first, then indexes (already newest-first). De-dupe by name.
  const combined: BrowsableItem[] = useMemo(() => {
    const seen = new Set<string>();
    const out: BrowsableItem[] = [];
    [...datasets, ...indexItems].forEach((it) => {
      const key = `${it.kind}:${it.name}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(it);
      }
    });
    return out;
  }, [datasets, indexItems]);

  const visible = combined.slice(0, visibleCount);
  const hasNext = combined.length > visibleCount;

  // Metadata per card name → drives the viewport-gated fetch.
  const metaRef = useRef<Map<string, BrowsableItem>>(new Map());
  useEffect(() => {
    const m = new Map<string, BrowsableItem>();
    combined.forEach((it) => m.set(it.name, it));
    metaRef.current = m;
  }, [combined]);

  // Keep the latest overrides in a ref so fetchFn reads fresh values; overrideKey (below) drives
  // the actual re-query when they change.
  const timeFieldOverridesRef = useRef(timeFieldOverrides);
  timeFieldOverridesRef.current = timeFieldOverrides;

  // One fetch per visible card: raw lines + (for time-based) a severity-stacked histogram.
  const fetchFn = useCallback(
    async (name: string, signal: AbortSignal): Promise<CombinedResult> => {
      const item = metaRef.current.get(name);
      if (!item) return { preview: undefined };

      // Determine time field + severity field. Datasets carry timeFieldName; indexes classify.
      let timeFieldName = item.timeFieldName;
      let severityField: string | undefined;
      if (item.kind === 'index') {
        const result = getCached(name) ?? (await classify(name));
        timeFieldName = result.timeFieldName;
        severityField = result.severityField;
      }
      // A user-picked time field (multi-timestamp indexes) overrides the auto-selected one.
      timeFieldName = timeFieldOverridesRef.current[name] ?? timeFieldName;

      // Read the picked time range once; both the preview (log lines) and the histogram are bounded
      // to it so they stay consistent — no more "empty histogram but stale logs" for time-based
      // indexes with nothing in the window.
      const bounds = timeFieldName
        ? services.data.query.timefilter.timefilter.getBounds()
        : undefined;
      const from = bounds?.min?.valueOf() ?? Date.now() - 15 * 60 * 1000;
      const to = bounds?.max?.valueOf() ?? Date.now();

      const preview = await fetchPreview(
        services,
        {
          indexName: name,
          timeFieldName,
          dataSource,
          size: DEFAULT_PREVIEW_SIZE,
          // Only bound when this is a time-based index; non-time indexes have no field to filter on.
          ...(timeFieldName ? { from, to } : {}),
        },
        signal
      );

      let histogram;
      if (timeFieldName) {
        try {
          histogram = await fetchHistogram(
            services,
            {
              indexName: name,
              timeFieldName,
              severityField,
              dataSource,
              from,
              to,
            },
            signal
          );
        } catch {
          // Histogram is best-effort; the logs stream still renders.
        }
      }
      return { preview, histogram };
    },
    // refreshKey (time range) changes the fetchFn identity so the scheduler re-runs every card.
    // Per-card time-field picks are NOT in the deps: they're read from timeFieldOverridesRef and
    // refreshed one-at-a-time via invalidate(), so switching one card's field doesn't refetch all.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [services, dataSource, classify, getCached, refreshKey]
  );

  const { results, errors, onVisibilityChange, invalidate } = useConcurrentQueries<CombinedResult>(
    fetchFn,
    // refreshKey resets the scheduler on a time-range change; a time-field pick is handled per-card
    // via invalidate() instead of a dep so it doesn't churn every other card.
    [services, dataSource, search, refreshKey],
    6
  );
  // Expose invalidate to onTimeFieldChange (declared above useConcurrentQueries).
  invalidateRef.current = invalidate;

  const createDataset = useCreateDataset(services);
  const activateDataset = useActivateDataset(services);

  // Open an existing dataset in index-pattern management (the "Manage" dataset utility action).
  const manageDataset = useCallback(
    (datasetId?: string) => {
      if (!datasetId) return;
      services.core.application.navigateToApp('management', {
        path: `/opensearch-dashboards/indexPatterns/patterns/${datasetId}`,
      });
    },
    [services]
  );

  const loadMore = useCallback(() => setVisibleCount((c) => c + LOAD_MORE_STEP), []);

  // Resolve the single primary action + label + icon per item.
  const resolvePrimary = (item: BrowsableItem) => {
    if (item.kind === 'dataset') {
      return {
        label: i18n.translate('explore.logsExplore.rows.query', { defaultMessage: 'Query' }),
        icon: 'search',
        onClick: () =>
          activateDataset({
            title: item.name,
            datasetId: item.datasetId,
            timeFieldName: item.timeFieldName,
            dataSource,
          }),
      };
    }
    const covering = indexCoveredByAnyDataset(item.name, datasets);
    if (covering) {
      return {
        label: i18n.translate('explore.logsExplore.rows.query', { defaultMessage: 'Query' }),
        icon: 'search',
        onClick: () =>
          activateDataset({
            title: covering.name,
            datasetId: covering.datasetId,
            timeFieldName: covering.timeFieldName,
            dataSource,
          }),
      };
    }
    return {
      label: i18n.translate('explore.logsExplore.rows.createDataset', {
        defaultMessage: 'Create dataset',
      }),
      icon: 'plusInCircle',
      onClick: () =>
        // Seed the create flow with the wildcard-reduced family (app-svc-019 → app-svc-*), not the
        // raw index name. The advanced selector then resolves + shows the matching indexes so the
        // user can confirm/adjust before committing.
        createDataset({
          pattern: suggestWildcardFromName(item.name),
          dataSource,
        }),
    };
  };

  const rangeLabel = useMemo(() => formatRangeLabel(rangeFrom, rangeTo), [rangeFrom, rangeTo]);

  // Resolve each card's visual state (full vs. a compact variant) from what we know so far. Liveness
  // (histogram totals sum) is read from `results`, which arrives lazily per card — UNKNOWN cards
  // resolve to LOADING and stay in the primary list until their fetch lands.
  const rowStateFor = useCallback(
    (item: BrowsableItem): LogRowState => {
      const cached = item.kind === 'index' ? getCached(item.name) : undefined;
      const isNoTimeField =
        item.kind === 'index' && cached?.classification === IndexClassification.NO_TIME_FIELD;
      const result = results.get(item.name);
      const totalsSum = result?.histogram?.totals?.reduce(
        (s: number, t: { total: number }) => s + t.total,
        0
      );
      return deriveRowState({
        kind: item.kind,
        isNoTimeField,
        docsCount: item.docsCount,
        hasResult: !!result,
        hasError: !!errors.get(item.name),
        histogramTotalsSum: totalsSum,
      });
    },
    [getCached, results, errors]
  );

  // Partition the windowed slice: primary rows (datasets + live/loading/error indexes) stay in place;
  // resolved-dead rows (no recent data / empty index) demote into a collapsed drawer at the bottom.
  // Demotion is downward-only, so a card moves at most once → no scroll thrash (v1: plain memo).
  const { primaryRows, deadRows } = useMemo(() => {
    const primary: Array<{ item: BrowsableItem; state: LogRowState }> = [];
    const dead: Array<{ item: BrowsableItem; state: LogRowState }> = [];
    visible.forEach((item) => {
      const state = rowStateFor(item);
      (isDead(state) ? dead : primary).push({ item, state });
    });
    return { primaryRows: primary, deadRows: dead };
  }, [visible, rowStateFor]);

  // Report the batch (multi-select) action up to the toolbar button. Query only when EVERY checked
  // index resolves to the SAME covering dataset; otherwise Create dataset over the wildcard union.
  useEffect(() => {
    if (checkedIndexes.length === 0) {
      onBatchActionChange(null);
      return;
    }
    const covers = checkedIndexes.map((n) => indexCoveredByAnyDataset(n, datasets));
    const allSameDataset =
      covers.every(Boolean) &&
      covers.every((c) => c && covers[0] && c.datasetId === covers[0]!.datasetId);
    if (allSameDataset && covers[0]) {
      const ds = covers[0]!;
      onBatchActionChange({
        count: checkedIndexes.length,
        label: i18n.translate('explore.logsDrilldown.rows.queryCount', {
          defaultMessage: 'Query ({count})',
          values: { count: checkedIndexes.length },
        }),
        pattern: ds.name,
        onClick: () =>
          activateDataset({
            title: ds.name,
            datasetId: ds.datasetId,
            timeFieldName: ds.timeFieldName,
            dataSource,
          }),
      });
      return;
    }
    const pattern = suggestWildcardFromNames(checkedIndexes);
    onBatchActionChange({
      count: checkedIndexes.length,
      label: i18n.translate('explore.logsDrilldown.rows.createDatasetCount', {
        defaultMessage: 'Create dataset ({count})',
        values: { count: checkedIndexes.length },
      }),
      pattern,
      onClick: () => createDataset({ pattern, dataSource }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedIndexes, datasets, dataSource]);

  if (combined.length === 0) {
    // Search-with-no-match: a compact message. Genuinely empty (no data): a cool onboarding prompt
    // with the two primary paths.
    if (search) {
      return (
        <EuiText size="s" color="subdued" data-test-subj="logsExploreRowsEmpty">
          {i18n.translate('explore.logsDrilldown.rows.noMatch', {
            defaultMessage: 'No datasets or indexes match “{search}”.',
            values: { search },
          })}
        </EuiText>
      );
    }
    return (
      <EuiEmptyPrompt
        data-test-subj="logsExploreRowsEmpty"
        icon={<PreviewEmptyIllustration />}
        title={
          <h2>
            {i18n.translate('explore.logsDrilldown.empty.title', {
              defaultMessage: 'Start exploring your logs',
            })}
          </h2>
        }
        body={
          <p>
            {i18n.translate('explore.logsDrilldown.empty.body', {
              defaultMessage:
                'Create a dataset from your indexes to start querying, or drill into raw indexes to preview their logs first.',
            })}
          </p>
        }
        actions={[
          <EuiButton
            key="create"
            fill
            onClick={() => createDataset({ pattern: '', dataSource })}
            data-test-subj="logsExploreEmptyCreateDataset"
          >
            {i18n.translate('explore.logsDrilldown.empty.createDataset', {
              defaultMessage: 'Create dataset',
            })}
          </EuiButton>,
        ]}
      />
    );
  }

  // Render one card. Shared by the primary list and the dead drawer so both stay consistent.
  const renderCard = (item: BrowsableItem, state: LogRowState) => {
    const cached = item.kind === 'index' ? getCached(item.name) : undefined;
    const isTimeBased =
      item.kind === 'dataset'
        ? Boolean(item.timeFieldName)
        : cached?.classification === IndexClassification.TIME_BASED;
    const combinedResult = results.get(item.name);
    const data: CardData = {
      preview: combinedResult?.preview,
      histogram: combinedResult?.histogram,
      error: errors.get(item.name),
      loading: !combinedResult && !errors.get(item.name),
    };
    const primary = resolvePrimary(item);
    // Empty-index name is non-actionable (creating a dataset over 0 docs is a trap).
    const onPrimary = state === LogRowState.EMPTY_INDEX ? undefined : primary.onClick;

    return (
      <LogStreamCard
        key={`${item.kind}:${item.name}`}
        services={services}
        name={item.name}
        kind={item.kind}
        isRemote={item.isRemote}
        isTimeBased={isTimeBased}
        rowState={state}
        severityField={cached?.severityField}
        timeFieldName={timeFieldOverrides[item.name] ?? item.timeFieldName ?? cached?.timeFieldName}
        dateFields={cached?.dateFields}
        docsCount={item.docsCount}
        health={item.health}
        createdAt={item.createdAt}
        rangeLabel={rangeLabel}
        data={data}
        primaryLabel={primary.label}
        onPrimary={onPrimary}
        // Only raw indexes participate in selection; datasets are never checked (a same-named
        // dataset + index must not share checked state).
        checked={item.kind === 'index' && checkedIndexes.includes(item.name)}
        onToggleCheck={() => onToggleCheck(item.name)}
        onVisibilityChange={onVisibilityChange}
        onBrushTime={onBrushTime}
        onTimeFieldChange={
          item.kind === 'index' ? (field) => onTimeFieldChange(item.name, field) : undefined
        }
        onManage={item.kind === 'dataset' ? () => manageDataset(item.datasetId) : undefined}
        onRetry={() => invalidateRef.current(item.name)}
      />
    );
  };

  const firstPrimaryIndexIdx = primaryRows.findIndex(({ item }) => item.kind === 'index');

  return (
    <div className="logsExploreRows" data-test-subj="logsExploreRowsView">
      {primaryRows.map(({ item, state }, i) => (
        <React.Fragment key={`${item.kind}:${item.name}`}>
          {i === 0 && item.kind === 'dataset' && (
            <SectionLabel
              label={i18n.translate('explore.logsDrilldown.rows.datasetsSection', {
                defaultMessage: 'Datasets',
              })}
            />
          )}
          {i === firstPrimaryIndexIdx && (
            <SectionLabel
              label={i18n.translate('explore.logsDrilldown.rows.indexesSection', {
                defaultMessage: 'Indexes',
              })}
            />
          )}
          {renderCard(item, state)}
        </React.Fragment>
      ))}

      {deadRows.length > 0 && (
        <div className="logsExploreRows__deadGroup" data-test-subj="logsExploreDeadGroup">
          <EuiButtonEmpty
            size="s"
            iconType={deadOpen ? 'arrowDown' : 'arrowRight'}
            onClick={() => setDeadOpen((o) => !o)}
            data-test-subj="logsExploreDeadGroupToggle"
          >
            {i18n.translate('explore.logsDrilldown.rows.deadGroup', {
              defaultMessage: '{count} indexes with no recent data',
              values: { count: deadRows.length },
            })}
          </EuiButtonEmpty>
          {deadOpen && deadRows.map(({ item, state }) => renderCard(item, state))}
        </div>
      )}

      {hasNext && (
        <EuiButtonEmpty size="s" onClick={loadMore} data-test-subj="logsExploreRowsLoadMore">
          {i18n.translate('explore.logsExplore.rows.loadMore', { defaultMessage: 'Load more' })}
        </EuiButtonEmpty>
      )}
    </div>
  );
};

// Section eyebrow (Datasets / Indexes). No divider line between groups (#6) — the header is enough.
const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <EuiText size="xs" className="logsExploreRows__section">
    <EuiTextColor color="subdued">
      <strong>{label}</strong>
    </EuiTextColor>
  </EuiText>
);
