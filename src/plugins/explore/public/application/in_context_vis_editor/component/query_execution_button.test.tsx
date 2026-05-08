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
    expect(button).not.toHaveClass('euiButton--fill');
  });

  it('shows Update when query is dirty', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(buildState({ isQueryEditorDirty: true }));
    render(<QueryExecutionButton />);
    expect(screen.getByText('Update')).toBeInTheDocument();
    const button = screen.getByTestId('exploreQueryExecutionButton');
    expect(button).toHaveClass('euiButton--fill');
  });

  it('disables button when date range is invalid', () => {
    (isTimeRangeInvalid as jest.Mock).mockReturnValue(true);
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState({ dateRange: { from: 'now', to: 'now' } })
    );
    render(<QueryExecutionButton />);
    expect(screen.getByTestId('exploreQueryExecutionButton')).toBeDisabled();
  });

  it('calls onClick when run button is clicked', () => {
    const onClick = jest.fn();
    render(<QueryExecutionButton onClick={onClick} />);
    fireEvent.click(screen.getByTestId('exploreQueryExecutionButton'));
    expect(onClick).toHaveBeenCalled();
  });

  it('does not render cancel button when not loading', () => {
    render(<QueryExecutionButton />);
    expect(screen.queryByTestId('exploreQueryCancelButton')).not.toBeInTheDocument();
  });

  it('does not render cancel button when loading but not user-initiated', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState({
        queryStatus: { status: QueryExecutionStatus.LOADING },
        userInitiatedQuery: false,
      })
    );
    render(<QueryExecutionButton />);
    expect(screen.queryByTestId('exploreQueryCancelButton')).not.toBeInTheDocument();
  });

  it('renders cancel button when loading and user-initiated', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState({
        queryStatus: { status: QueryExecutionStatus.LOADING },
        userInitiatedQuery: true,
      })
    );
    render(<QueryExecutionButton />);
    expect(screen.getByTestId('exploreQueryCancelButton')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState({
        queryStatus: { status: QueryExecutionStatus.LOADING },
        userInitiatedQuery: true,
      })
    );
    render(<QueryExecutionButton onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId('exploreQueryCancelButton'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('hides cancel button when useCancelButtonTiming returns false', () => {
    (useCancelButtonTiming as jest.Mock).mockReturnValue(false);
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState({
        queryStatus: { status: QueryExecutionStatus.LOADING },
        userInitiatedQuery: true,
      })
    );
    render(<QueryExecutionButton />);
    expect(screen.queryByTestId('exploreQueryCancelButton')).not.toBeInTheDocument();
  });
});
