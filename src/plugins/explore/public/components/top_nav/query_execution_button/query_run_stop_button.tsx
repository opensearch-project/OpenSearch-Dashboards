/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './query_run_stop_button.scss';

import React, { useCallback } from 'react';
import { EuiButton, EuiToolTip, useEuiI18n } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useCancelButtonTiming } from '../../../../../data/public';
import { QueryExecutionButtonStatus } from '../../../application/utils/state_management/slices/query_editor/query_editor_slice';

export interface QueryRunStopButtonProps {
  status: QueryExecutionButtonStatus;
  isRunning: boolean;
  onRun?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onStop?: () => void;
}

/**
 * Runs the query, and stops it while it is running.
 *
 * Both states render the same button element so keyboard focus survives the switch. Stop is only
 * offered when an `onStop` handler exists.
 */
export const QueryRunStopButton: React.FC<QueryRunStopButtonProps> = ({
  status,
  isRunning,
  onRun,
  onStop,
}) => {
  const showStop = useCancelButtonTiming(isRunning && Boolean(onStop), false);

  const [refreshLabel, updateLabel, clickToApplyTooltip, cannotUpdateTooltip] = useEuiI18n(
    [
      'euiSuperUpdateButton.refreshButtonLabel',
      'euiSuperUpdateButton.updateButtonLabel',
      'euiSuperUpdateButton.clickToApplyTooltip',
      'euiSuperUpdateButton.cannotUpdateTooltip',
    ],
    ['Refresh', 'Update', 'Click to apply', 'Cannot update']
  );

  const isDisabled = !showStop && status === 'DISABLED';
  const needsUpdate = !showStop && status === 'UPDATE';
  const runLabel = needsUpdate ? updateLabel : refreshLabel;

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (showStop) {
        // Stop stays visible briefly after a query settles, and the second click of a double-click
        // on Run lands here too; neither may cancel, since cancelling discards the results.
        if (isRunning && event.detail <= 1) onStop?.();
        return;
      }
      onRun?.(event);
    },
    [showStop, isRunning, onStop, onRun]
  );

  const tooltip = showStop
    ? undefined
    : isDisabled
      ? cannotUpdateTooltip
      : needsUpdate
        ? clickToApplyTooltip
        : undefined;

  return (
    <EuiToolTip content={tooltip} position="bottom">
      <EuiButton
        size="s"
        className="exploreQueryRunStopButton"
        textProps={{ className: 'exploreQueryRunStopButton__text' }}
        iconType={showStop ? 'cross' : 'refresh'}
        color={showStop ? 'danger' : 'primary'}
        fill={!isDisabled}
        isDisabled={isDisabled}
        onClick={handleClick}
        data-test-subj={showStop ? 'exploreQueryStopButton' : 'exploreQueryExecutionButton'}
        aria-label={
          showStop
            ? i18n.translate('explore.topNav.queryExecutionButton.stopAriaLabel', {
                defaultMessage: 'Stop query',
              })
            : i18n.translate('explore.topNav.queryExecutionButton.ariaLabel', {
                defaultMessage: 'Submit query: {buttonText}',
                values: { buttonText: runLabel },
              })
        }
      >
        {showStop
          ? i18n.translate('explore.topNav.queryExecutionButton.stop', {
              defaultMessage: 'Stop',
            })
          : runLabel}
      </EuiButton>
    </EuiToolTip>
  );
};
