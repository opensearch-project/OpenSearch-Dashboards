/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback } from 'react';
import { EuiSuperUpdateButton } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useDispatch } from 'react-redux';
import { getQueryWithSource } from '../../../application/utils/languages';
import { useSelector } from '../../../application/legacy/discover/application/utils/state_management';
import { RootState } from '../../../application/utils/state_management/store';
import { ExploreServices } from '../../../types';
import {
  setQueryExecutionButtonStatus,
  QueryExecutionButtonStatus,
} from '../../../application/utils/state_management/slices/query_editor/query_editor_slice';
import {
  selectDateRange,
  selectQueryExecutionButtonStatus,
} from '../../../application/utils/state_management/selectors';
import { isTimeRangeInvalid } from '../utils/validate_time_range';

export interface QueryExecutionButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  editorText: string;
  services: ExploreServices;
}

/**
 * Query execution button that calculates and manages its own status in Redux.
 * Shows different text based on button status:
 * - "Update" when status is 'UPDATE' (there are changes)
 * - "Refresh" when status is 'REFRESH' (no changes, just re-run)
 * - Disabled when status is 'DISABLED' (validation errors)
 */
export const QueryExecutionButton: React.FC<QueryExecutionButtonProps> = ({
  onClick,
  editorText,
  services,
}) => {
  const dispatch = useDispatch();
  const dateRange = useSelector(selectDateRange);
  const timefilter = services?.data?.query?.timefilter?.timefilter;
  const queryStringManager = services?.data?.query?.queryString;
  const query = useSelector((state: RootState) => state.query);

  const determineButtonStatus = useCallback((): QueryExecutionButtonStatus => {
    if (dateRange && isTimeRangeInvalid(dateRange)) {
      return 'DISABLED';
    }

    const currentTimeRange = timefilter ? timefilter.getTime() : { from: 'now-15m', to: 'now' };
    const currentQuery = getQueryWithSource(
      queryStringManager ? queryStringManager.getQuery() : { query: '', language: 'kuery' }
    );

    const localEditorQuery = getQueryWithSource({
      ...query,
      query: editorText,
    });

    const isQueryUpdated = localEditorQuery.query !== currentQuery.query;
    const isDateRangeUpdated =
      dateRange &&
      (dateRange.from !== currentTimeRange.from || dateRange.to !== currentTimeRange.to);

    const hasChanges = isQueryUpdated || Boolean(isDateRangeUpdated);

    return hasChanges ? 'UPDATE' : 'REFRESH';
  }, [dateRange, editorText, timefilter, queryStringManager, query]);

  useEffect(() => {
    const status = determineButtonStatus();
    dispatch(setQueryExecutionButtonStatus(status));
  }, [determineButtonStatus, dispatch]);

  const buttonStatus = useSelector(selectQueryExecutionButtonStatus);
  const isDisabled = buttonStatus === 'DISABLED';
  const needsUpdate = buttonStatus === 'UPDATE';

  const buttonText = needsUpdate
    ? i18n.translate('explore.topNav.queryExecutionButton.update', {
        defaultMessage: 'Update',
      })
    : i18n.translate('explore.topNav.queryExecutionButton.refresh', {
        defaultMessage: 'Refresh',
      });

  return (
    <EuiSuperUpdateButton
      needsUpdate={needsUpdate}
      isDisabled={isDisabled}
      onClick={onClick || (() => {})}
      data-test-subj="exploreQueryExecutionButton"
      aria-label={i18n.translate('explore.topNav.queryExecutionButton.ariaLabel', {
        defaultMessage: 'Submit query: {buttonText}',
        values: { buttonText },
      })}
      compressed={true}
    >
      {buttonText}
    </EuiSuperUpdateButton>
  );
};
