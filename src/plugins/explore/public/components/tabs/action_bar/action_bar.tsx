/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { memo, useMemo } from 'react';
import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { useSelector as useReduxSelector } from 'react-redux';
import { DiscoverResultsActionBar } from './results_action_bar/results_action_bar';
import { ExploreServices } from '../../../types';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useSelector } from '../../../application/legacy/discover/application/utils/state_management';
import { selectSavedSearch } from '../../../application/utils/state_management/selectors';
import { useDatasetContext } from '../../../application/context';
import { ExploreFlavor } from '../../../../common';
import { useTabResults } from '../../../application/utils/hooks/use_tab_results';
import { useHistogramResults } from '../../../application/utils/hooks/use_histogram_results';
import { RootState } from '../../../application/utils/state_management/store';
import { defaultPrepareQueryString } from '../../../application/utils/state_management/actions/query_actions';
import { queryEndsWithHead } from '../../../application/utils/state_management/actions/utils';

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
  const query = useReduxSelector((state: RootState) => state.query);
  const { core, inspector, inspectorAdapters, slotRegistry } = services;
  const savedSearch = useSelector(selectSavedSearch);

  const sortedSlotItems$ = useMemo(() => {
    return slotRegistry?.getSortedItems$('resultsActionBar') ?? of([]);
  }, [slotRegistry]);
  const slotItems = useObservable(sortedSlotItems$, []);

  const openInspector = () => {
    if (inspector) {
      inspector.open(inspectorAdapters, {
        title: savedSearch,
      });
    }
  };

  const rows = results?.hits?.hits || [];
  // When query has head command, just show row count (no "X of Y" total)
  const queryString = query.language === 'PPL' ? defaultPrepareQueryString(query) : '';
  const hasHead = query.language === 'PPL' && queryEndsWithHead(queryString);
  const totalHits = hasHead ? undefined : histogramResults?.hits.total;
  const elapsedMs = results?.elapsedMs;

  return (
    <DiscoverResultsActionBar
      hits={totalHits}
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
      extraActions={slotItems}
      rowsCountOverride={filteredRowsCount}
    />
  );
};

export const ActionBar = memo<ActionBarProps>(ActionBarComponent);
