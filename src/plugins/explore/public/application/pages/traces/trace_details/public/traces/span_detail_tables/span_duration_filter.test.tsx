/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { SpanDurationFilter } from './span_duration_filter';
import { DURATION_MIN_FILTER_FIELD } from './utils';

// Ten spans with durations 1ms..10ms (in nanos).
const spans = Array.from({ length: 10 }, (_, i) => ({ durationInNanos: (i + 1) * 1e6 }));

const setup = (spanFilters: Array<{ field: string; value: any }> = []) => {
  const setSpanFiltersWithStorage = jest.fn();
  const utils = render(
    <SpanDurationFilter
      spans={spans}
      spanFilters={spanFilters}
      setSpanFiltersWithStorage={setSpanFiltersWithStorage}
    />
  );
  return { ...utils, setSpanFiltersWithStorage };
};

describe('SpanDurationFilter', () => {
  it('applies the p90 preset as a durationMin filter (in nanos)', () => {
    const { getByTestId, setSpanFiltersWithStorage } = setup();
    fireEvent.click(getByTestId('span-duration-filter-button'));
    // p90 of 1..10ms = 9ms = 9e6 nanos.
    fireEvent.click(getByTestId('span-duration-filter-p90'));
    expect(setSpanFiltersWithStorage).toHaveBeenCalledWith([
      { field: DURATION_MIN_FILTER_FIELD, value: 9e6 },
    ]);
  });

  it('applies the p99 preset', () => {
    const { getByTestId, setSpanFiltersWithStorage } = setup();
    fireEvent.click(getByTestId('span-duration-filter-button'));
    fireEvent.click(getByTestId('span-duration-filter-p99'));
    expect(setSpanFiltersWithStorage).toHaveBeenCalledWith([
      { field: DURATION_MIN_FILTER_FIELD, value: 10e6 },
    ]);
  });

  it('applies a typed minimum (ms → nanos) and replaces any existing duration filter', () => {
    const { getByTestId, setSpanFiltersWithStorage } = setup([
      { field: DURATION_MIN_FILTER_FIELD, value: 1e6 },
      { field: 'isError', value: true },
    ]);
    fireEvent.click(getByTestId('span-duration-filter-button'));
    fireEvent.change(getByTestId('span-duration-filter-input'), { target: { value: '5' } });
    fireEvent.click(getByTestId('span-duration-filter-apply'));
    // Keeps the isError filter, replaces the prior duration filter with 5ms.
    expect(setSpanFiltersWithStorage).toHaveBeenCalledWith([
      { field: 'isError', value: true },
      { field: DURATION_MIN_FILTER_FIELD, value: 5e6 },
    ]);
  });

  it('clears the duration filter', () => {
    const { getByTestId, setSpanFiltersWithStorage } = setup([
      { field: DURATION_MIN_FILTER_FIELD, value: 5e6 },
    ]);
    fireEvent.click(getByTestId('span-duration-filter-button'));
    fireEvent.click(getByTestId('span-duration-filter-clear'));
    expect(setSpanFiltersWithStorage).toHaveBeenCalledWith([]);
  });

  it('shows the active threshold as a badge', () => {
    const { getByText } = setup([{ field: DURATION_MIN_FILTER_FIELD, value: 5e6 }]);
    expect(getByText('≥ 5ms')).toBeInTheDocument();
  });
});
