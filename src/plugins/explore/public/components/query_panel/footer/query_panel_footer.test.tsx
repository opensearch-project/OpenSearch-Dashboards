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
  ResultStatus: {
    ERROR: 'error',
    LOADING: 'loading',
    READY: 'ready',
    UNINITIALIZED: 'uninitialized',
  },
}));

// Mock the selectors
jest.mock('../../../application/utils/state_management/selectors', () => ({
  selectQueryStatus: jest.fn(),
  selectEditorMode: jest.fn(),
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

jest.mock('../../../application/context', () => ({
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

  const mockEditorMode = 'single-query';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useSelector to return different values based on call order
    let callCount = 0;
    mockUseSelector.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return mockQueryStatus; // First call is selectQueryStatus
      }
      if (callCount === 2) {
        return mockEditorMode; // Second call is selectEditorMode
      }
      return mockQueryStatus; // fallback
    });
  });

  it('renders all footer components with correct layout', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: '@timestamp' } as any,
      isLoading: false,
      error: null,
    });

    const { container } = render(<QueryPanelFooter />);

    // Check main container
    expect(container.querySelector('.exploreQueryPanelFooter')).toBeInTheDocument();

    // Check left section components
    expect(screen.getByTestId('filter-panel-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('recent-queries-button')).toBeInTheDocument();
    expect(screen.getByTestId('save-query-button')).toBeInTheDocument();
    expect(screen.getByTestId('detected-language')).toBeInTheDocument();

    // Check right section components
    expect(screen.getByTestId('date-time-range-picker')).toBeInTheDocument();
    expect(screen.getByTestId('run-query-button')).toBeInTheDocument();
  });

  it('shows date time picker when dataset has time field', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: '@timestamp' } as any,
      isLoading: false,
      error: null,
    });

    render(<QueryPanelFooter />);

    expect(screen.getByTestId('date-time-range-picker')).toBeInTheDocument();
  });

  it('hides date time picker when dataset has no time field', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: undefined } as any,
      isLoading: false,
      error: null,
    });

    render(<QueryPanelFooter />);

    expect(screen.queryByTestId('date-time-range-picker')).not.toBeInTheDocument();
  });

  it('hides date time picker when dataset is undefined', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: undefined,
      isLoading: false,
      error: null,
    });

    render(<QueryPanelFooter />);

    expect(screen.queryByTestId('date-time-range-picker')).not.toBeInTheDocument();
  });

  it('hides date time picker when dataset is null', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: undefined,
      isLoading: false,
      error: null,
    });

    render(<QueryPanelFooter />);

    expect(screen.queryByTestId('date-time-range-picker')).not.toBeInTheDocument();
  });

  it('does not render QueryResult component when status is not error', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: '@timestamp' } as any,
      isLoading: false,
      error: null,
    });

    render(<QueryPanelFooter />);

    expect(screen.queryByTestId('query-result')).not.toBeInTheDocument();
  });

  it('renders QueryResult component only when status is error', () => {
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

    let callCount = 0;
    mockUseSelector.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return errorQueryStatus; // First call is selectQueryStatus
      }
      if (callCount === 2) {
        return mockEditorMode; // Second call is selectEditorMode
      }
      return errorQueryStatus; // fallback
    });

    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: '@timestamp' } as any,
      isLoading: false,
      error: null,
    });

    render(<QueryPanelFooter />);

    expect(screen.getByTestId('query-result')).toHaveTextContent('Query Result: error - 500ms');
  });

  it('shows save button for SingleQuery editor mode', () => {
    let callCount = 0;
    mockUseSelector.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return mockQueryStatus; // First call is selectQueryStatus
      }
      if (callCount === 2) {
        return 'single-query'; // Second call is selectEditorMode (EditorMode.SingleQuery)
      }
      return mockQueryStatus; // fallback
    });

    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: '@timestamp' } as any,
      isLoading: false,
      error: null,
    });

    render(<QueryPanelFooter />);

    expect(screen.getByTestId('save-query-button')).toBeInTheDocument();
  });

  it('shows save button for DualQuery editor mode', () => {
    let callCount = 0;
    mockUseSelector.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return mockQueryStatus; // First call is selectQueryStatus
      }
      if (callCount === 2) {
        return 'dual-query'; // Second call is selectEditorMode (EditorMode.DualQuery)
      }
      return mockQueryStatus; // fallback
    });

    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: '@timestamp' } as any,
      isLoading: false,
      error: null,
    });

    render(<QueryPanelFooter />);

    expect(screen.getByTestId('save-query-button')).toBeInTheDocument();
  });

  it('hides save button for SingleEmpty editor mode', () => {
    let callCount = 0;
    mockUseSelector.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return mockQueryStatus; // First call is selectQueryStatus
      }
      if (callCount === 2) {
        return 'single-empty'; // Second call is selectEditorMode (EditorMode.SingleEmpty)
      }
      return mockQueryStatus; // fallback
    });

    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: '@timestamp' } as any,
      isLoading: false,
      error: null,
    });

    render(<QueryPanelFooter />);

    expect(screen.queryByTestId('save-query-button')).not.toBeInTheDocument();
  });

  it('hides save button for SinglePrompt editor mode', () => {
    let callCount = 0;
    mockUseSelector.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return mockQueryStatus; // First call is selectQueryStatus
      }
      if (callCount === 2) {
        return 'single-prompt'; // Second call is selectEditorMode (EditorMode.SinglePrompt)
      }
      return mockQueryStatus; // fallback
    });

    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: '@timestamp' } as any,
      isLoading: false,
      error: null,
    });

    render(<QueryPanelFooter />);

    expect(screen.queryByTestId('save-query-button')).not.toBeInTheDocument();
  });

  it('calls selectQueryStatus and selectEditorMode selectors', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: '@timestamp' } as any,
      isLoading: false,
      error: null,
    });

    render(<QueryPanelFooter />);

    expect(mockUseSelector).toHaveBeenCalledTimes(2); // Once for each selector
  });
});
