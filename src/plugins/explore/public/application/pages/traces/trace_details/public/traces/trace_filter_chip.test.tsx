/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TraceFilterChip } from './trace_filter_chip';

// Render the chip trigger and expose two "apply" buttons that invoke the editor's
// onAddFilter (onReplace) with a same-field and a different-field edit.
jest.mock('./span_attribute_filter', () => ({
  SpanAttributeFilter: ({ renderTrigger, onAddFilter }: any) => (
    <div>
      {renderTrigger(() => {}, false)}
      <button
        data-test-subj="apply-same"
        onClick={() => onAddFilter('serviceName', 'payment', '=')}
      >
        same
      </button>
      <button
        data-test-subj="apply-diff"
        onClick={() => onAddFilter('attributes.http.method', 'GET', '=')}
      >
        diff
      </button>
    </div>
  ),
}));

const filter = { field: 'serviceName', value: 'cart', operator: '=' as const };

const setup = () => {
  const addSpanFilter = jest.fn();
  const removeFilter = jest.fn();
  const utils = render(
    <TraceFilterChip
      filter={filter}
      fields={[]}
      spans={[]}
      addSpanFilter={addSpanFilter}
      removeFilter={removeFilter}
    />
  );
  return { ...utils, addSpanFilter, removeFilter };
};

describe('TraceFilterChip', () => {
  it('renders field · operator · value segments', () => {
    const { getByText, getByTestId } = setup();
    expect(getByText('serviceName')).toBeInTheDocument();
    expect(getByText('cart')).toBeInTheDocument();
    expect(getByTestId('trace-filter-op-serviceName').textContent).toBe('=');
  });

  it('toggles the operator in place (= ⇄ ≠)', () => {
    const { getByTestId, addSpanFilter } = setup();
    fireEvent.click(getByTestId('trace-filter-op-serviceName'));
    expect(addSpanFilter).toHaveBeenCalledWith('serviceName', 'cart', '!=');
  });

  it('removes the filter via ×', () => {
    const { getByTestId, removeFilter } = setup();
    fireEvent.click(getByTestId('trace-filter-remove-serviceName'));
    expect(removeFilter).toHaveBeenCalledWith(filter);
  });

  it('editing the same field replaces in place (no remove)', () => {
    const { getByTestId, addSpanFilter, removeFilter } = setup();
    fireEvent.click(getByTestId('apply-same'));
    expect(addSpanFilter).toHaveBeenCalledWith('serviceName', 'payment', '=');
    expect(removeFilter).not.toHaveBeenCalled();
  });

  it('changing the field removes the old filter first', () => {
    const { getByTestId, addSpanFilter, removeFilter } = setup();
    fireEvent.click(getByTestId('apply-diff'));
    expect(removeFilter).toHaveBeenCalledWith(filter);
    expect(addSpanFilter).toHaveBeenCalledWith('attributes.http.method', 'GET', '=');
  });
});
