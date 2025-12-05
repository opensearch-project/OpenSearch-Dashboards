/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { EuiSuperUpdateButton, EuiButtonIcon, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';
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
  selectShouldShowCancelButton,
} from '../../../application/utils/state_management/selectors';
import { isTimeRangeInvalid } from '../utils/validate_time_range';
import { useCancelButtonTiming } from '../../../../../data/public';

export interface QueryExecutionButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  showCancelButton?: boolean;
  onCancel?: () => void;
  isQueryRunning?: boolean;
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
  onCancel,
}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();
  const dateRange = useSelector(selectDateRange);
  const timefilter = services?.data?.query?.timefilter?.timefilter;
  const isQueryEditorDirty = useSelector(selectIsQueryEditorDirty);

  // Get Redux state for cancel button logic
  const reduxShouldShowCancelButton = useSelector(selectShouldShowCancelButton);

  // Use custom hook for cancel button timing logic
  const shouldShowCancelButton = useCancelButtonTiming(reduxShouldShowCancelButton);

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
  dispatch(setQueryExecutionButtonStatus(status));

  const isDisabled = status === 'DISABLED';
  const needsUpdate = status === 'UPDATE';

  const buttonText = needsUpdate
    ? i18n.translate('explore.topNav.queryExecutionButton.update', {
        defaultMessage: 'Update',
      })
    : i18n.translate('explore.topNav.queryExecutionButton.refresh', {
        defaultMessage: 'Refresh',
      });

  const runButton = (
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
      color="primary"
    >
      {buttonText}
    </EuiSuperUpdateButton>
  );

  const cancelButton = shouldShowCancelButton ? (
    <EuiButtonIcon
      size="s"
      color="danger"
      onClick={onCancel}
      data-test-subj="exploreQueryCancelButton"
      aria-label={i18n.translate('explore.topNav.queryExecutionButton.cancelAriaLabel', {
        defaultMessage: 'Cancel query',
      })}
      iconType="cross"
      className="osdQueryEditor__cancelButton"
    />
  ) : null;

  return (
    <EuiFlexGroup gutterSize="s" responsive={false} style={{ justifyContent: 'end' }}>
      <EuiFlexItem grow={false}>{runButton}</EuiFlexItem>
      {cancelButton && <EuiFlexItem grow={false}>{cancelButton}</EuiFlexItem>}
    </EuiFlexGroup>
  );
};
