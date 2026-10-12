/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useSelector } from '../../../application/legacy/discover/application/utils/state_management';
import { ExploreServices } from '../../../types';
import {
  setQueryExecutionButtonStatus,
  QueryExecutionButtonStatus,
} from '../../../application/utils/state_management/slices/query_editor/query_editor_slice';
import {
  selectDateRange,
  selectIsQueryEditorDirty,
  selectIsUserQueryRunning,
} from '../../../application/utils/state_management/selectors';
import { isTimeRangeInvalid } from '../utils/validate_time_range';
import { QueryRunStopButton } from './query_run_stop_button';

export interface QueryExecutionButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onCancel?: () => void;
}

/**
 * Explore's run/stop control. Derives the button status, publishes it to Redux, and reads
 * "Stop" while a user-initiated query is running.
 */
export const QueryExecutionButton: React.FC<QueryExecutionButtonProps> = ({
  onClick,
  onCancel,
}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();
  const dateRange = useSelector(selectDateRange);
  const timefilter = services?.data?.query?.timefilter?.timefilter;
  const isQueryEditorDirty = useSelector(selectIsQueryEditorDirty);
  const isRunning = useSelector(selectIsUserQueryRunning);

  const determineButtonStatus = useCallback((): QueryExecutionButtonStatus => {
    if (dateRange && isTimeRangeInvalid(dateRange)) {
      return 'DISABLED';
    }

    const currentTimeRange = timefilter ? timefilter.getTime() : { from: 'now-15m', to: 'now' };
    const isDateRangeUpdated =
      dateRange &&
      (dateRange.from !== currentTimeRange.from || dateRange.to !== currentTimeRange.to);

    const hasChanges = isQueryEditorDirty || Boolean(isDateRangeUpdated);

    return hasChanges ? 'UPDATE' : 'REFRESH';
  }, [dateRange, isQueryEditorDirty, timefilter]);

  const status = determineButtonStatus();

  useEffect(() => {
    dispatch(setQueryExecutionButtonStatus(status));
  }, [dispatch, status]);

  return (
    <QueryRunStopButton status={status} isRunning={isRunning} onRun={onClick} onStop={onCancel} />
  );
};
