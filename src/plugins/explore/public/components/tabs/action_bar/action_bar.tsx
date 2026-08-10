/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { memo, useMemo } from 'react';
import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { useSelector as useReduxSelector } from 'react-redux';
import { DiscoverResultsActionBar } from './results_action_bar/results_action_bar';
import { ExploreServices } from '../../../types';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useSelector } from '../../../application/legacy/discover/application/utils/state_management';
import {
  selectSavedSearch,
  selectActiveTabId,
} from '../../../application/utils/state_management/selectors';
import { useDatasetContext } from '../../../application/context';
import { ExploreFlavor, EXPLORE_LOGS_TAB_ID } from '../../../../common';
import { useTabResults } from '../../../application/utils/hooks/use_tab_results';
import { useHistogramResults } from '../../../application/utils/hooks/use_histogram_results';
import { useBucketCountResults } from '../../../application/utils/hooks/use_bucket_count_results';
import { RootState } from '../../../application/utils/state_management/store';
import { defaultPrepareQueryString } from '../../../application/utils/state_management/actions/query_actions';
import {
  queryEndsWithHead,
  queryHasStats,
} from '../../../application/utils/state_management/actions/utils';

interface ActionBarProps {
  filteredRowsCount?: number;
}

/**
 * Logs tab component for displaying log entries
 * Uses legacy components from discover and handles all content states
 */
const ActionBarComponent = ({ filteredRowsCount }: ActionBarProps = {}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { dataset } = useDatasetContext();
  const { results } = useTabResults();
  const { results: histogramResults } = useHistogramResults();
  const { bucketCount } = useBucketCountResults();
  const query = useReduxSelector((state: RootState) => state.query);
  const activeTabId = useReduxSelector(selectActiveTabId);
  const { core, inspector, inspectorAdapters, slotRegistry } = services;
  const savedSearch = useSelector(selectSavedSearch);

  const sortedSlotItems$ = useMemo(() => {
    return slotRegistry?.getSortedItems$('resultsActionBar') ?? of([]);
  }, [slotRegistry]);
  const slotItems = useObservable(sortedSlotItems$, []);

  const compatibleSlotItems = useMemo(() => {
    const context = { dataSourceEngineType: dataset?.dataSourceRef?.type };
    return slotItems.filter((item) => !item.isCompatible || item.isCompatible(context));
  }, [slotItems, dataset?.dataSourceRef?.type]);

  const openInspector = () => {
    if (inspector) {
      inspector.open(inspectorAdapters, {
        title: savedSearch,
      });
    }
  };

  const rows = results?.hits?.hits || [];
  // For aggregation queries (stats/chart/timechart), use the bucket count from the dedicated
  // count query and show the histogram document total separately.
  // For head queries, hide the denominator entirely.
  const queryString = query.language === 'PPL' ? defaultPrepareQueryString(query) : '';
  const originalQueryString = typeof query.query === 'string' ? query.query : '';
  const hasHead = query.language === 'PPL' && queryEndsWithHead(queryString);
  const hasStats = query.language === 'PPL' && queryHasStats(originalQueryString);
  const totalHits = hasHead ? undefined : histogramResults?.hits.total;
  // For aggregation queries, use the bucket count from the dedicated count query.
  // Only show bucket format on Statistics/Visualization tabs where rows are actual buckets.
  // On Logs tab, rows are documents (stripStatsFromQuery removes the stats clause).
  // When the count query hasn't returned or failed, degrade to the standard hits format.
  const isLogsTab = activeTabId === EXPLORE_LOGS_TAB_ID;
  const effectiveBucketCount = hasStats && !isLogsTab ? bucketCount : undefined;
  const elapsedMs = results?.elapsedMs;

  return (
    <DiscoverResultsActionBar
      hits={totalHits}
      bucketCount={effectiveBucketCount}
      showResetButton={!!savedSearch}
      resetQuery={() => {
        core.application.navigateToApp('explore', {
          path: `${ExploreFlavor.Logs}#/view/${savedSearch}`,
        });
      }}
      rows={rows}
      elapsedMs={elapsedMs}
      dataset={dataset}
      inspectionHanlder={openInspector}
      extraActions={compatibleSlotItems}
      rowsCountOverride={filteredRowsCount}
    />
  );
};

export const ActionBar = memo<ActionBarProps>(ActionBarComponent);
