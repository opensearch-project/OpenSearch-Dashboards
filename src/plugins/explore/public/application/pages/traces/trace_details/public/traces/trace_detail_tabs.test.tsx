/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TraceDetailTabs } from './trace_detail_tabs';
import { TraceDetailTab } from '../../constants/trace_detail_tabs';

describe('TraceDetailTabs', () => {
  const mockSetActiveTab = jest.fn();
  const mockHandleErrorFilterClick = jest.fn();
  const defaultProps = {
    activeTab: TraceDetailTab.TIMELINE,
    setActiveTab: mockSetActiveTab,
    transformedHits: [
      { spanId: 'span-1', serviceName: 'service-a' },
      { spanId: 'span-2', serviceName: 'service-b' },
    ],
    errorCount: 0,
    spanFilters: [],
    handleErrorFilterClick: mockHandleErrorFilterClick,
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

  it('shows error filter button when there are errors and no error filter applied', () => {
    const propsWithErrors = {
      ...defaultProps,
      errorCount: 5,
    };

    render(<TraceDetailTabs {...propsWithErrors} />);

    const errorButton = screen.getByTestId('error-count-button');
    expect(errorButton).toBeInTheDocument();
    expect(errorButton).toHaveTextContent('Filter errors (5)');
  });

  it('hides error filter button when error filter is already applied', () => {
    const propsWithErrorFilter = {
      ...defaultProps,
      errorCount: 5,
      spanFilters: [{ field: 'status.code', value: 2 }],
    };

    render(<TraceDetailTabs {...propsWithErrorFilter} />);

    expect(screen.queryByText('Filter errors (5)')).not.toBeInTheDocument();
  });

  it('calls handleErrorFilterClick when error filter button is clicked', () => {
    const propsWithErrors = {
      ...defaultProps,
      errorCount: 3,
    };

    render(<TraceDetailTabs {...propsWithErrors} />);

    const errorButton = screen.getByText('Filter errors (3)');
    fireEvent.click(errorButton);

    expect(mockHandleErrorFilterClick).toHaveBeenCalledTimes(1);
  });

  it('does not show service legend button', () => {
    render(<TraceDetailTabs {...defaultProps} />);

    expect(screen.queryByTestId('service-legend-toggle')).not.toBeInTheDocument();
    expect(screen.queryByText('Service legend')).not.toBeInTheDocument();
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

  it('renders tooltip for error filter button', () => {
    const propsWithErrors = {
      ...defaultProps,
      errorCount: 2,
    };

    render(<TraceDetailTabs {...propsWithErrors} />);

    const errorButton = screen.getByText('Filter errors (2)');
    const tooltip = errorButton.closest('[data-test-subj="error-count-button"]')?.parentElement;
    expect(tooltip).toBeInTheDocument();
  });

  it('handles multiple span filters correctly', () => {
    const propsWithMultipleFilters = {
      ...defaultProps,
      errorCount: 5,
      spanFilters: [
        { field: 'serviceName', value: 'service-a' },
        { field: 'status.code', value: 2 },
      ],
    };

    render(<TraceDetailTabs {...propsWithMultipleFilters} />);

    // Error button should be hidden because error filter is applied
    expect(screen.queryByText('Filter errors (5)')).not.toBeInTheDocument();
  });

  it('shows error filter button when there are other filters but no error filter', () => {
    const propsWithNonErrorFilters = {
      ...defaultProps,
      errorCount: 3,
      spanFilters: [
        { field: 'serviceName', value: 'service-a' },
        { field: 'operationName', value: 'GET /api' },
      ],
    };

    render(<TraceDetailTabs {...propsWithNonErrorFilters} />);

    expect(screen.getByText('Filter errors (3)')).toBeInTheDocument();
  });
});
