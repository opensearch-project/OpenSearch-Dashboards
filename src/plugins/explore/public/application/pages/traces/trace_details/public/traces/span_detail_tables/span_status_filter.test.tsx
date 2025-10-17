/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpanStatusFilter, SpanStatusFilterProps } from './span_status_filter';
import { SpanFilter } from '../../../trace_view';

describe('SpanStatusFilter', () => {
  const mockSetSpanFiltersWithStorage = jest.fn();

  const defaultProps: SpanStatusFilterProps = {
    spanFilters: [],
    setSpanFiltersWithStorage: mockSetSpanFiltersWithStorage,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders filter button with correct text', () => {
    render(<SpanStatusFilter {...defaultProps} />);

    expect(screen.getByTestId('span-status-filter-button')).toBeInTheDocument();
    expect(screen.getByText('Filter by status')).toBeInTheDocument();
  });

  it('does not show count badge when no filters selected', () => {
    render(<SpanStatusFilter {...defaultProps} />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('opens popover when button clicked', () => {
    render(<SpanStatusFilter {...defaultProps} />);

    fireEvent.click(screen.getByTestId('span-status-filter-button'));

    expect(screen.getByTestId('span-status-filter-popover')).toBeInTheDocument();
    expect(screen.getByTestId('status-filter-selectable')).toBeInTheDocument();
  });

  it('displays selectable component in popover', () => {
    render(<SpanStatusFilter {...defaultProps} />);

    fireEvent.click(screen.getByTestId('span-status-filter-button'));

    expect(screen.getByTestId('status-filter-selectable')).toBeInTheDocument();
  });

  describe('filter count badge', () => {
    it('shows count badge with correct number when filters selected', () => {
      const propsWithOneFilter: SpanStatusFilterProps = {
        spanFilters: [{ field: 'isError', value: true }],
        setSpanFiltersWithStorage: mockSetSpanFiltersWithStorage,
      };

      render(<SpanStatusFilter {...propsWithOneFilter} />);

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('shows correct count for multiple filters', () => {
      const propsWithMultipleFilters: SpanStatusFilterProps = {
        spanFilters: [
          { field: 'isError', value: true },
          { field: 'status.code', value: 1 },
          { field: 'status.code', value: 0 },
        ],
        setSpanFiltersWithStorage: mockSetSpanFiltersWithStorage,
      };

      render(<SpanStatusFilter {...propsWithMultipleFilters} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('does not count non-status filters in badge', () => {
      const propsWithMixedFilters: SpanStatusFilterProps = {
        spanFilters: [
          { field: 'serviceName', value: 'test-service' },
          { field: 'isError', value: true },
        ],
        setSpanFiltersWithStorage: mockSetSpanFiltersWithStorage,
      };

      render(<SpanStatusFilter {...propsWithMixedFilters} />);

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('hides badge when no status filters present', () => {
      const propsWithNonStatusFilters: SpanStatusFilterProps = {
        spanFilters: [{ field: 'serviceName', value: 'test-service' }],
        setSpanFiltersWithStorage: mockSetSpanFiltersWithStorage,
      };

      render(<SpanStatusFilter {...propsWithNonStatusFilters} />);

      expect(screen.queryByText('0')).not.toBeInTheDocument();
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });
  });
});
