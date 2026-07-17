/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCode,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
  EuiText,
  EuiTextColor,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Dataset } from '../../../../../../data/common';
import { ExploreServices } from '../../../../types';
import { BrowsableItem, IndexClassification } from '../types';
import { deriveRowState, isDead, LogRowState } from '../row_state';
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
  /** Report the current batch (multi-select) action up to the page's toolbar button. */
  onBatchActionChange: (action: BatchAction | null) => void;
}

// Show the first 10 rows; each "Load more" reveals 10 more.
const INITIAL_PAGE_SIZE = 10;
const LOAD_MORE_STEP = 10;

// The fetch scheduler + results/errors maps are keyed by this, NOT the bare name: a dataset and a
// raw index can share a name (e.g. a `security-auditlog-2026.07.14` dataset AND index), and keying
// by name alone collides them onto one slot — one card then ends up with neither a result nor an
// error and hangs in LOADING. `kind:name` disambiguates them.
const cardKey = (item: Pick<BrowsableItem, 'kind' | 'name'>) => `${item.kind}:${item.name}`;

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
  const onTimeFieldChange = useCallback((key: string, field: string) => {
    setTimeFieldOverrides((prev) => ({ ...prev, [key]: field }));
    invalidateRef.current(key);
  }, []);

  const onToggleCheck = useCallback((name: string) => {
    setCheckedIndexes((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }, []);

  const clearSelection = useCallback(() => setCheckedIndexes([]), []);

  // Combined: datasets first, then indexes (already newest-first). De-dupe by name.
  const combined: BrowsableItem[] = useMemo(() => {
    const seen = new Set<string>();
    const out: BrowsableItem[] = [];
    [...datasets, ...indexItems].forEach((it) => {
      const key = cardKey(it);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(it);
      }
    });
    return out;
  }, [datasets, indexItems]);

  const visible = combined.slice(0, visibleCount);
  const hasNext = combined.length > visibleCount;

  // Metadata per card KEY (kind:name) → drives the viewport-gated fetch. Keyed by kind:name so a
  // same-named dataset + index don't overwrite each other's metadata (which would fetch the wrong
  // kind for one and hang the other).
  const metaRef = useRef<Map<string, BrowsableItem>>(new Map());
  useEffect(() => {
    const m = new Map<string, BrowsableItem>();
    combined.forEach((it) => m.set(cardKey(it), it));
    metaRef.current = m;
  }, [combined]);

  // Keep the latest overrides in a ref so fetchFn reads fresh values; overrideKey (below) drives
  // the actual re-query when they change.
  const timeFieldOverridesRef = useRef(timeFieldOverrides);
  timeFieldOverridesRef.current = timeFieldOverrides;

  // One fetch per visible card: raw lines + (for time-based) a severity-stacked histogram. The
  // scheduler key is `kind:name`; the actual index/pattern name is `item.name`.
  const fetchFn = useCallback(
    async (key: string, signal: AbortSignal): Promise<CombinedResult> => {
      const item = metaRef.current.get(key);
      if (!item) return { preview: undefined };
      const name = item.name;

      // Determine time field + severity field. Both indexes AND datasets classify (a dataset name
      // like `otel-*` is a valid field-caps wildcard) so the histogram can be severity-stacked — a
      // dataset carries its own timeFieldName, but the severity field must still be detected from its
      // fields. For indexes, classification supplies the time field too.
      let timeFieldName = item.timeFieldName;
      const classification = getCached(name) ?? (await classify(name));
      const severityField = classification.severityField;
      if (item.kind === 'index') {
        timeFieldName = classification.timeFieldName;
      }
      // A user-picked time field (multi-timestamp indexes) overrides the auto-selected one. Keyed by
      // the card key so a same-named dataset doesn't inherit an index's override.
      timeFieldName = timeFieldOverridesRef.current[key] ?? timeFieldName;

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
    // Cap parallel per-card fetches at 4: each time-based card issues two PPL queries (preview +
    // histogram agg), so a lower cap keeps the backend PPL endpoint predictable on larger clusters.
    // Queued cards show a skeleton until a slot frees up (viewport-gated, abort-on-scroll-away).
    4
  );
  // Expose invalidate to onTimeFieldChange (declared above useConcurrentQueries).
  invalidateRef.current = invalidate;

  const createDataset = useCreateDataset(services);
  const activateDataset = useActivateDataset(services);

  // Open an existing dataset in the Datasets management app (the "Manage" dataset utility action).
  const manageDataset = useCallback(
    (datasetId?: string) => {
      if (!datasetId) return;
      services.core.application.navigateToApp('datasets', {
        path: `/patterns/${datasetId}`,
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

  // Resolve each card's visual state (full vs. a compact variant) from what we know so far. Liveness
  // (histogram totals sum) is read from `results`, which arrives lazily per card — UNKNOWN cards
  // resolve to LOADING and stay in the primary list until their fetch lands.
  const rowStateFor = useCallback(
    (item: BrowsableItem): LogRowState => {
      const cached = item.kind === 'index' ? getCached(item.name) : undefined;
      const isNoTimeField =
        item.kind === 'index' && cached?.classification === IndexClassification.NO_TIME_FIELD;
      const key = cardKey(item);
      const result = results.get(key);
      const totalsSum = result?.histogram?.totals?.reduce(
        (s: number, t: { total: number }) => s + t.total,
        0
      );
      return deriveRowState({
        kind: item.kind,
        isNoTimeField,
        docsCount: item.docsCount,
        hasResult: !!result,
        hasError: !!errors.get(key),
        histogramTotalsSum: totalsSum,
        // Preview is time-bounded to the same window; its row count is the deterministic fallback
        // when the best-effort histogram didn't resolve.
        previewRowCount: result?.preview?.rows?.length,
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

  // The wildcard family a "Create dataset" over the current selection would use — shown in the
  // selection bar so the user previews the proposed dataset pattern. Only meaningful when the batch
  // action is a CREATE (i.e. the checked indexes are NOT all covered by one existing dataset — that
  // case is a Query, not a new dataset), so it's null otherwise.
  const proposedWildcard = useMemo(() => {
    if (checkedIndexes.length === 0) return null;
    const covers = checkedIndexes.map((n) => indexCoveredByAnyDataset(n, datasets));
    const allSameDataset =
      covers.every(Boolean) &&
      covers.every((c) => c && covers[0] && c.datasetId === covers[0]!.datasetId);
    return allSameDataset ? null : suggestWildcardFromNames(checkedIndexes);
  }, [checkedIndexes, datasets]);

  // A dataset over multiple indexes queries them with ONE time field, so warn when the selected
  // indexes share no common date field. Computed over the CLASSIFIED checked indexes only (their
  // fields are known) — indexes not yet classified are skipped so we never false-warn while their
  // classification is still pending. Needs ≥2 classified indexes with known date fields to conflict.
  const noCommonTimeField = useMemo(() => {
    // Each classified index's set of date fields (its own timeFieldName always included).
    const fieldSets = checkedIndexes
      .map((name) => {
        const cached = getCached(name);
        if (!cached) return undefined; // not classified yet → skip
        const fields = new Set<string>(cached.dateFields ?? []);
        if (cached.timeFieldName) fields.add(cached.timeFieldName);
        return fields;
      })
      .filter((s): s is Set<string> => !!s && s.size > 0);
    if (fieldSets.length < 2) return false; // need at least two known-field indexes to conflict
    // Intersect all field sets; empty intersection ⇒ no shared time field.
    const [first, ...rest] = fieldSets;
    const common = [...first].filter((f) => rest.every((s) => s.has(f)));
    return common.length === 0;
  }, [checkedIndexes, getCached]);

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
    // Classification is cached for BOTH kinds (datasets classify too, for severity detection). A
    // dataset's own timeFieldName still wins for time-based detection; the cached result supplies the
    // detected severity field (and, for indexes, the time/date fields).
    const cached = getCached(item.name);
    const isTimeBased =
      item.kind === 'dataset'
        ? Boolean(item.timeFieldName)
        : cached?.classification === IndexClassification.TIME_BASED;
    // Scheduler identity is kind:name, so a same-named dataset + index never share a result/error
    // slot (which previously left one card hung in LOADING).
    const key = cardKey(item);
    const combinedResult = results.get(key);
    const data: CardData = {
      preview: combinedResult?.preview,
      histogram: combinedResult?.histogram,
      error: errors.get(key),
      loading: !combinedResult && !errors.get(key),
    };
    const primary = resolvePrimary(item);
    // Empty-index name is non-actionable (creating a dataset over 0 docs is a trap).
    const onPrimary = state === LogRowState.EMPTY_INDEX ? undefined : primary.onClick;

    return (
      <LogStreamCard
        key={key}
        services={services}
        name={item.name}
        label={item.displayName}
        kind={item.kind}
        isRemote={item.isRemote}
        isTimeBased={isTimeBased}
        rowState={state}
        severityField={cached?.severityField}
        timeFieldName={timeFieldOverrides[key] ?? item.timeFieldName ?? cached?.timeFieldName}
        dateFields={cached?.dateFields}
        docsCount={item.docsCount}
        health={item.health}
        storeSize={item.storeSize}
        primaryShards={item.primaryShards}
        replicaCount={item.replicaCount}
        createdAt={item.createdAt}
        data={data}
        primaryLabel={primary.label}
        onPrimary={onPrimary}
        // Only raw indexes participate in selection; datasets are never checked (a same-named
        // dataset + index must not share checked state).
        checked={item.kind === 'index' && checkedIndexes.includes(item.name)}
        onToggleCheck={() => onToggleCheck(item.name)}
        // The scheduler is keyed by kind:name, so translate the card's per-name callbacks to the key.
        onVisibilityChange={(_name, isVisible) => onVisibilityChange(key, isVisible)}
        onBrushTime={onBrushTime}
        onTimeFieldChange={
          item.kind === 'index' ? (field) => onTimeFieldChange(key, field) : undefined
        }
        onManage={item.kind === 'dataset' ? () => manageDataset(item.datasetId) : undefined}
        onRetry={() => invalidateRef.current(key)}
      />
    );
  };

  const firstPrimaryIndexIdx = primaryRows.findIndex(({ item }) => item.kind === 'index');

  return (
    <div className="logsExploreRows" data-test-subj="logsExploreRowsView">
      {checkedIndexes.length > 0 && (
        <div className="logsExploreRows__selectionBar" data-test-subj="logsExploreSelectionBar">
          {/* Row 1: summary + proposed dataset + clear. Row 2: the removable index pills. */}
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false} wrap={false}>
            <EuiFlexItem grow={false}>
              <EuiText size="xs" className="logsExploreRows__selectionSummary">
                <strong>
                  {checkedIndexes.length === 1
                    ? i18n.translate('explore.logsDrilldown.rows.selectionCountOne', {
                        defaultMessage: '1 index selected',
                      })
                    : i18n.translate('explore.logsDrilldown.rows.selectionCount', {
                        defaultMessage: '{count} indexes selected',
                        values: { count: checkedIndexes.length },
                      })}
                </strong>
              </EuiText>
            </EuiFlexItem>
            {proposedWildcard && (
              <EuiFlexItem grow={false}>
                <EuiText size="xs">
                  <EuiTextColor color="subdued">
                    {i18n.translate('explore.logsDrilldown.rows.selectionWildcardLabel', {
                      defaultMessage: 'New dataset',
                    })}
                  </EuiTextColor>{' '}
                  <EuiCode
                    className="logsExploreRows__selectionWildcard"
                    data-test-subj="logsExploreSelectionWildcard"
                  >
                    {proposedWildcard}
                  </EuiCode>
                </EuiText>
              </EuiFlexItem>
            )}
            <EuiFlexItem grow={true} />
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="xs"
                iconType="cross"
                onClick={clearSelection}
                data-test-subj="logsExploreSelectionClear"
              >
                {i18n.translate('explore.logsDrilldown.rows.selectionClear', {
                  defaultMessage: 'Clear all',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
          {noCommonTimeField && (
            <EuiText
              size="xs"
              color="warning"
              className="logsExploreRows__selectionWarning"
              data-test-subj="logsExploreSelectionNoCommonTimeField"
            >
              <EuiIcon type="alert" size="s" />{' '}
              {i18n.translate('explore.logsDrilldown.rows.selectionNoCommonTimeField', {
                defaultMessage: 'No common time field across the selected indexes',
              })}
            </EuiText>
          )}
          <div className="logsExploreRows__selectionPills">
            {checkedIndexes.map((name) => (
              <EuiBadge
                key={name}
                color="hollow"
                iconType="cross"
                iconSide="right"
                iconOnClick={() => onToggleCheck(name)}
                iconOnClickAriaLabel={i18n.translate('explore.logsDrilldown.rows.selectionRemove', {
                  defaultMessage: 'Remove {name} from selection',
                  values: { name },
                })}
                data-test-subj={`logsExploreSelectionPill-${name}`}
              >
                {name}
              </EuiBadge>
            ))}
          </div>
        </div>
      )}

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
        <>
          <EuiSpacer size="m" />
          <EuiFlexGroup direction="column" alignItems="center" gutterSize="xs" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButton
                size="s"
                iconType="arrowDown"
                onClick={loadMore}
                data-test-subj="logsExploreRowsLoadMore"
              >
                {i18n.translate('explore.logsExplore.rows.loadMore', {
                  defaultMessage: 'Load more ({displayed} of {total})',
                  values: { displayed: visible.length, total: combined.length },
                })}
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="xs" color="subdued">
                {i18n.translate('explore.logsDrilldown.rows.loadMoreHint', {
                  defaultMessage: 'or narrow your search',
                })}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
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
