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
import type {
  SourceTypeDefinition,
  SourceTypeLogsDrilldown,
  SourceTypeLogsDrilldownItem,
  SourceTypeLogsDrilldownScope,
} from '../../../../services/source_type_registry';
import { ExploreServices } from '../../../../types';
import { useConcurrentQueries } from '../../metrics/explore/hooks/use_concurrent_queries';
import { datasetTypeRequiresExplicitRun } from '../../../../../../data/common';
import { runSourceCard, SourceCardResult } from '../hooks/source_queries';
import { useExplicitRuns } from '../hooks/use_explicit_runs';
import { useSourceItems } from '../hooks/use_source_items';
import { SourceItemCard } from './source_item_card';

/** Cards running at once on a source that runs them as they scroll into view. */
const AUTO_RUN_CONCURRENCY = 4;

/** The page toolbar's action for the selected items. */
export interface SourceBatchAction {
  label: string;
  onClick: () => void;
}

enum Grouping {
  ALPHABETICAL = 'alphabetical',
  PREFIX = 'prefix',
}

interface Props {
  services: ExploreServices;
  sourceType: SourceTypeDefinition & { logsDrilldown: SourceTypeLogsDrilldown };
  scope: SourceTypeLogsDrilldownScope;
  search: string;
  /** Changes with the time range and on Refresh. */
  refreshKey: string;
  onBrushTime: (from: number, to: number) => void;
  onBatchActionChange: (action: SourceBatchAction | null) => void;
}

/**
 * A registered source's items on the Explore logs page. Lists them through the source (free), and
 * runs each card's preview and histogram either when the user presses its Run button (a source
 * whose dataset type requires an explicit run) or as it scrolls into view. The selected items open
 * as one dataset on the Logs page.
 */
export const SourceRowsView: React.FC<Props> = ({
  services,
  sourceType,
  scope,
  search,
  refreshKey,
  onBrushTime,
  onBatchActionChange,
}) => {
  const drilldown = sourceType.logsDrilldown;
  const { items, nextToken, loading, loadingMore, error, errorCause, loadMore, retry } =
    useSourceItems(drilldown, scope, search, refreshKey);

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
  const scopeKey = JSON.stringify(scope);

  const fetchFn = useCallback(
    async (key: string, signal: AbortSignal): Promise<SourceCardResult> => {
      const item = itemsRef.current.get(key);
      if (!item) throw new Error(`Unknown item ${key}`);
      const bounds = services.data.query.timefilter.timefilter.getBounds();
      return runSourceCard({
        drilldown,
        scope,
        item,
        from: bounds.min?.valueOf() ?? Date.now() - 15 * 60 * 1000,
        to: bounds.max?.valueOf() ?? Date.now(),
        ranWith: refreshKeyRef.current,
        signal,
      });
    },
    // `scopeKey` stands for `scope`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drilldown, scopeKey, services.data.query.timefilter.timefilter]
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

  // The ticked items themselves (not only their ids), so a tick a search hides still counts and
  // still opens: the button and the handoff always mean every ticked item. Cleared on a scope change.
  const [checked, setChecked] = useState<Map<string, SourceTypeLogsDrilldownItem>>(new Map());
  useEffect(() => setChecked(new Map()), [scopeKey]);
  const toggleChecked = useCallback((item: SourceTypeLogsDrilldownItem) => {
    setChecked((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.set(item.id, item);
      return next;
    });
  }, []);

  const openInLogs = useCallback(
    async (selected: SourceTypeLogsDrilldownItem[]) => {
      try {
        const dataset = await drilldown.toDataset({ scope, items: selected });
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
        } catch {
          // Non-fatal: the Logs page resolves the dataset through its type.
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
        services.notifications.toasts.addDanger({
          title: i18n.translate('explore.logsDrilldown.source.openFailed', {
            defaultMessage: 'Could not open the selection in Logs',
          }),
          text: e instanceof Error ? e.message : String(e),
        });
      }
    },
    // `scopeKey` stands for `scope`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drilldown, scopeKey, services]
  );

  // The source's limit on one dataset: past it, unticked cards can't be ticked (as the Logs page's
  // log group selector stops at its limit).
  const selectionFull =
    drilldown.maxSelection !== undefined && checked.size >= drilldown.maxSelection
      ? i18n.translate('explore.logsDrilldown.source.selectionFull', {
          defaultMessage: 'You can open at most {max} at once.',
          values: { max: drilldown.maxSelection },
        })
      : undefined;

  // The toolbar button: open the selected items in Logs.
  useEffect(() => {
    const selected = Array.from(checked.values());
    onBatchActionChange(
      selected.length
        ? {
            label: i18n.translate('explore.logsDrilldown.source.openInLogs', {
              defaultMessage: 'Open {count, plural, one {# item} other {# items}} in Logs',
              values: { count: selected.length },
            }),
            onClick: () => {
              openInLogs(selected);
            },
          }
        : null
    );
  }, [checked, openInLogs, onBatchActionChange]);
  useEffect(() => () => onBatchActionChange(null), [onBatchActionChange]);

  const [grouping, setGrouping] = useState<Grouping>(Grouping.ALPHABETICAL);
  const groups = useMemo((): Array<[string, SourceTypeLogsDrilldownItem[]]> => {
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
    if (grouping !== Grouping.PREFIX || !drilldown.groupOf) return [['', sorted]];
    const byGroup = new Map<string, SourceTypeLogsDrilldownItem[]>();
    for (const item of sorted) {
      const group = drilldown.groupOf(item) || '';
      byGroup.set(group, [...(byGroup.get(group) ?? []), item]);
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
          values: { source: sourceType.label },
        })}
        data-test-subj="logsDrilldownSourceListError"
      >
        <p>{error}</p>
        <EuiButton size="s" onClick={retry}>
          {i18n.translate('explore.logsDrilldown.source.listRetry', { defaultMessage: 'Retry' })}
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
                  values: { source: sourceType.label },
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
                values: { source: sourceType.label },
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
                  id: Grouping.ALPHABETICAL,
                  label: i18n.translate('explore.logsDrilldown.source.groupingAlphabetical', {
                    defaultMessage: 'A-Z',
                  }),
                },
                {
                  id: Grouping.PREFIX,
                  label: i18n.translate('explore.logsDrilldown.source.groupingPrefix', {
                    defaultMessage: 'Prefix',
                  }),
                },
              ]}
              idSelected={grouping}
              onChange={(id) => setGrouping(id as Grouping)}
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
                  hasHistogram={!!drilldown.fetchHistogram}
                  explicitRun={explicitRun}
                  result={result}
                  error={cardError}
                  loading={cardLoading}
                  stale={explicitRun && !!result && result.ranWith !== refreshKey}
                  checked={checked.has(item.id)}
                  checkDisabledReason={selectionFull}
                  onToggleCheck={() => toggleChecked(item)}
                  onRun={() => (explicitRun ? explicit.run(item.id) : auto.invalidate(item.id))}
                  onVisibilityChange={(visible) => {
                    if (!explicitRun) auto.onVisibilityChange(item.id, visible);
                  }}
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
          <EuiButton size="s" onClick={loadMore}>
            {i18n.translate('explore.logsDrilldown.source.loadMoreRetry', {
              defaultMessage: 'Retry',
            })}
          </EuiButton>
        </EuiCallOut>
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
