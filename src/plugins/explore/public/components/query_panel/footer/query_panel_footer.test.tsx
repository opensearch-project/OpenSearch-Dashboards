/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryPanelFooter } from './query_panel_footer';
import { useDatasetContext } from '../../../application/context';
import { useSelector } from 'react-redux';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  connect: jest.fn(() => (component: any) => component),
  Provider: ({ children }: any) => children,
}));

jest.mock('../../../../../data/public', () => ({
  QueryResult: ({ queryStatus }: any) => (
    <div data-test-subj="query-result">
      Query Result: {queryStatus.status} - {queryStatus.elapsedMs}ms
    </div>
  ),
}));

// Mock all child components
jest.mock('./save_query', () => ({
  SaveQueryButton: () => <div data-test-subj="save-query-button">Save Query</div>,
}));

jest.mock('./date_time_range_picker', () => ({
  DateTimeRangePicker: () => <div data-test-subj="date-time-range-picker">Date Time Picker</div>,
}));

jest.mock('./run_query_button', () => ({
  RunQueryButton: () => <div data-test-subj="run-query-button">Run Query</div>,
}));

jest.mock('./filter_panel_toggle', () => ({
  FilterPanelToggle: () => <div data-test-subj="filter-panel-toggle">Filter Panel Toggle</div>,
}));

jest.mock('./recent_queries_button', () => ({
  RecentQueriesButton: () => <div data-test-subj="recent-queries-button">Recent Queries</div>,
}));

jest.mock('./detected_language', () => ({
  DetectedLanguage: () => <div data-test-subj="detected-language">Detected Language</div>,
}));

jest.mock('../../../application/components/dataset_context', () => ({
  useDatasetContext: jest.fn(),
}));

const mockUseDatasetContext = useDatasetContext as jest.MockedFunction<typeof useDatasetContext>;

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

describe('QueryPanelFooter', () => {
  const mockQueryStatus = {
    status: 'ready',
    elapsedMs: 150,
    startTime: Date.now(),
    body: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockReturnValue(mockQueryStatus);
  });

  it('renders all footer components', () => {
    mockUseDatasetContext.mockReturnValue({
      indexPattern: { timeFieldName: '@timestamp' },
    } as any);

    render(<QueryPanelFooter />);

    expect(screen.getByTestId('filter-panel-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('recent-queries-button')).toBeInTheDocument();
    expect(screen.getByTestId('save-query-button')).toBeInTheDocument();
    expect(screen.getByTestId('query-result')).toBeInTheDocument();
    expect(screen.getByTestId('detected-language')).toBeInTheDocument();
    expect(screen.getByTestId('run-query-button')).toBeInTheDocument();
  });

  it('shows date time picker when index pattern has time field', () => {
    mockUseDatasetContext.mockReturnValue({
      indexPattern: { timeFieldName: '@timestamp' },
    } as any);

    render(<QueryPanelFooter />);

    expect(screen.getByTestId('date-time-range-picker')).toBeInTheDocument();
  });

  it('hides date time picker when index pattern has no time field', () => {
    mockUseDatasetContext.mockReturnValue({
      indexPattern: { timeFieldName: null },
    } as any);

    render(<QueryPanelFooter />);

    expect(screen.queryByTestId('date-time-range-picker')).not.toBeInTheDocument();
  });

  it('hides date time picker when index pattern is undefined', () => {
    mockUseDatasetContext.mockReturnValue({
      indexPattern: undefined,
    } as any);

    render(<QueryPanelFooter />);

    expect(screen.queryByTestId('date-time-range-picker')).not.toBeInTheDocument();
  });

  it('hides date time picker when index pattern is null', () => {
    mockUseDatasetContext.mockReturnValue({
      indexPattern: null,
    } as any);

    render(<QueryPanelFooter />);

    expect(screen.queryByTestId('date-time-range-picker')).not.toBeInTheDocument();
  });

  it('renders QueryResult component with correct query status', () => {
    mockUseDatasetContext.mockReturnValue({
      indexPattern: { timeFieldName: '@timestamp' },
    } as any);

    render(<QueryPanelFooter />);

    expect(screen.getByTestId('query-result')).toHaveTextContent('Query Result: ready - 150ms');
  });

  it('renders QueryResult component with error status', () => {
    const errorQueryStatus = {
      status: 'error',
      elapsedMs: 500,
      startTime: Date.now(),
      body: {
        error: {
          error: 'Query execution failed',
          message: { error: 'Syntax error in query' },
        },
      },
    };

    mockUseSelector.mockReturnValue(errorQueryStatus);
    mockUseDatasetContext.mockReturnValue({
      indexPattern: { timeFieldName: '@timestamp' },
    } as any);

    render(<QueryPanelFooter />);

    expect(screen.getByTestId('query-result')).toHaveTextContent('Query Result: error - 500ms');
  });

  it('conditionally renders date time picker wrapper with correct class', () => {
    mockUseDatasetContext.mockReturnValue({
      indexPattern: { timeFieldName: '@timestamp' },
    } as any);

    const { container } = render(<QueryPanelFooter />);

    const datePickerWrapper = container.querySelector(
      '.queryPanel__footer__dateTimeRangePickerWrapper'
    );
    expect(datePickerWrapper).toBeInTheDocument();
    expect(datePickerWrapper).toContainElement(screen.getByTestId('date-time-range-picker'));
  });

  it('calls selectQueryStatus selector', () => {
    mockUseDatasetContext.mockReturnValue({
      indexPattern: { timeFieldName: '@timestamp' },
    } as any);

    render(<QueryPanelFooter />);

    expect(mockUseSelector).toHaveBeenCalled();
  });
});
