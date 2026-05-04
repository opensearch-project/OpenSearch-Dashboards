/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useCallback } from 'react';
import { EuiSuperUpdateButton, EuiButtonIcon, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { QueryExecutionButtonStatus } from '../../../application/utils/state_management/slices/query_editor/query_editor_slice';
import { isTimeRangeInvalid } from '../../../components/top_nav/utils/validate_time_range';
import { useCancelButtonTiming } from '../../../../../data/public';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { QueryExecutionStatus } from '../../utils/state_management/types';

export interface QueryExecutionButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onCancel?: () => void;
}

/**
 * Query execution button that handles simple logic of query execution
 */
export const QueryExecutionButton: React.FC<QueryExecutionButtonProps> = ({
  onClick,
  onCancel,
}) => {
  const { queryEditorState } = useQueryBuilderState();
  const isQueryEditorDirty = queryEditorState.isQueryEditorDirty;
  const dateRange = queryEditorState.dateRange;

  const shouldShowCancelButtonState =
    queryEditorState.userInitiatedQuery &&
    queryEditorState.queryStatus.status === QueryExecutionStatus.LOADING;

  const shouldShowCancelButton = useCancelButtonTiming(shouldShowCancelButtonState);

  const determineButtonStatus = useCallback((): QueryExecutionButtonStatus => {
    if (dateRange && isTimeRangeInvalid(dateRange)) {
      return 'DISABLED';
    }
    return isQueryEditorDirty ? 'UPDATE' : 'REFRESH';
  }, [dateRange, isQueryEditorDirty]);

  const status = determineButtonStatus();

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
      fill={needsUpdate}
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
