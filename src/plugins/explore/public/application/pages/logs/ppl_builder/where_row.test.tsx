/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WhereRow } from './where_row';
import { WhereFilter } from './types';

const fieldNames = ['response', 'service', 'bytes'];

const renderRow = (filters: WhereFilter[] = []) => {
  const dispatch = jest.fn();
  const getValues = jest.fn().mockResolvedValue(['200', '404', '500']);
  const utils = render(
    <WhereRow filters={filters} fieldNames={fieldNames} getValues={getValues} dispatch={dispatch} />
  );
  return { ...utils, dispatch, getValues };
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

  it('renders an inline-editable chip per filter with the field and a value trigger', () => {
    renderRow([
      { id: 'f1', field: 'response', operator: 'is', values: ['200'] },
      { id: 'f2', field: 'service', operator: 'exists', values: [] },
    ]);
    expect(screen.getByTestId('pplBuilderFilterChip-0')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderFilterChip-1')).toBeInTheDocument();
    // The `is` chip exposes a value trigger showing the value; `exists` has none.
    expect(screen.getByTestId('pplBuilderFilterValue-0')).toHaveTextContent('200');
    expect(screen.queryByTestId('pplBuilderFilterValue-1')).not.toBeInTheDocument();
  });

  it('edits the value from the suggestion popover via SET_FILTER', async () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'response', operator: 'is', values: ['200'] },
    ]);
    fireEvent.click(screen.getByTestId('pplBuilderFilterValue-0'));
    // Suggestions load asynchronously from getValues; pick 500.
    await waitFor(() =>
      expect(screen.getByTestId('pplBuilderFilterValueOption-0-500')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByTestId('pplBuilderFilterValueOption-0-500'));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_FILTER',
      index: 0,
      filter: { values: ['500'] },
    });
  });

  it('accepts a custom typed value not in the suggestions', async () => {
    const { dispatch } = renderRow([{ id: 'f1', field: 'response', operator: 'is', values: [] }]);
    fireEvent.click(screen.getByTestId('pplBuilderFilterValue-0'));
    const search = await screen.findByTestId('pplBuilderFilterValue-0-search');
    fireEvent.change(search, { target: { value: '418' } });
    fireEvent.click(screen.getByTestId('pplBuilderFilterValueCreate-0'));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_FILTER',
      index: 0,
      filter: { values: ['418'] },
    });
  });

  it('changes the operator from the popover and preserves the value within the same arity', () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'response', operator: 'is', values: ['200'] },
    ]);
    fireEvent.click(screen.getByTestId('pplBuilderFilterOperator-0'));
    fireEvent.click(screen.getByTestId('pplBuilderFilterOperatorOption-is_not-0'));
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
    fireEvent.click(screen.getByTestId('pplBuilderFilterOperator-0'));
    fireEvent.click(screen.getByTestId('pplBuilderFilterOperatorOption-is_between-0'));
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

  it('toggles values additively for the one-of operator', async () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'response', operator: 'is_one_of', values: ['200'] },
    ]);
    fireEvent.click(screen.getByTestId('pplBuilderFilterValues-0'));
    await waitFor(() =>
      expect(screen.getByTestId('pplBuilderFilterValueOption-0-404')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByTestId('pplBuilderFilterValueOption-0-404'));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_FILTER',
      index: 0,
      filter: { values: ['200', '404'] },
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
