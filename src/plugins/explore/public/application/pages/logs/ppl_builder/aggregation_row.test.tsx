/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { AggregationRow } from './aggregation_row';
import { Aggregation } from './types';

const numericFieldOptions = ['bytes', 'latency'];
const anyFieldOptions = ['service', 'bytes', 'latency'];

const renderRow = (agg: Aggregation, idx = 0) => {
  const dispatch = jest.fn();
  const utils = render(
    <AggregationRow
      agg={agg}
      idx={idx}
      numericFieldOptions={numericFieldOptions}
      anyFieldOptions={anyFieldOptions}
      dispatch={dispatch}
    />
  );
  return { ...utils, dispatch };
};

describe('AggregationRow', () => {
  it('renders the "Show" group with the aggregation selector', () => {
    renderRow({ id: 'a', fn: 'count' });
    expect(screen.getByTestId('pplBuilderAgg-0')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderAggFn-0')).toBeInTheDocument();
    expect(screen.getByText('Count')).toBeInTheDocument();
  });

  it('omits the field picker and function menu for count (no field needed)', () => {
    renderRow({ id: 'a', fn: 'count' });
    expect(screen.queryByTestId('pplBuilderAggField-0')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pplBuilderAddFn-0')).not.toBeInTheDocument();
  });

  it('renders the field picker and ƒx function menu for a field-based aggregation', () => {
    renderRow({ id: 'a', fn: 'avg', field: 'bytes' });
    expect(screen.getByTestId('pplBuilderAggField-0')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderAddFn-0')).toBeInTheDocument();
  });

  it('offers only numeric fields for a numeric-only aggregation', () => {
    renderRow({ id: 'a', fn: 'avg', field: 'bytes' });
    fireEvent.click(screen.getByTestId('pplBuilderAggField-0'));
    expect(screen.getByTestId('pplBuilderFieldOption-bytes')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderFieldOption-latency')).toBeInTheDocument();
    expect(screen.queryByTestId('pplBuilderFieldOption-service')).not.toBeInTheDocument();
  });

  it('offers any aggregatable field for a non-numeric aggregation', () => {
    renderRow({ id: 'a', fn: 'min', field: 'service' });
    fireEvent.click(screen.getByTestId('pplBuilderAggField-0'));
    expect(screen.getByTestId('pplBuilderFieldOption-service')).toBeInTheDocument();
  });

  it('dispatches SET_AGGREGATION when a different aggregation is picked', () => {
    const { dispatch } = renderRow({ id: 'a', fn: 'count' });
    fireEvent.click(screen.getByTestId('pplBuilderAggFn-0'));
    fireEvent.click(screen.getByTestId('pplBuilderAggOption-sum'));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_AGGREGATION',
      index: 0,
      agg: { fn: 'sum' },
    });
  });

  it('dispatches SET_AGGREGATION when a field is chosen', () => {
    const { dispatch } = renderRow({ id: 'a', fn: 'avg', field: '' });
    fireEvent.click(screen.getByTestId('pplBuilderAggField-0'));
    fireEvent.click(screen.getByTestId('pplBuilderFieldOption-latency'));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_AGGREGATION',
      index: 0,
      agg: { field: 'latency' },
    });
  });

  it('renders a percentile input and clamps out-of-range values into [0,100]', () => {
    const { dispatch } = renderRow({ id: 'a', fn: 'percentile', field: 'bytes', percentile: 95 });
    const input = screen.getByTestId('pplBuilderAggPercentile-0');
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '150' } });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_AGGREGATION',
      index: 0,
      agg: { percentile: 100 },
    });
  });

  it('dispatches ADD_FUNCTION when a scalar function is picked from the ƒx menu', () => {
    const { dispatch } = renderRow({ id: 'a', fn: 'avg', field: 'bytes' });
    fireEvent.click(screen.getByTestId('pplBuilderAddFn-0'));
    fireEvent.click(screen.getByTestId('pplBuilderFnOption-round'));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'ADD_FUNCTION',
      index: 0,
      fn: { id: 'round', name: 'round', params: [''] },
    });
  });

  it('renders function pills, edits a param, and removes a function', () => {
    const { dispatch } = renderRow({
      id: 'a',
      fn: 'avg',
      field: 'bytes',
      functions: [{ id: 'round', name: 'round', params: ['2'] }],
    });
    expect(screen.getByTestId('pplBuilderFn-0-0')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('pplBuilderFnParam-0-0-0'), { target: { value: '3' } });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_FUNCTION_PARAM',
      index: 0,
      fnIndex: 0,
      paramIndex: 0,
      value: '3',
    });

    fireEvent.click(screen.getByTestId('pplBuilderRemoveFn-0-0'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'REMOVE_FUNCTION', index: 0, fnIndex: 0 });
  });

  it('dispatches REMOVE_AGGREGATION from the row remove button', () => {
    const { dispatch } = renderRow({ id: 'a', fn: 'count' }, 2);
    fireEvent.click(screen.getByTestId('pplBuilderRemoveAgg-2'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'REMOVE_AGGREGATION', index: 2 });
  });
});
