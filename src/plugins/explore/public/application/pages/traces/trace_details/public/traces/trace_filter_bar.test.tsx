/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TraceFilterBar } from './trace_filter_bar';

// Stub the child controls — this test focuses on the bar's chip selection logic.
jest.mock('./trace_filter_chip', () => ({
  TraceFilterChip: ({ filter }: any) => <div data-test-subj={`chip-${filter.field}`} />,
}));
jest.mock('./span_attribute_filter', () => ({
  SpanAttributeFilter: () => <div data-test-subj="mock-attr-filter" />,
}));
jest.mock('./span_detail_tables/span_status_filter', () => ({
  SpanStatusFilter: () => <div data-test-subj="mock-status-filter" />,
}));
jest.mock('./span_detail_tables/span_duration_filter', () => ({
  SpanDurationFilter: () => <div data-test-subj="mock-duration-filter" />,
}));

const baseProps = {
  datasetFields: [],
  spans: [],
  addSpanFilter: jest.fn(),
  removeFilter: jest.fn(),
  replaceFilter: jest.fn(),
  clearAllFilters: jest.fn(),
  setSpanFiltersWithStorage: jest.fn(),
};

describe('TraceFilterBar', () => {
  it('renders a chip only for non-special filters (not isError / status.code / durationMin)', () => {
    const spanFilters = [
      { field: 'serviceName', value: 'cart', operator: '=' as const },
      { field: 'isError', value: true },
      { field: 'durationMin', value: 5e6 },
      { field: 'attributes.http.method', value: 'GET', operator: '=' as const },
    ];
    const { queryByTestId, container } = render(
      <TraceFilterBar {...baseProps} spanFilters={spanFilters} />
    );
    expect(container.querySelectorAll('[data-test-subj^="chip-"]')).toHaveLength(2);
    expect(queryByTestId('chip-serviceName')).toBeInTheDocument();
    expect(queryByTestId('chip-attributes.http.method')).toBeInTheDocument();
    expect(queryByTestId('chip-isError')).toBeNull();
    expect(queryByTestId('chip-durationMin')).toBeNull();
    expect(container.querySelector('[data-test-subj="traceFilterGroup"]')).toBeInTheDocument();
  });

  it('shows Clear all only when filters exist and wires it', () => {
    const clearAllFilters = jest.fn();
    const { queryByTestId, rerender, getByTestId } = render(
      <TraceFilterBar {...baseProps} spanFilters={[]} clearAllFilters={clearAllFilters} />
    );
    expect(queryByTestId('clear-all-filters-button')).toBeNull();
    rerender(
      <TraceFilterBar
        {...baseProps}
        spanFilters={[{ field: 'serviceName', value: 'cart' }]}
        clearAllFilters={clearAllFilters}
      />
    );
    fireEvent.click(getByTestId('clear-all-filters-button'));
    expect(clearAllFilters).toHaveBeenCalled();
  });
});
