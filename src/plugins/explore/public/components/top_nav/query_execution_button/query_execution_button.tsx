/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
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
} from '../../../application/utils/state_management/selectors';
import { isTimeRangeInvalid } from '../utils/validate_time_range';

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
  showCancelButton,
  onCancel,
  isQueryRunning,
}) => {
  console.log('QueryExecutionButton rendering');
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();
  const dateRange = useSelector(selectDateRange);
  const timefilter = services?.data?.query?.timefilter?.timefilter;
  const isQueryEditorDirty = useSelector(selectIsQueryEditorDirty);

  // Cancel button state management
  const [shouldShowCancelButton, setShouldShowCancelButton] = useState(false);
  const cancelButtonTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle delayed cancel button visibility
  useEffect(() => {
    if (isQueryRunning && showCancelButton) {
      // Start timer to show cancel button after 100ms
      cancelButtonTimerRef.current = setTimeout(() => {
        setShouldShowCancelButton(true);
      }, 100);
    } else {
      // Clear timer and hide button immediately when query stops
      if (cancelButtonTimerRef.current) {
        clearTimeout(cancelButtonTimerRef.current);
        cancelButtonTimerRef.current = null;
      }
      setShouldShowCancelButton(false);
    }

    // Cleanup timer on unmount
    return () => {
      if (cancelButtonTimerRef.current) {
        clearTimeout(cancelButtonTimerRef.current);
      }
    };
  }, [isQueryRunning, showCancelButton]);

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
