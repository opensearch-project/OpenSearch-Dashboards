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
    render(<TraceDetailTabs {...defaultProps} />);

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
});
