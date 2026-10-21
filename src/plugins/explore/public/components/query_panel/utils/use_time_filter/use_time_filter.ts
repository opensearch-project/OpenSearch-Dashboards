/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useDispatch } from 'react-redux';
import { OnTimeChangeProps } from '@elastic/eui';
import { useCallback } from 'react';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import {
  clearResults,
  clearQueryStatusMap,
} from '../../../../application/utils/state_management/slices';
import { executeQueries } from '../../../../application/utils/state_management/actions/query_actions';
import {
  datasetRequiresExplicitRun,
  stageQueryForExplicitRun,
} from '../../../../application/utils/requires_explicit_run';

export interface HandleTimeChangeOptions {
  /**
   * The change comes from picking a recent query, not from the user picking a time range. Only
   * such a change is staged instead of run for a dataset type that requires an explicit Run.
   */
  fromRecentQuery?: boolean;
}

export const useTimeFilter = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();

  const timeFilter = services.data.query.timefilter.timefilter;

  const handleTimeChange = useCallback(
    (
      { start, end, isQuickSelection }: OnTimeChangeProps,
      options: HandleTimeChangeOptions = {}
    ) => {
      const newTimeRange = { from: start, to: end };

      // Update timeFilter - this will trigger re-render automatically
      if (timeFilter) {
        timeFilter.setTime(newTimeRange);
      }

      if (isQuickSelection) {
        // Picking a recent query with its time range only stages the change for a dataset type
        // that requires an explicit Run. A time range the user picks still runs.
        const queryString = services.data.query.queryString;
        if (
          options.fromRecentQuery &&
          datasetRequiresExplicitRun(queryString, queryString?.getQuery?.()?.dataset)
        ) {
          stageQueryForExplicitRun(dispatch);
          return;
        }
        dispatch(clearResults());
        dispatch(clearQueryStatusMap());
        // @ts-expect-error TS2345 TODO(ts-error): fixme
        dispatch(executeQueries({ services }));
      }
    },
    [dispatch, services, timeFilter]
  );

  const handleRefreshChange = useCallback(
    ({ isPaused, refreshInterval: interval }: { isPaused: boolean; refreshInterval: number }) => {
      const newRefreshInterval = { pause: isPaused, value: interval };

      // Update timeFilter - this will trigger re-render automatically
      if (timeFilter) {
        timeFilter.setRefreshInterval(newRefreshInterval);
      }
    },
    [timeFilter]
  );

  return {
    timeFilter,
    handleTimeChange,
    handleRefreshChange,
  };
};
