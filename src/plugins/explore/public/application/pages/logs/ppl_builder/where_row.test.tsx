/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { WhereRow } from './where_row';
import { WhereFilter } from './types';

const fieldNames = ['response', 'service', 'bytes'];
const getValues = jest.fn().mockResolvedValue(['200', '404']);

const renderRow = (filters: WhereFilter[] = []) => {
  const dispatch = jest.fn();
  const utils = render(
    <WhereRow filters={filters} fieldNames={fieldNames} getValues={getValues} dispatch={dispatch} />
  );
  return { ...utils, dispatch };
};

describe('WhereRow', () => {
  it('renders a ghost "Where" affordance when empty', () => {
    renderRow([]);
    expect(screen.getByTestId('pplBuilderAddFilter')).toBeInTheDocument();
    expect(screen.getByText('Where')).toBeInTheDocument();
  });

  it('opens the field picker from the ghost and adds a filter on field pick', () => {
    const { dispatch } = renderRow([]);
    fireEvent.click(screen.getByTestId('pplBuilderAddFilter'));

    // Pick a field from the popover list — a fresh `is` filter is appended.
    fireEvent.click(screen.getByTestId('pplBuilderFilterFieldOption-response'));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'ADD_FILTER',
      filter: { field: 'response', operator: 'is', values: [] },
    });
  });

  it('renders an inline-editable chip per filter with the field and a value input', () => {
    renderRow([
      { id: 'f1', field: 'response', operator: 'is', values: ['200'] },
      { id: 'f2', field: 'service', operator: 'exists', values: [] },
    ]);
    expect(screen.getByTestId('pplBuilderFilterChip-0')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderFilterChip-1')).toBeInTheDocument();
    // The `is` chip exposes an editable single value; `exists` has none.
    expect((screen.getByTestId('pplBuilderFilterValue-0') as HTMLInputElement).value).toBe('200');
    expect(screen.queryByTestId('pplBuilderFilterValue-1')).not.toBeInTheDocument();
  });

  it('edits the value inline via SET_FILTER', () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'response', operator: 'is', values: ['200'] },
    ]);
    fireEvent.change(screen.getByTestId('pplBuilderFilterValue-0'), { target: { value: '500' } });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_FILTER',
      index: 0,
      filter: { values: ['500'] },
    });
  });

  it('changes the operator inline and preserves the value within the same arity', () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'response', operator: 'is', values: ['200'] },
    ]);
    fireEvent.change(screen.getByTestId('pplBuilderFilterOperator-0'), {
      target: { value: 'is_not' },
    });
    // is and is_not share arity `one`, so the value carries over.
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_FILTER',
      index: 0,
      filter: { operator: 'is_not', values: ['200'] },
    });
  });

  it('clears the value when the operator changes arity (is → is between)', () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'response', operator: 'is', values: ['200'] },
    ]);
    fireEvent.change(screen.getByTestId('pplBuilderFilterOperator-0'), {
      target: { value: 'is_between' },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_FILTER',
      index: 0,
      filter: { operator: 'is_between', values: [] },
    });
  });

  it('renders two range inputs for a between filter and writes both bounds', () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'bytes', operator: 'is_between', values: ['1', '9'] },
    ]);
    expect((screen.getByTestId('pplBuilderFilterRangeFrom-0') as HTMLInputElement).value).toBe('1');
    expect((screen.getByTestId('pplBuilderFilterRangeTo-0') as HTMLInputElement).value).toBe('9');
    fireEvent.change(screen.getByTestId('pplBuilderFilterRangeTo-0'), { target: { value: '99' } });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_FILTER',
      index: 0,
      filter: { values: ['1', '99'] },
    });
  });

  it('splits a comma-separated list for the one-of operator', () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'response', operator: 'is_one_of', values: ['200'] },
    ]);
    fireEvent.change(screen.getByTestId('pplBuilderFilterValues-0'), {
      target: { value: '200, 404, 500' },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_FILTER',
      index: 0,
      filter: { values: ['200', '404', '500'] },
    });
  });

  it('removes a filter via the chip ✕', () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'response', operator: 'is', values: ['200'] },
    ]);
    fireEvent.click(screen.getByTestId('pplBuilderRemoveFilter-0'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'REMOVE_FILTER', index: 0 });
  });

  it('adds a second condition via the inline ＋ when filters exist', () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'response', operator: 'is', values: ['200'] },
    ]);
    fireEvent.click(screen.getByTestId('pplBuilderAddFilterCondition'));
    fireEvent.click(screen.getByTestId('pplBuilderFilterFieldOption-service'));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'ADD_FILTER',
      filter: { field: 'service', operator: 'is', values: [] },
    });
  });
});
