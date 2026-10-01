/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryExecutionButton } from './query_execution_button';
import { QueryExecutionStatus } from '../../utils/state_management/types';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { isTimeRangeInvalid } from '../../../components/top_nav/utils/validate_time_range';
import { useCancelButtonTiming } from '../../../../../data/public';

jest.mock('../hooks/use_query_builder_state', () => ({ useQueryBuilderState: jest.fn() }));

jest.mock('../../../components/top_nav/utils/validate_time_range', () => ({
  isTimeRangeInvalid: jest.fn().mockReturnValue(false),
}));
jest.mock('../../../../../data/public', () => ({
  ResultStatus: jest.requireActual('../../../../../data/public').ResultStatus,
  useCancelButtonTiming: jest.fn((v) => v),
}));

const buildState = (overrides: Record<string, any> = {}) => ({
  queryEditorState: {
    isQueryEditorDirty: false,
    dateRange: undefined,
    userInitiatedQuery: false,
    queryStatus: { status: QueryExecutionStatus.UNINITIALIZED },
    ...overrides,
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  (isTimeRangeInvalid as jest.Mock).mockReturnValue(false);
  (useCancelButtonTiming as jest.Mock).mockImplementation((v) => v);
  (useQueryBuilderState as jest.Mock).mockReturnValue(buildState());
});

describe('QueryExecutionButton', () => {
  it('renders the execution button', () => {
    render(<QueryExecutionButton />);
    expect(screen.getByTestId('exploreQueryExecutionButton')).toBeInTheDocument();
  });

  it('shows Refresh when query is not dirty', () => {
    render(<QueryExecutionButton />);
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    const button = screen.getByTestId('exploreQueryExecutionButton');
    // Always filled; the resting state is signalled by the primary colour.
    expect(button).toHaveClass('euiButton--fill');
    expect(button).toHaveClass('euiButton--primary');
  });

  it('shows Update when query is dirty', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(buildState({ isQueryEditorDirty: true }));
    render(<QueryExecutionButton />);
    expect(screen.getByText('Update')).toBeInTheDocument();
    const button = screen.getByTestId('exploreQueryExecutionButton');
    expect(button).toHaveClass('euiButton--fill');
    // Always primary: the state shows in the label, not the colour.
    expect(button).toHaveClass('euiButton--primary');
  });

  it('disables button when date range is invalid', () => {
    (isTimeRangeInvalid as jest.Mock).mockReturnValue(true);
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState({ dateRange: { from: 'now', to: 'now' } })
    );
    render(<QueryExecutionButton />);
    const button = screen.getByTestId('exploreQueryExecutionButton');
    expect(button).toBeDisabled();
    // Filled + disabled reads as enabled, so the disabled state stays hollow.
    expect(button).not.toHaveClass('euiButton--fill');
  });

  it('calls onClick when run button is clicked', () => {
    const onClick = jest.fn();
    render(<QueryExecutionButton onClick={onClick} />);
    fireEvent.click(screen.getByTestId('exploreQueryExecutionButton'));
    expect(onClick).toHaveBeenCalled();
  });

  describe('Run and Stop', () => {
    const running = buildState({
      queryStatus: { status: QueryExecutionStatus.LOADING },
      userInitiatedQuery: true,
    });

    it('reads Refresh when no query is running', () => {
      render(<QueryExecutionButton onCancel={jest.fn()} />);
      expect(screen.getByTestId('exploreQueryExecutionButton')).toHaveTextContent('Refresh');
      expect(screen.queryByTestId('exploreQueryStopButton')).not.toBeInTheDocument();
    });

    it('does not offer Stop for a query the user did not start', () => {
      (useQueryBuilderState as jest.Mock).mockReturnValue(
        buildState({
          queryStatus: { status: QueryExecutionStatus.LOADING },
          userInitiatedQuery: false,
        })
      );
      render(<QueryExecutionButton onCancel={jest.fn()} />);
      expect(screen.queryByTestId('exploreQueryStopButton')).not.toBeInTheDocument();
    });

    it('reads Stop while a user-initiated query is running, with no separate cancel button', () => {
      (useQueryBuilderState as jest.Mock).mockReturnValue(running);
      render(<QueryExecutionButton onCancel={jest.fn()} />);
      expect(screen.getByTestId('exploreQueryStopButton')).toHaveTextContent('Stop');
      expect(screen.queryByTestId('exploreQueryCancelButton')).not.toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    it('calls onCancel, not onClick, when Stop is clicked', () => {
      const onClick = jest.fn();
      const onCancel = jest.fn();
      (useQueryBuilderState as jest.Mock).mockReturnValue(running);
      render(<QueryExecutionButton onClick={onClick} onCancel={onCancel} />);
      fireEvent.click(screen.getByTestId('exploreQueryStopButton'), { detail: 1 });
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('offers Stop even when the time range is invalid', () => {
      (isTimeRangeInvalid as jest.Mock).mockReturnValue(true);
      (useQueryBuilderState as jest.Mock).mockReturnValue(
        buildState({
          queryStatus: { status: QueryExecutionStatus.LOADING },
          userInitiatedQuery: true,
          dateRange: { from: 'now', to: 'now' },
        })
      );
      render(<QueryExecutionButton onCancel={jest.fn()} />);
      expect(screen.getByTestId('exploreQueryStopButton')).toBeEnabled();
    });
  });
});
