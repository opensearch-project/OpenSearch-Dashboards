/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpanDetailTabs } from './span_detail_tabs';

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
  SpanOverviewTab: ({ selectedSpan, onSwitchToIssuesTab }: any) => (
    <div data-testid="span-overview-tab">
      <div>Overview Tab Content</div>
      <div>Span: {selectedSpan?.spanId || 'none'}</div>
      {onSwitchToIssuesTab && (
        <button onClick={onSwitchToIssuesTab} data-testid="switch-to-issues">
          Switch to Issues
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
  SpanMetadataTab: ({ selectedSpan, addSpanFilter }: any) => (
    <div data-testid="span-metadata-tab">
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
    expect(screen.getByText('Issues')).toBeInTheDocument();
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

  it('switches to issues tab when issues tab is clicked', () => {
    render(<SpanDetailTabs {...defaultProps} />);

    // Click on Issues tab
    const issuesTab = screen.getByRole('tab', { name: 'Issues' });
    fireEvent.click(issuesTab);

    // Check that issues tab is now selected
    expect(issuesTab).toHaveAttribute('aria-selected', 'true');

    // Check that issues tab content is displayed
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

    // Test the onSwitchToIssuesTab callback
    const switchButton = screen.getByText('Switch to Issues');
    fireEvent.click(switchButton);

    // Should switch to issues tab
    const issuesTab = screen.getByRole('tab', { name: 'Issues' });
    expect(issuesTab).toHaveAttribute('aria-selected', 'true');
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
    expect(screen.getByText('Issues')).toBeInTheDocument();
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
    expect(screen.getByText('Issues')).toBeInTheDocument();
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
    expect(tabs).toHaveLength(4);
    expect(tabs[0]).toHaveTextContent('Overview');
    expect(tabs[1]).toHaveTextContent('Issues');
    expect(tabs[2]).toHaveTextContent('Metadata');
    expect(tabs[3]).toHaveTextContent('Raw span');
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

    // Should display the issue count badge on the Issues tab
    const issuesTab = screen.getByRole('tab', { name: /Issues/ });
    expect(issuesTab).toBeInTheDocument();

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

    // Should not display any badge on the Issues tab
    const issuesTab = screen.getByRole('tab', { name: 'Issues' });
    expect(issuesTab).toBeInTheDocument();

    // Should not have any badge with count
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });
});
