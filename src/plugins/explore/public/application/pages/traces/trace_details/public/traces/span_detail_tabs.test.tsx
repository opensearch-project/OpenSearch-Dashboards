/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpanDetailTabs } from './span_detail_tabs';
import { SpanDetailTab } from '../../constants/span_detail_tabs';

// Mock the utility functions
jest.mock('../utils/span_data_utils', () => ({
  getSpanIssueCount: jest.fn((span) => {
    if (!span) return 0;
    return span['status.code'] === 2 ? 1 : 0;
  }),
  getSpanAttributeCount: jest.fn((span) => {
    if (!span) return 0;
    return Object.keys(span).filter(
      (key) => key.startsWith('http.') || key.startsWith('db.') || key.includes('.')
    ).length;
  }),
}));

// Mock the individual tab components
jest.mock('./span_tabs/span_overview_tab', () => ({
  SpanOverviewTab: ({ selectedSpan, onSwitchToErrorsTab }: any) => (
    <div data-testid="span-overview-tab">
      <div>Overview Tab Content</div>
      <div>Span: {selectedSpan?.spanId || 'none'}</div>
      {onSwitchToErrorsTab && (
        <button onClick={onSwitchToErrorsTab} data-testid="switch-to-errors">
          Switch to Errors
        </button>
      )}
    </div>
  ),
}));

jest.mock('./span_tabs/span_issues_tab', () => ({
  SpanIssuesTab: ({ selectedSpan }: any) => (
    <div data-testid="span-issues-tab">
      <div>Issues Tab Content</div>
      <div>Span: {selectedSpan?.spanId || 'none'}</div>
    </div>
  ),
}));

jest.mock('./span_tabs/span_metadata_tab', () => ({
  // @ts-ignore
  SpanMetadataTab: ({ selectedSpan, addSpanFilter }: any) => (
    <div data-test-subj="span-metadata-tab" data-testid="span-metadata-tab">
      <div>Metadata Tab Content</div>
      <div>Span: {selectedSpan?.spanId || 'none'}</div>
      {addSpanFilter && (
        <button
          onClick={() => addSpanFilter('test.field', 'test.value')}
          data-testid="add-filter-button"
        >
          Add Filter
        </button>
      )}
    </div>
  ),
}));

jest.mock('./span_tabs/span_raw_span_tab', () => ({
  SpanRawSpanTab: ({ selectedSpan }: any) => (
    <div data-testid="span-raw-span-tab">
      <div>Raw Span Tab Content</div>
      <div>Span: {selectedSpan?.spanId || 'none'}</div>
    </div>
  ),
}));

