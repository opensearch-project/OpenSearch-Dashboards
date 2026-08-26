/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TraceFilterBar } from './trace_filter_bar';

// Stub the child filter popovers — this test focuses on the bar's chip logic.
jest.mock('./span_attribute_filter', () => ({
  SpanAttributeFilter: () => <div data-test-subj="mock-attr-filter" />,
}));
jest.mock('./span_detail_tables/span_status_filter', () => ({
  SpanStatusFilter: () => <div data-test-subj="mock-status-filter" />,
}));
jest.mock('./span_detail_tables/span_duration_filter', () => ({
  SpanDurationFilter: () => <div data-test-subj="mock-duration-filter" />,
}));

const getFilterDisplayText = (f: any) => `${f.field} ${f.operator ?? '='} ${f.value}`;

const baseProps = {
  datasetFields: [],
  spans: [],
  addSpanFilter: jest.fn(),
  removeFilter: jest.fn(),
  clearAllFilters: jest.fn(),
  setSpanFiltersWithStorage: jest.fn(),
  getFilterDisplayText,
};

describe('TraceFilterBar', () => {
  it('renders a pill only for non-special filters (not isError / status.code / durationMin)', () => {
    const spanFilters = [
      { field: 'serviceName', value: 'cart', operator: '=' as const },
      { field: 'isError', value: true },
      { field: 'durationMin', value: 5e6 },
      { field: 'attributes.http.method', value: 'GET', operator: '=' as const },
    ];
    const { container, getByText, queryByText } = render(
      <TraceFilterBar {...baseProps} spanFilters={spanFilters} />
    );
    // Two attribute chips, the status/duration filters are NOT chips.
    expect(container.querySelectorAll('.plqPill')).toHaveLength(2);
    expect(getByText('serviceName = cart')).toBeInTheDocument();
    expect(getByText('attributes.http.method = GET')).toBeInTheDocument();
    expect(queryByText('isError = true')).toBeNull();
    // Renders inside the "Filters" fieldset group.
    expect(container.querySelector('[data-test-subj="traceFilterGroup"]')).toBeInTheDocument();
  });

  it('removes a filter when its chip × is clicked', () => {
    const removeFilter = jest.fn();
    const serviceFilter = { field: 'serviceName', value: 'cart', operator: '=' as const };
    const { getByLabelText } = render(
      <TraceFilterBar {...baseProps} spanFilters={[serviceFilter]} removeFilter={removeFilter} />
    );
    fireEvent.click(getByLabelText('Remove filter'));
    expect(removeFilter).toHaveBeenCalledWith(serviceFilter);
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
