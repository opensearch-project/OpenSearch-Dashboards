/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EuiButton,
  EuiButtonGroup,
  EuiCallOut,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import rison from 'rison-node';
import { PLUGIN_ID, ExploreFlavor } from '../../../../../common';
import { datasetTypeRequiresExplicitRun } from '../../../../../../data/common';
import { getSourceTypeRegistry } from '../../../../services/source_type_registry';
import type {
  SourceTypeLogsDrilldownItem,
  SourceTypeLogsDrilldownItemUnavailable,
  SourceTypeLogsDrilldownScope,
} from '../../../../services/source_type_registry';
import { ExploreServices } from '../../../../types';
import { useConcurrentQueries } from '../../../utils/hooks/use_concurrent_queries';
import { AUTO_RUN_CONCURRENCY, SOURCE_LIST_MAX_ITEMS } from '../constants';
import { runSourceCard, SourceCardResult } from '../hooks/source_queries';
import { useExplicitRuns } from '../hooks/use_explicit_runs';
import { useSourceItems } from '../hooks/use_source_items';
import { stableKey } from '../stable_key';
import { DrilldownSourceType, SourceBatchAction, SourceGrouping } from '../types';
import { SourceItemCard } from './source_item_card';

/** No marks learned from failed queries (a stable empty map). */
const NO_LEARNED_UNAVAILABLE: ReadonlyMap<string, SourceTypeLogsDrilldownItemUnavailable> =
  new Map();

interface Props {
  services: ExploreServices;
  sourceType: DrilldownSourceType;
  scope: SourceTypeLogsDrilldownScope;
  search: string;
  /** Changes with the time range and on Refresh. */
  refreshKey: string;
  /** Changes on the page's Refresh button only: lists the items again. */
  listRefreshKey?: number;
  onBrushTime: (from: number, to: number) => void;
  onBatchActionChange: (action: SourceBatchAction | null) => void;
}

/** A source's `groupOf`, which is third-party code: a throw puts the item in no group. */
const groupOfSafely = (
  groupOf: (item: SourceTypeLogsDrilldownItem) => string,
  item: SourceTypeLogsDrilldownItem
): string => {
  try {
    return groupOf(item) || '';
  } catch {
    return '';
  }
};

/**
 * A registered source's items on the Explore logs page. Lists them through the source (free), and
 * runs each card's preview and histogram, through the item's dataset and the data plugin's search
 * service, either when the user presses its Run button (a source whose dataset type requires an
 * explicit run) or as it scrolls into view. The selected items open as one dataset on the Logs page.
 */
