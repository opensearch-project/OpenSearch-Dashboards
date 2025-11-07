/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TraceDetailTabs } from './trace_detail_tabs';
import { TraceDetailTab } from '../../constants/trace_detail_tabs';

describe('TraceDetailTabs', () => {
  const mockSetActiveTab = jest.fn();
  const defaultProps = {
    activeTab: TraceDetailTab.TIMELINE,
    setActiveTab: mockSetActiveTab,
    transformedHits: [
      { spanId: 'span-1', serviceName: 'service-a' },
      { spanId: 'span-2', serviceName: 'service-b' },
    ],
    logCount: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all tabs correctly', () => {
    render(<TraceDetailTabs {...defaultProps} />);

    expect(screen.getByText('Timeline')).toBeInTheDocument();
    // Service map tab is currently disabled
    expect(screen.queryByText('Service map')).not.toBeInTheDocument();
    expect(screen.getByText('Span list')).toBeInTheDocument();
  });

  it('shows span count badge in span list tab', () => {
    const propsWithNologs = {
      ...defaultProps,
      logCount: 0,
    };
    render(<TraceDetailTabs {...propsWithNologs} />);

    const badge = screen.getByText('2');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('.euiBadge')).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    render(<TraceDetailTabs {...defaultProps} activeTab={TraceDetailTab.SPAN_LIST} />);

    const spanListTab = screen.getByText('Span list').closest('button');
    expect(spanListTab).toHaveAttribute('aria-selected', 'true');
  });

  it('handles empty transformed hits gracefully', () => {
    const propsWithEmptyHits = {
      ...defaultProps,
      transformedHits: [],
    };

    render(<TraceDetailTabs {...propsWithEmptyHits} />);

    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Span list')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument(); // No badge shown for empty hits
  });

  it('renders logs tab when logDatasets are provided', () => {
    const propsWithLogs = {
      ...defaultProps,
      logDatasets: [{ id: 'log-dataset-1', title: 'app-logs-*', type: 'INDEX_PATTERN' }],
      logCount: 5,
      isLogsLoading: false,
    };

    render(<TraceDetailTabs {...propsWithLogs} />);

    // Check that logs tab is present
    expect(screen.getByText('Related logs')).toBeInTheDocument();

    // Check that log count badge is displayed
    expect(screen.getByText('5')).toBeInTheDocument();

    // Verify we have 3 tabs now (Timeline, Span list, Related logs)
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('render logs tab when logDatasets are not present', () => {
    const propsWithoutLogs = {
      ...defaultProps,
      logDatasets: [],
      logCount: 0,
      isLogsLoading: false,
    };

    render(<TraceDetailTabs {...propsWithoutLogs} />);

    // Check that logs tab is not present
    expect(screen.queryByText('Related logs')).toBeInTheDocument();

    // Verify we only have 3 tabs (Timeline, Span list, Related Logs)
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('does not render logCount badge when isLogsLoading is true', () => {
    const propsWithLoadingLogs = {
      ...defaultProps,
      logDatasets: [{ id: 'log-dataset-1', title: 'app-logs-*', type: 'INDEX_PATTERN' }],
      logCount: 5,
      isLogsLoading: true,
    };

    render(<TraceDetailTabs {...propsWithLoadingLogs} />);

    // Check that logs tab is present
    expect(screen.getByText('Related logs')).toBeInTheDocument();

    // Check that log count badge is NOT displayed when loading
    expect(screen.queryByText('5')).not.toBeInTheDocument();

    // Verify we have 3 tabs (Timeline, Span list, Related logs)
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });
});
