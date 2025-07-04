/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryPanelFooter } from './query_panel_footer';

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

jest.mock('./query_error', () => ({
  QueryError: ({ queryStatus }: any) => (
    <div data-test-subj="query-error">Query Error: {queryStatus.body.error.error}</div>
  ),
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

jest.mock('../../../application/components/index_pattern_context', () => ({
  useIndexPatternContext: jest.fn(),
}));

import { useIndexPatternContext } from '../../../application/components/index_pattern_context';

const mockUseIndexPatternContext = useIndexPatternContext as jest.MockedFunction<
  typeof useIndexPatternContext
>;

describe('QueryPanelFooter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all footer components', () => {
    mockUseIndexPatternContext.mockReturnValue({
      indexPattern: { timeFieldName: '@timestamp' },
    } as any);

    render(<QueryPanelFooter />);

    expect(screen.getByTestId('filter-panel-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('recent-queries-button')).toBeInTheDocument();
    expect(screen.getByTestId('save-query-button')).toBeInTheDocument();
    expect(screen.getByTestId('query-error')).toBeInTheDocument();
    expect(screen.getByTestId('detected-language')).toBeInTheDocument();
    expect(screen.getByTestId('run-query-button')).toBeInTheDocument();
  });

  it('shows date time picker when index pattern has time field', () => {
    mockUseIndexPatternContext.mockReturnValue({
      indexPattern: { timeFieldName: '@timestamp' },
    } as any);

    render(<QueryPanelFooter />);

    expect(screen.getByTestId('date-time-range-picker')).toBeInTheDocument();
  });

  it('hides date time picker when index pattern has no time field', () => {
    mockUseIndexPatternContext.mockReturnValue({
      indexPattern: { timeFieldName: null },
    } as any);

    render(<QueryPanelFooter />);

    expect(screen.queryByTestId('date-time-range-picker')).not.toBeInTheDocument();
  });

  it('hides date time picker when index pattern is undefined', () => {
    mockUseIndexPatternContext.mockReturnValue({
      indexPattern: undefined,
    } as any);

    render(<QueryPanelFooter />);

    expect(screen.queryByTestId('date-time-range-picker')).not.toBeInTheDocument();
  });

  it('hides date time picker when index pattern is null', () => {
    mockUseIndexPatternContext.mockReturnValue({
      indexPattern: null,
    } as any);

    render(<QueryPanelFooter />);

    expect(screen.queryByTestId('date-time-range-picker')).not.toBeInTheDocument();
  });

  it('renders query error with correct error message', () => {
    mockUseIndexPatternContext.mockReturnValue({
      indexPattern: { timeFieldName: '@timestamp' },
    } as any);

    render(<QueryPanelFooter />);

    expect(screen.getByTestId('query-error')).toHaveTextContent(
      'Query Error: An error occurred while processing the query.'
    );
  });

  it('conditionally renders date time picker wrapper with correct class', () => {
    mockUseIndexPatternContext.mockReturnValue({
      indexPattern: { timeFieldName: '@timestamp' },
    } as any);

    const { container } = render(<QueryPanelFooter />);

    const datePickerWrapper = container.querySelector(
      '.queryPanel__footer__dateTimeRangePickerWrapper'
    );
    expect(datePickerWrapper).toBeInTheDocument();
    expect(datePickerWrapper).toContainElement(screen.getByTestId('date-time-range-picker'));
  });
});