export const SourceRowsView: React.FC<Props> = ({
  services,
  sourceType,
  scope,
  search,
  refreshKey,
  listRefreshKey = 0,
  onBrushTime,
  onBatchActionChange,
}) => {
  const drilldown = sourceType.logsDrilldown;
  // The source's name on the Logs flavor, with the registry's overrides (as the Source picker).
  const sourceLabel = useMemo(() => {
    try {
      return getSourceTypeRegistry().getLabel(sourceType, ExploreFlavor.Logs);
    } catch {
      return sourceType.label;
    }
  }, [sourceType]);
  const {
    items: listedItems,
    nextToken,
    loading,
    loadingMore,
    capped,
    error,
    errorCause,
    errorFrom,
    loadMore,
    retry,
  } = useSourceItems(drilldown, scope, search, listRefreshKey);
  // Key-sorted, like the URL keeps it: a scope read back from `_a` is the same scope.
  const scopeKey = stableKey(scope);
  // The list on the page: its scope, search and Refresh count.
  const listKey = `${scopeKey}\n${search}\n${listRefreshKey}`;
  const listKeyRef = useRef(listKey);
  listKeyRef.current = listKey;

  // Items a card's failed query showed can't be queried now (the source's `unavailableFor`). They
  // show and count as listed `unavailable` until the items are listed again: the marks keep the
  // list they were learned for, and any other list ignores them from its first render.
  const [learned, setLearned] = useState<{
    listKey: string;
    items: ReadonlyMap<string, SourceTypeLogsDrilldownItemUnavailable>;
  }>(() => ({ listKey, items: NO_LEARNED_UNAVAILABLE }));
  const learnedUnavailable = learned.listKey === listKey ? learned.items : NO_LEARNED_UNAVAILABLE;
  const items = useMemo(
    () =>
      learnedUnavailable.size === 0
        ? listedItems
        : listedItems.map((item) => {
            const unavailable = item.unavailable ? undefined : learnedUnavailable.get(item.id);
            return unavailable ? { ...item, unavailable } : item;
          }),
    [listedItems, learnedUnavailable]
  );

  // The source's dataset types decide whether its queries wait for the user, as on the Logs page.
  // A type that isn't registered (yet) is read as waiting: its queries may be billed, so the page
  // never runs them on its own without knowing.
  const explicitRun = useMemo(
    () =>
      sourceType.datasetTypes.some((type) => {
        let typeConfig;
        try {
          typeConfig = services.data.query.queryString.getDatasetService().getType(type);
        } catch {
          typeConfig = undefined;
        }
        return !typeConfig || datasetTypeRequiresExplicitRun(typeConfig, { type });
      }),
    [sourceType, services.data.query.queryString]
  );

  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const itemsRef = useRef(itemsById);
  itemsRef.current = itemsById;
  const refreshKeyRef = useRef(refreshKey);
  refreshKeyRef.current = refreshKey;

  const fetchFn = useCallback(
    async (key: string, signal: AbortSignal): Promise<SourceCardResult> => {
      const item = itemsRef.current.get(key);
      if (!item) throw new Error(`Unknown item ${key}`);
      // An item the source marks unavailable never queries (its card says why instead).
      if (item.unavailable) throw new Error(item.unavailable.title);
      const bounds = services.data.query.timefilter.timefilter.getBounds();
      const startedFor = listKeyRef.current;
      try {
        return await runSourceCard({
          services,
          drilldown,
          datasetTypes: sourceType.datasetTypes,
          scope,
          item,
          from: bounds.min?.valueOf() ?? Date.now() - 15 * 60 * 1000,
          to: bounds.max?.valueOf() ?? Date.now(),
          ranWith: refreshKeyRef.current,
          signal,
        });
      } catch (cause) {
        // The source may say the failure means the item can't be queried now (e.g. its query was
        // refused): the card then shows that instead of the error. Anything else shows as is. Not
        // for a stopped query, nor for one that started on another list (the scope, the search or
        // a Refresh changed since): its item may not be this list's.
        if (!signal.aborted && drilldown.unavailableFor && listKeyRef.current === startedFor) {
          let unavailable: SourceTypeLogsDrilldownItemUnavailable | undefined;
          try {
            unavailable = drilldown.unavailableFor({ scope, item, error: cause });
          } catch (sourceError) {
            // The card shows the query's error; say why the source's answer is missing.
            // eslint-disable-next-line no-console
            console.error(
              "Explore logs page: a source's unavailableFor failed; showing the query's error",
              sourceError
            );
            unavailable = undefined;
          }
          if (unavailable) {
            const marked = unavailable;
            setLearned((prev) => ({
              listKey: startedFor,
              items: new Map(prev.listKey === startedFor ? prev.items : []).set(key, marked),
            }));
          }
        }
        throw cause;
      }
    },
    // `scopeKey` stands for `scope`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drilldown, scopeKey, services, sourceType.datasetTypes]
  );

  // A source that runs on its own runs cards as they scroll into view, and again on every time
  // range change, like OpenSearch's cards. One that waits for the user runs a card only on its Run
  // button and keeps the result when the time range changes (the card then shows as stale). The
  // viewport scheduler is never fed on such a source, so it never runs anything for it.
  const auto = useConcurrentQueries<SourceCardResult>(
    fetchFn,
    [drilldown, scopeKey, search, refreshKey],
    AUTO_RUN_CONCURRENCY
  );
  // Runs are kept for the scope: a search that hides a run card and shows it again keeps what was
  // paid for. They go when the scope (or the source) changes.
  const explicit = useExplicitRuns<SourceCardResult>(fetchFn, scopeKey);

  const cardState = (key: string) => {
    if (explicitRun) {
      const run = explicit.runs.get(key);
      return { result: run?.result, error: run?.error, loading: !!run?.running };
    }
    const result = auto.results.get(key);
    const runError = auto.errors.get(key);
    return { result, error: runError, loading: !result && !runError };
  };

  // Stable per-item callbacks for the memoized cards.
  const explicitRunRef = useRef(explicitRun);
  explicitRunRef.current = explicitRun;
  const autoRef = useRef(auto);
  autoRef.current = auto;
  const explicitRef = useRef(explicit);
  explicitRef.current = explicit;
  const onRun = useCallback((itemId: string) => {
    if (itemsRef.current.get(itemId)?.unavailable) return;
    if (explicitRunRef.current) explicitRef.current.run(itemId);
    else autoRef.current.invalidate(itemId);
  }, []);
  const onStop = useCallback((itemId: string) => explicitRef.current.stop(itemId), []);
  // An unavailable item counts as out of view, so a source that runs on its own never runs it.
  const onVisibilityChange = useCallback((itemId: string, visible: boolean) => {
    if (!explicitRunRef.current) {
      const unavailable = !!itemsRef.current.get(itemId)?.unavailable;
      autoRef.current.onVisibilityChange(itemId, visible && !unavailable);
    }
  }, []);

  // The ticked items themselves (not only their ids), so a tick a search hides still counts and
  // still opens: the button and the handoff mean every ticked item that can be opened. Cleared on
  // a scope change. Never more than the source's `maxSelection`, whatever the checkboxes allow.
  const [checked, setChecked] = useState<Map<string, SourceTypeLogsDrilldownItem>>(new Map());
  useEffect(() => setChecked(new Map()), [scopeKey]);
  const maxSelection = drilldown.maxSelection;
  const toggleChecked = useCallback(
    (item: SourceTypeLogsDrilldownItem) => {
      setChecked((prev) => {
        if (prev.has(item.id)) {
          const next = new Map(prev);
          next.delete(item.id);
          return next;
        }
        // An unavailable item can't be newly ticked (one ticked before can still be unticked).
        if (item.unavailable) return prev;
        if (maxSelection !== undefined && prev.size >= maxSelection) return prev;
        return new Map(prev).set(item.id, item);
      });
    },
    [maxSelection]
  );

  const toasts = services.notifications.toasts;
  const [opening, setOpening] = useState(false);
  const openingRef = useRef(false);
  const openInLogs = useCallback(
    async (selected: SourceTypeLogsDrilldownItem[]) => {
      // One open at a time: a second click while one is opening does nothing.
      if (openingRef.current) return;
      openingRef.current = true;
      setOpening(true);
      try {
        const limited =
          maxSelection === undefined ? selected : selected.slice(0, Math.max(maxSelection, 0));
        const dataset = await drilldown.toDataset({ scope, items: limited });
        if (!dataset || !sourceType.datasetTypes.includes(dataset.type)) {
          throw new Error(
            i18n.translate('explore.logsDrilldown.source.wrongDatasetType', {
              defaultMessage: 'The source returned a dataset of another type ({type}).',
              values: { type: dataset?.type ?? '' },
            })
          );
        }
        const datasetService = services.data.query.queryString.getDatasetService();
        try {
          await datasetService.cacheDataset(
            dataset,
            {
              uiSettings: services.uiSettings,
              savedObjects: services.savedObjects,
              notifications: services.notifications,
              http: services.http,
              data: services.data,
            },
            false
          );
        } catch (cacheError) {
          // The Logs page can still resolve the dataset through its type, but say what happened
          // in case it can't.
          toasts.addWarning({
            title: i18n.translate('explore.logsDrilldown.source.cacheFailed', {
              defaultMessage: "The selection's fields couldn't be loaded",
            }),
            text: cacheError instanceof Error ? cacheError.message : String(cacheError),
          });
        }
        const query = services.data.query.queryString.getInitialQueryByDataset(dataset);
        services.data.query.queryString.setQuery(query);
        // The Logs page takes its dataset from the URL's `_q` before the shared query state, so a
        // bare `#/` would reopen whatever `_q` it last had. Name the dataset in the URL instead.
        const urlQuery = {
          dataset,
          language: query.language,
          query: typeof query.query === 'string' ? query.query : '',
        };
        services.core.application.navigateToApp(`${PLUGIN_ID}/${ExploreFlavor.Logs}`, {
          path: `#/?_q=${encodeURIComponent(rison.encode(urlQuery as Record<string, any>))}`,
        });
      } catch (e) {
        toasts.addDanger({
          title: i18n.translate('explore.logsDrilldown.source.openFailed', {
            defaultMessage: 'Could not open the selection in Logs',
          }),
          text: e instanceof Error ? e.message : String(e),
        });
      } finally {
        openingRef.current = false;
        setOpening(false);
      }
    },
    // `scopeKey` stands for `scope`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drilldown, scopeKey, services, sourceType.datasetTypes, maxSelection, toasts]
  );

  // The source's `maxSelection` caps how many items one dataset can hold: at the limit, unticked
  // cards can't be ticked.
  const selectionFull =
    maxSelection !== undefined && checked.size >= maxSelection
      ? i18n.translate('explore.logsDrilldown.source.selectionFull', {
          defaultMessage: 'You can open at most {max} at once.',
          values: { max: maxSelection },
        })
      : undefined;

  // The toolbar button: open the selected items in Logs. A ticked item that has since become
  // unavailable (a Refresh listed it so, or its query failed and the source said so) stays ticked,
  // so it can be unticked, but isn't opened: the Logs page would run the query the source says
  // fails. With none left to open, there's no action (the button is disabled).
  useEffect(() => {
    const openable = Array.from(checked.values()).filter(
      (item) => !(itemsById.get(item.id) ?? item).unavailable
    );
    onBatchActionChange(
      openable.length
        ? {
            label: i18n.translate('explore.logsDrilldown.source.openInLogs', {
              defaultMessage: 'Open {count, plural, one {# item} other {# items}} in Logs',
              values: { count: openable.length },
            }),
            onClick: () => {
              openInLogs(openable);
            },
            isLoading: opening,
          }
        : null
    );
  }, [checked, itemsById, openInLogs, onBatchActionChange, opening]);
  useEffect(() => () => onBatchActionChange(null), [onBatchActionChange]);

  const [grouping, setGrouping] = useState<SourceGrouping>(SourceGrouping.ALPHABETICAL);
  const groups = useMemo((): Array<[string, SourceTypeLogsDrilldownItem[]]> => {
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
    if (grouping !== SourceGrouping.PREFIX || !drilldown.groupOf) return [['', sorted]];
    const byGroup = new Map<string, SourceTypeLogsDrilldownItem[]>();
    for (const item of sorted) {
      const group = groupOfSafely(drilldown.groupOf, item);
      let members = byGroup.get(group);
      if (!members) byGroup.set(group, (members = []));
      members.push(item);
    }
    return Array.from(byGroup.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items, grouping, drilldown]);

  if (loading) {
    return (
      <EuiFlexGroup justifyContent="center" data-test-subj="logsDrilldownSourceLoading">
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size="l" />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  // The source's own empty state, wrapping the page's: nothing listed, or the listing failed.
  const withEmptyState = (pageState: React.ReactElement, cause?: unknown) =>
    drilldown.EmptyState ? (
      <drilldown.EmptyState scope={scope} search={search} error={cause} onRefresh={retry}>
        {pageState}
      </drilldown.EmptyState>
    ) : (
      pageState
    );

  if (error && items.length === 0) {
    return withEmptyState(
      <EuiCallOut
        color="danger"
        iconType="alert"
        title={i18n.translate('explore.logsDrilldown.source.listFailed', {
          defaultMessage: 'Could not list {source}',
          values: { source: sourceLabel },
        })}
        data-test-subj="logsDrilldownSourceListError"
      >
        <p>{error}</p>
        <EuiButton size="s" onClick={retry}>
          {i18n.translate('explore.logsDrilldown.source.retry', { defaultMessage: 'Retry' })}
        </EuiButton>
      </EuiCallOut>,
      errorCause
    );
  }

  if (items.length === 0) {
    return withEmptyState(
      <EuiEmptyPrompt
        iconType="search"
        data-test-subj="logsDrilldownSourceEmpty"
        title={
          <h2>
            {i18n.translate('explore.logsDrilldown.source.empty', {
              defaultMessage: 'Nothing to show',
            })}
          </h2>
        }
        body={
          <p>
            {search
              ? i18n.translate('explore.logsDrilldown.source.emptySearch', {
                  defaultMessage: 'Nothing matches "{search}" here.',
                  values: { search },
                })
              : i18n.translate('explore.logsDrilldown.source.emptyScope', {
                  defaultMessage: '{source} has nothing to show for this selection.',
                  values: { source: sourceLabel },
                })}
          </p>
        }
      />
    );
  }

  return (
    <div data-test-subj="logsDrilldownSourceRows">
      <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
        <EuiFlexItem>
          {explicitRun && (
            <EuiText size="xs" color="subdued" data-test-subj="logsDrilldownSourceExplicitRun">
              {i18n.translate('explore.logsDrilldown.source.explicitRunHint', {
                defaultMessage:
                  'Queries on {source} run only when you ask: press Run on a card to load it.',
                values: { source: sourceLabel },
              })}
            </EuiText>
          )}
        </EuiFlexItem>
        {drilldown.groupOf && (
          <EuiFlexItem grow={false}>
            <EuiButtonGroup
              legend={i18n.translate('explore.logsDrilldown.source.groupingLegend', {
                defaultMessage: 'Grouping',
              })}
              buttonSize="compressed"
              options={[
                {
                  id: SourceGrouping.ALPHABETICAL,
                  label: i18n.translate('explore.logsDrilldown.source.groupingAlphabetical', {
                    defaultMessage: 'A-Z',
                  }),
                },
                {
                  id: SourceGrouping.PREFIX,
                  label: i18n.translate('explore.logsDrilldown.source.groupingPrefix', {
                    defaultMessage: 'Prefix',
                  }),
                },
              ]}
              idSelected={grouping}
              onChange={(id) => setGrouping(id as SourceGrouping)}
              data-test-subj="logsDrilldownSourceGrouping"
            />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      <EuiSpacer size="s" />
      {groups.map(([group, groupItems]) => (
        <div key={group || '_all'}>
          {group && (
            <>
              <EuiTitle size="xxs">
                <h3>
                  {i18n.translate('explore.logsDrilldown.source.groupTitle', {
                    defaultMessage: '{group} ({count})',
                    values: { group, count: groupItems.length },
                  })}
                </h3>
              </EuiTitle>
              <EuiSpacer size="xs" />
            </>
          )}
          {groupItems.map((item) => {
            const { result, error: cardError, loading: cardLoading } = cardState(item.id);
            return (
              <React.Fragment key={item.id}>
                <SourceItemCard
                  services={services}
                  item={item}
                  icon={sourceType.icon}
                  hasHistogram={!!drilldown.buildHistogramQuery}
                  explicitRun={explicitRun}
                  result={result}
                  error={cardError}
                  loading={cardLoading}
                  stale={explicitRun && !!result && result.ranWith !== refreshKey}
                  checked={checked.has(item.id)}
                  checkDisabledReason={selectionFull}
                  onToggleCheck={toggleChecked}
                  onRun={onRun}
                  onStop={onStop}
                  onVisibilityChange={onVisibilityChange}
                  onBrushTime={onBrushTime}
                />
                <EuiSpacer size="s" />
              </React.Fragment>
            );
          })}
        </div>
      ))}
      {error && (
        <EuiCallOut size="s" color="danger" iconType="alert" title={error}>
          {/* Retry what failed: a "Load more", or a refresh of the list. */}
          <EuiButton size="s" onClick={errorFrom === 'more' ? loadMore : retry}>
            {i18n.translate('explore.logsDrilldown.source.retry', { defaultMessage: 'Retry' })}
          </EuiButton>
        </EuiCallOut>
      )}
      {capped && (
        <EuiCallOut
          size="s"
          iconType="iInCircle"
          data-test-subj="logsDrilldownSourceCapped"
          title={i18n.translate('explore.logsDrilldown.source.capped', {
            defaultMessage: 'Showing the first {max}. Search to narrow the list and find the rest.',
            values: { max: SOURCE_LIST_MAX_ITEMS },
          })}
        />
      )}
      {nextToken && !error && (
        <EuiFlexGroup justifyContent="center">
          <EuiFlexItem grow={false}>
            <EuiButton
              onClick={loadMore}
              isLoading={loadingMore}
              iconType="arrowDown"
              data-test-subj="logsDrilldownSourceLoadMore"
            >
              {i18n.translate('explore.logsDrilldown.source.loadMore', {
                defaultMessage: 'Load more ({count} shown)',
                values: { count: items.length },
              })}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
    </div>
  );
};
