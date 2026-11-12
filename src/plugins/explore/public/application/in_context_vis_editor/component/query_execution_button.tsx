/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useObservable } from 'react-use';
import { QueryExecutionButtonStatus } from '../../../application/utils/state_management/slices/query_editor/query_editor_slice';
import { isTimeRangeInvalid } from '../../../components/top_nav/utils/validate_time_range';
import { QueryRunStopButton } from '../../../components/top_nav/query_execution_button';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
// import { QueryExecutionStatus } from '../../utils/state_management/types';

export interface QueryExecutionButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onCancel?: () => void;
}

/**
 * The visualization editor's run/stop control, reading its state from the query builder.
 */
export const QueryExecutionButton: React.FC<QueryExecutionButtonProps> = ({
  onClick,
  onCancel,
}) => {
  const { dateRange, container } = useQueryBuilderState();
  const isStale = useObservable(container.isStale$, container.isStale$.getValue());

  // Running while any row of the batch runs (not just the selected one); Stop cancels them all.
  const isRunning = useObservable(container.isExecuting$, container.isExecuting$.getValue());

  const status: QueryExecutionButtonStatus =
    dateRange && isTimeRangeInvalid(dateRange) ? 'DISABLED' : isStale ? 'UPDATE' : 'REFRESH';

  return (
    <QueryRunStopButton
      status={status}
      isRunning={Boolean(isRunning)}
      onRun={onClick}
      onStop={onCancel}
    />
  );
};