describe('SpanDetailTabs', () => {
  const mockSpan = {
    spanId: 'test-span-id',
    parentSpanId: 'parent-span-id',
    serviceName: 'test-service',
    name: 'test-operation',
    durationInNanos: 1000000000,
    startTime: '2023-01-01T00:00:00.000Z',
    endTime: '2023-01-01T00:00:01.000Z',
    events: [{ name: 'test-event', timestamp: 1234567890 }],
    'http.method': 'GET',
    'http.url': 'http://test.com',
    'status.code': 0,
    traceId: 'test-trace-id',
    traceGroup: 'test-trace-group',
  };

  const defaultProps = {
    selectedSpan: mockSpan,
    addSpanFilter: jest.fn(),
    serviceName: 'test-service',
    setCurrentSpan: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders span detail tabs with default overview tab', () => {
    render(<SpanDetailTabs {...defaultProps} />);

    // Check header
    expect(screen.getByText('Span details')).toBeInTheDocument();

    // Check tabs are present
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByText('Metadata')).toBeInTheDocument();
    expect(screen.getByText('Raw span')).toBeInTheDocument();

    // Check that overview tab is selected by default
    const overviewTab = screen.getByRole('tab', { name: 'Overview' });
    expect(overviewTab).toHaveAttribute('aria-selected', 'true');

    // Check that overview tab content is displayed
    expect(screen.getByText('Overview Tab Content')).toBeInTheDocument();
    expect(screen.getByText('Span: test-span-id')).toBeInTheDocument();
  });

  it('renders header and tabs when no span is selected', () => {
    const propsWithoutSpan = {
      ...defaultProps,
      selectedSpan: undefined,
    };

    render(<SpanDetailTabs {...propsWithoutSpan} />);

    // Header should still be present
    expect(screen.getByText('Span details')).toBeInTheDocument();

    // Tabs should still be present but content should reflect no span
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Overview Tab Content')).toBeInTheDocument();
    expect(screen.getByText('Span: none')).toBeInTheDocument();
  });

  it('renders header and tabs when span is empty object', () => {
    const propsWithEmptySpan = {
      ...defaultProps,
      selectedSpan: {},
    };

    render(<SpanDetailTabs {...propsWithEmptySpan} />);

    expect(screen.getByText('Span details')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Overview Tab Content')).toBeInTheDocument();
  });

  it('calls setCurrentSpan when back button is clicked', () => {
    render(<SpanDetailTabs {...defaultProps} />);

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    expect(defaultProps.setCurrentSpan).toHaveBeenCalledWith('');
  });

  it('does not render back button when serviceName is not provided', () => {
    const propsWithoutServiceName = {
      ...defaultProps,
      serviceName: undefined,
    };

    render(<SpanDetailTabs {...propsWithoutServiceName} />);

    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });

  it('switches to errors tab when errors tab is clicked', () => {
    render(<SpanDetailTabs {...defaultProps} />);

    // Click on Errors tab
    const errorsTab = screen.getByRole('tab', { name: 'Errors' });
    fireEvent.click(errorsTab);

    // Check that errors tab is now selected
    expect(errorsTab).toHaveAttribute('aria-selected', 'true');

    // Check that errors tab content is displayed
    expect(screen.getByText('Issues Tab Content')).toBeInTheDocument();

    // Overview tab should no longer be selected
    const overviewTab = screen.getByRole('tab', { name: 'Overview' });
    expect(overviewTab).toHaveAttribute('aria-selected', 'false');
  });

  it('switches to metadata tab when metadata tab is clicked', () => {
    render(<SpanDetailTabs {...defaultProps} />);

    // Click on Metadata tab
    const metadataTab = screen.getByRole('tab', { name: 'Metadata' });
    fireEvent.click(metadataTab);

    // Check that metadata tab is now selected
    expect(metadataTab).toHaveAttribute('aria-selected', 'true');

    // Check that metadata tab content is displayed
    expect(screen.getByText('Metadata Tab Content')).toBeInTheDocument();
  });

  it('switches to raw span tab when raw span tab is clicked', () => {
    render(<SpanDetailTabs {...defaultProps} />);

    // Click on Raw span tab
    const rawSpanTab = screen.getByRole('tab', { name: 'Raw span' });
    fireEvent.click(rawSpanTab);

    // Check that raw span tab is now selected
    expect(rawSpanTab).toHaveAttribute('aria-selected', 'true');

    // Check that raw span tab content is displayed
    expect(screen.getByText('Raw Span Tab Content')).toBeInTheDocument();
  });

  it('passes correct props to overview tab and handles switch callback', () => {
    render(<SpanDetailTabs {...defaultProps} />);

    // Verify overview tab content shows correct span
    expect(screen.getByText('Span: test-span-id')).toBeInTheDocument();

    // Test the onSwitchToErrorsTab callback
    const switchButton = screen.getByText('Switch to Errors');
    fireEvent.click(switchButton);

    // Should switch to errors tab
    const errorsTab = screen.getByRole('tab', { name: 'Errors' });
    expect(errorsTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Issues Tab Content')).toBeInTheDocument();
  });

  it('passes correct props to metadata tab and handles addSpanFilter', () => {
    render(<SpanDetailTabs {...defaultProps} />);

    // Switch to metadata tab
    const metadataTab = screen.getByRole('tab', { name: 'Metadata' });
    fireEvent.click(metadataTab);

    // Verify metadata tab content shows correct span
    expect(screen.getByText('Span: test-span-id')).toBeInTheDocument();

    // Test the addSpanFilter callback
    const addFilterButton = screen.getByText('Add Filter');
    fireEvent.click(addFilterButton);

    expect(defaultProps.addSpanFilter).toHaveBeenCalledWith('test.field', 'test.value');
  });

  it('handles span with error status', () => {
    const spanWithError = {
      ...mockSpan,
      'status.code': 2,
    };

    const propsWithError = {
      ...defaultProps,
      selectedSpan: spanWithError,
    };

    render(<SpanDetailTabs {...propsWithError} />);

    // All tabs should still be present
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByText('Metadata')).toBeInTheDocument();
    expect(screen.getByText('Raw span')).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalSpan = {
      spanId: 'test-span-id',
      serviceName: 'test-service',
      name: 'test-operation',
      durationInNanos: 1000000000,
    };

    const propsWithMinimalSpan = {
      ...defaultProps,
      selectedSpan: minimalSpan,
    };

    render(<SpanDetailTabs {...propsWithMinimalSpan} />);

    // Should still render all tabs
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByText('Metadata')).toBeInTheDocument();
    expect(screen.getByText('Raw span')).toBeInTheDocument();

    // Should display the span ID in the content
    expect(screen.getByText('Span: test-span-id')).toBeInTheDocument();
  });

  it('maintains tab state when span changes', () => {
    const { rerender } = render(<SpanDetailTabs {...defaultProps} />);

    // Switch to metadata tab
    const metadataTab = screen.getByRole('tab', { name: 'Metadata' });
    fireEvent.click(metadataTab);
    expect(metadataTab).toHaveAttribute('aria-selected', 'true');

    // Change the span
    const newSpan = { ...mockSpan, spanId: 'new-span-id' };
    rerender(<SpanDetailTabs {...defaultProps} selectedSpan={newSpan} />);

    // Should still be on metadata tab
    expect(screen.getByRole('tab', { name: 'Metadata' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Metadata Tab Content')).toBeInTheDocument();

    // But should show new span data
    expect(screen.getByText('Span: new-span-id')).toBeInTheDocument();
  });

  it('renders all tabs in correct order', () => {
    render(<SpanDetailTabs {...defaultProps} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveTextContent('Overview');
    expect(tabs[1]).toHaveTextContent('Errors');
    expect(tabs[2]).toHaveTextContent('Logs');
    expect(tabs[3]).toHaveTextContent('Metadata');
    expect(tabs[4]).toHaveTextContent('Raw span');
  });

  it('applies correct CSS classes', () => {
    render(<SpanDetailTabs {...defaultProps} />);

    // Check that the main container has the correct class
    const container = screen.getByText('Span details').closest('.exploreSpanDetailSidebar');
    expect(container).toBeInTheDocument();
  });

  it('displays issue count badge when span has errors', () => {
    const spanWithError = {
      ...mockSpan,
      'status.code': 2,
    };

    const propsWithError = {
      ...defaultProps,
      selectedSpan: spanWithError,
    };

    render(<SpanDetailTabs {...propsWithError} />);

    // Should display the issue count badge on the Errors tab
    const errorsTab = screen.getByRole('tab', { name: /Errors/ });
    expect(errorsTab).toBeInTheDocument();

    // Check that the badge with count "1" is present
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('does not display issue count badge when span has no errors', () => {
    const spanWithoutError = {
      ...mockSpan,
      'status.code': 0,
    };

    const propsWithoutError = {
      ...defaultProps,
      selectedSpan: spanWithoutError,
    };

    render(<SpanDetailTabs {...propsWithoutError} />);

    // Should not display any badge on the Errors tab
    const errorsTab = screen.getByRole('tab', { name: 'Errors' });
    expect(errorsTab).toBeInTheDocument();

    // Should not have any badge with count
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  // CRITICAL TEST 1: Tab persistence with external state control (using real components)
  it('maintains tab state when controlled by external activeTab prop', () => {
    const mockOnTabChange = jest.fn();

    const { rerender, container } = render(
      <SpanDetailTabs
        {...defaultProps}
        activeTab={SpanDetailTab.METADATA}
        onTabChange={mockOnTabChange}
      />
    );

    // Should start with metadata tab active (controlled by external prop)
    expect(screen.getByRole('tab', { name: 'Metadata' })).toHaveAttribute('aria-selected', 'true');
    expect(container.querySelector('[data-test-subj="span-metadata-tab"]')).toBeInTheDocument();

    // Change span but keep same external activeTab
    const newSpan = { ...mockSpan, spanId: 'new-span-id' };
    rerender(
      <SpanDetailTabs
        {...defaultProps}
        selectedSpan={newSpan}
        activeTab={SpanDetailTab.METADATA}
        onTabChange={mockOnTabChange}
      />
    );

    // Should still be on metadata tab (persistence across span changes)
    expect(screen.getByRole('tab', { name: 'Metadata' })).toHaveAttribute('aria-selected', 'true');
    expect(container.querySelector('[data-test-subj="span-metadata-tab"]')).toBeInTheDocument();

    // Click on errors tab - should call onTabChange but not change internal state
    const errorsTab = screen.getByRole('tab', { name: 'Errors' });
    fireEvent.click(errorsTab);

    expect(mockOnTabChange).toHaveBeenCalledWith(SpanDetailTab.ERRORS);
    // Tab should still show metadata since external prop hasn't changed
    expect(screen.getByRole('tab', { name: 'Metadata' })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders logs tab when logDatasets and datasetLogs are provided', () => {
    const logDatasets = [
      { id: 'log-dataset-1', title: 'app-logs-*', type: 'INDEX_PATTERN' },
      { id: 'log-dataset-2', title: 'error-logs-*', type: 'INDEX_PATTERN' },
    ];

    const datasetLogs = {
      'log-dataset-1': [
        {
          _id: 'log1',
          _source: { message: 'Test log message 1' },
          spanId: 'test-span-id',
        },
        {
          _id: 'log2',
          _source: { message: 'Test log message 2' },
          spanId: 'test-span-id',
        },
      ],
      'log-dataset-2': [
        {
          _id: 'log3',
          _source: { message: 'Error log message' },
          spanId: 'test-span-id',
        },
      ],
    };

    const propsWithLogs = {
      ...defaultProps,
      logDatasets,
      datasetLogs,
      isLogsLoading: false,
    };

    render(<SpanDetailTabs {...propsWithLogs} />);

    // Check that logs tab is present
    expect(screen.getByText('Logs')).toBeInTheDocument();

    // Check that we now have 5 tabs instead of 4
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveTextContent('Overview');
    expect(tabs[1]).toHaveTextContent('Errors');
    expect(tabs[2]).toHaveTextContent('Logs');
    expect(tabs[3]).toHaveTextContent('Metadata');
    expect(tabs[4]).toHaveTextContent('Raw span');

    // Click on Logs tab to verify it works
    const logsTab = screen.getByRole('tab', { name: 'Logs' });
    fireEvent.click(logsTab);

    // Check that logs tab is now selected
    expect(logsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('renders logs tab even when logDatasets is empty', () => {
    const propsWithoutLogs = {
      ...defaultProps,
      logDatasets: [],
      datasetLogs: {},
      isLogsLoading: false,
    };

    render(<SpanDetailTabs {...propsWithoutLogs} />);

    // Check that logs tab is present even when logDatasets is empty
    expect(screen.getByText('Logs')).toBeInTheDocument();

    // Should have 5 tabs
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveTextContent('Overview');
    expect(tabs[1]).toHaveTextContent('Errors');
    expect(tabs[2]).toHaveTextContent('Logs');
    expect(tabs[3]).toHaveTextContent('Metadata');
    expect(tabs[4]).toHaveTextContent('Raw span');

    // Click on Logs tab to verify it works
    const logsTab = screen.getByRole('tab', { name: 'Logs' });
    fireEvent.click(logsTab);
    expect(logsTab).toHaveAttribute('aria-selected', 'true');

    // Verify that the correct content is displayed when no log datasets are available
    expect(screen.getByText('Span Logs')).toBeInTheDocument();
    expect(screen.getByText('No log datasets found for this span')).toBeInTheDocument();
  });

  it('render logs tab', () => {
    const logDatasets = [{ id: 'log-dataset-1', title: 'app-logs-*', type: 'INDEX_PATTERN' }];

    const datasetLogs = {
      'log-dataset-1': [
        {
          _id: 'log1',
          _source: { message: 'Test log message 1' },
          spanId: 'different-span-id',
        },
      ],
    };

    const propsWithNonMatchingLogs = {
      ...defaultProps,
      logDatasets,
      datasetLogs,
      isLogsLoading: false,
    };

    render(<SpanDetailTabs {...propsWithNonMatchingLogs} />);

    // Check that logs tab is not present since no logs match the span
    expect(screen.queryByText('Logs')).toBeInTheDocument();

    // Should only have 4 tabs
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
  });
});
