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
    expect(tabs).toHaveLength(4);
    expect(tabs[0]).toHaveTextContent('Overview');
    expect(tabs[1]).toHaveTextContent('Errors');
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
  describe('scroll position management', () => {
    let mockScrollTop: number;
    let mockSetTimeout: jest.SpyInstance;

    beforeEach(() => {
      mockScrollTop = 0;
      mockSetTimeout = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
        fn();
        return 0 as any;
      });

      // Mock scrollTop property
      Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
        get() {
          return mockScrollTop;
        },
        set(value) {
          mockScrollTop = value;
        },
        configurable: true,
      });
    });

    afterEach(() => {
      mockSetTimeout.mockRestore();
    });

    it('saves scroll position when switching tabs', () => {
      render(<SpanDetailTabs {...defaultProps} />);

      const contentContainer = document.querySelector('.exploreSpanDetailSidebar__content');
      expect(contentContainer).toBeInTheDocument();

      // Set scroll position > 0
      mockScrollTop = 100;
      if (contentContainer) {
        (contentContainer as HTMLElement).scrollTop = 100;
      }

      // Switch to errors tab - this should save the scroll position
      const errorsTab = screen.getByRole('tab', { name: /Errors/ });
      fireEvent.click(errorsTab);

      // Switch back to overview tab - this should restore the scroll position
      const overviewTab = screen.getByRole('tab', { name: 'Overview' });
      fireEvent.click(overviewTab);

      // Verify setTimeout was called for restoration
      expect(mockSetTimeout).toHaveBeenCalled();
    });

    it('does not save scroll position when scrollTop is 0', () => {
      render(<SpanDetailTabs {...defaultProps} />);

      const contentContainer = document.querySelector('.exploreSpanDetailSidebar__content');

      // Keep scroll at top (0)
      mockScrollTop = 0;
      if (contentContainer) {
        (contentContainer as HTMLElement).scrollTop = 0;
      }

      // Switch tabs - should not save position 0
      const errorsTab = screen.getByRole('tab', { name: /Errors/ });
      fireEvent.click(errorsTab);

      const overviewTab = screen.getByRole('tab', { name: 'Overview' });
      fireEvent.click(overviewTab);

      // Should still work normally but no position saved
      expect(screen.getByText('Overview Tab Content')).toBeInTheDocument();
    });

    it('restores scroll position using setTimeout', () => {
      const realSetTimeout = global.setTimeout;
      const mockSetTimeoutSpy = jest.fn((fn, delay) => {
        expect(delay).toBe(0);
        fn();
        return 0 as any;
      });
      global.setTimeout = mockSetTimeoutSpy as any;

      render(<SpanDetailTabs {...defaultProps} />);

      const contentContainer = document.querySelector('.exploreSpanDetailSidebar__content');

      // Set scroll position and switch tabs to save it
      mockScrollTop = 150;
      if (contentContainer) {
        (contentContainer as HTMLElement).scrollTop = 150;
      }

      const errorsTab = screen.getByRole('tab', { name: /Errors/ });
      fireEvent.click(errorsTab);

      // Reset scroll position
      mockScrollTop = 0;

      // Switch back to overview tab
      const overviewTab = screen.getByRole('tab', { name: 'Overview' });
      fireEvent.click(overviewTab);

      // Verify setTimeout was called with delay 0
      expect(mockSetTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0);

      global.setTimeout = realSetTimeout;
    });

    it('restores scroll position when activeTabContent changes', () => {
      const { rerender } = render(<SpanDetailTabs {...defaultProps} />);

      const contentContainer = document.querySelector('.exploreSpanDetailSidebar__content');

      // Set scroll position and switch tabs to save it
      mockScrollTop = 200;
      if (contentContainer) {
        (contentContainer as HTMLElement).scrollTop = 200;
      }

      const errorsTab = screen.getByRole('tab', { name: /Errors/ });
      fireEvent.click(errorsTab);

      const overviewTab = screen.getByRole('tab', { name: 'Overview' });
      fireEvent.click(overviewTab);

      // Clear previous setTimeout calls
      mockSetTimeout.mockClear();

      // Change span to trigger activeTabContent change
      const newSpan = { ...mockSpan, spanId: 'new-span-id' };
      rerender(<SpanDetailTabs {...defaultProps} selectedSpan={newSpan} />);

      // Should trigger scroll restoration when activeTabContent changes
      expect(mockSetTimeout).toHaveBeenCalled();
    });

    it('handles contentRef being null during scroll operations', () => {
      render(<SpanDetailTabs {...defaultProps} />);

      // Switch tabs normally - should not throw error even if ref becomes null
      const errorsTab = screen.getByRole('tab', { name: /Errors/ });
      fireEvent.click(errorsTab);

      const overviewTab = screen.getByRole('tab', { name: 'Overview' });
      fireEvent.click(overviewTab);

      // Should complete without errors
      expect(screen.getByText('Overview Tab Content')).toBeInTheDocument();
    });
  });

  describe('activeTabContent useMemo', () => {
    it('returns correct content for active tab', () => {
      render(<SpanDetailTabs {...defaultProps} />);

      // Default should be overview content
      expect(screen.getByText('Overview Tab Content')).toBeInTheDocument();
      expect(screen.queryByText('Issues Tab Content')).not.toBeInTheDocument();

      // Switch to errors tab
      const errorsTab = screen.getByRole('tab', { name: /Errors/ });
      fireEvent.click(errorsTab);

      // Should now show errors content
      expect(screen.getByText('Issues Tab Content')).toBeInTheDocument();
      expect(screen.queryByText('Overview Tab Content')).not.toBeInTheDocument();
    });

    it('updates when tabs array changes', () => {
      const propsWithoutLogs = {
        ...defaultProps,
        logDatasets: [],
        logsData: [],
      };

      const { rerender } = render(<SpanDetailTabs {...propsWithoutLogs} />);

      // Initially no logs tab
      expect(screen.queryByText('Logs')).not.toBeInTheDocument();

      // Add logs data to make logs tab available
      const propsWithLogs = {
        ...defaultProps,
        logDatasets: [{ id: 'test-dataset' }],
        logsData: [{ spanId: 'test-span-id', message: 'test log' }],
      };

      rerender(<SpanDetailTabs {...propsWithLogs} />);

      // Now logs tab should be available
      expect(screen.getByText('Logs')).toBeInTheDocument();
    });
  });
});
