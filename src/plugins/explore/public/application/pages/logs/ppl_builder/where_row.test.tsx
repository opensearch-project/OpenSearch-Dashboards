/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WhereRow } from './where_row';
import { WhereFilter } from './types';

const fieldNames = ['response', 'service', 'bytes'];

// `response` and `bytes` are numeric; everything else defaults to string so the
// suggestion popover stays the default path in most tests.
const fieldTypes: Record<string, string> = { response: 'number', bytes: 'number' };
const getFieldType = (field: string): string | undefined => fieldTypes[field] ?? 'string';

const renderRow = (filters: WhereFilter[] = [], typeOverride?: (field: string) => string) => {
  const dispatch = jest.fn();
  const getValues = jest.fn().mockResolvedValue(['200', '404', '500']);
  const utils = render(
    <WhereRow
      filters={filters}
      fieldNames={fieldNames}
      getFieldType={typeOverride ?? getFieldType}
      getValues={getValues}
      dispatch={dispatch}
    />
  );
  return { ...utils, dispatch, getValues };
};

// A string field takes the suggestion-popover value editor.
const stringType = () => 'string';

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
      { id: 'f1', field: 'service', operator: 'is', values: ['auth'] },
      { id: 'f2', field: 'service', operator: 'exists', values: [] },
    ]);
    expect(screen.getByTestId('pplBuilderFilterChip-0')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderFilterChip-1')).toBeInTheDocument();
    // The `is` chip on a string field exposes a value trigger showing the value;
    // `exists` has none.
    expect(screen.getByTestId('pplBuilderFilterValue-0')).toHaveTextContent('auth');
    expect(screen.queryByTestId('pplBuilderFilterValue-1')).not.toBeInTheDocument();
  });

  it('edits the value from the suggestion popover via SET_FILTER (string field)', async () => {
    const { dispatch } = renderRow([{ id: 'f1', field: 'service', operator: 'is', values: ['a'] }]);
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

  it('accepts a custom typed value not in the suggestions (string field)', async () => {
    const { dispatch } = renderRow([{ id: 'f1', field: 'service', operator: 'is', values: [] }]);
    fireEvent.click(screen.getByTestId('pplBuilderFilterValue-0'));
    const search = await screen.findByTestId('pplBuilderFilterValue-0-search');
    fireEvent.change(search, { target: { value: 'auth' } });
    fireEvent.click(screen.getByTestId('pplBuilderFilterValueCreate-0'));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_FILTER',
      index: 0,
      filter: { values: ['auth'] },
    });
  });

  it('renders a plain text input (no popover) for a single value on a numeric field', () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'response', operator: 'is', values: ['200'] },
    ]);
    // A numeric field's value editor is a plain input, not the suggestion trigger.
    const input = screen.getByTestId('pplBuilderFilterValue-0') as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(input.value).toBe('200');
    // Editing it writes straight back through SET_FILTER — no async suggestions.
    fireEvent.change(input, { target: { value: '404' } });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_FILTER',
      index: 0,
      filter: { values: ['404'] },
    });
  });

  it('offers the between operators for a numeric field but not a string field', () => {
    const { rerender } = renderRow([
      { id: 'f1', field: 'response', operator: 'is', values: ['200'] },
    ]);
    fireEvent.click(screen.getByTestId('pplBuilderFilterOperator-0'));
    // Numeric field: `is between` is offered (mirrors Discover's type gating).
    expect(screen.getByTestId('pplBuilderFilterOperatorOption-is_between-0')).toBeInTheDocument();

    rerender(
      <WhereRow
        filters={[{ id: 'f1', field: 'service', operator: 'is', values: ['a'] }]}
        fieldNames={fieldNames}
        getFieldType={stringType}
        getValues={jest.fn().mockResolvedValue([])}
        dispatch={jest.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('pplBuilderFilterOperator-0'));
    // String field: the between operators are hidden; one-of stays available.
    expect(
      screen.queryByTestId('pplBuilderFilterOperatorOption-is_between-0')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderFilterOperatorOption-is_one_of-0')).toBeInTheDocument();
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

  it('toggles values additively for the one-of operator (string field suggestions)', async () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'service', operator: 'is_one_of', values: ['200'] },
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

  it('changes the field from the chip and resets the operator and value', () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'response', operator: 'is_between', values: ['1', '9'] },
    ]);
    fireEvent.click(screen.getByTestId('pplBuilderFilterField-0'));
    fireEvent.click(screen.getByTestId('pplBuilderFilterFieldOption-service'));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_FILTER',
      index: 0,
      filter: { field: 'service', operator: 'is', values: [] },
    });
  });

  it('does not reset when the picked field is unchanged', () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'service', operator: 'is', values: ['auth'] },
    ]);
    fireEvent.click(screen.getByTestId('pplBuilderFilterField-0'));
    fireEvent.click(screen.getByTestId('pplBuilderFilterFieldOption-service'));
    expect(dispatch).not.toHaveBeenCalled();
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
