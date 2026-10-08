/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { WhereRow } from './where_row';
import { WhereFilter } from './types';

const fieldNames = ['response', 'service', 'bytes'];

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
    // `is` on a string field has a value trigger; `exists` has none.
    expect(screen.getByTestId('pplBuilderFilterValue-0')).toHaveTextContent('auth');
    expect(screen.queryByTestId('pplBuilderFilterValue-1')).not.toBeInTheDocument();
  });

  it('edits the value from the suggestion popover via SET_FILTER (string field)', async () => {
    const { dispatch } = renderRow([{ id: 'f1', field: 'service', operator: 'is', values: ['a'] }]);
    fireEvent.click(screen.getByTestId('pplBuilderFilterValue-0'));
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

  it('does not carry stale search text across a value-operator arity change', async () => {
    const getValues = jest.fn().mockResolvedValue(['auth', 'authz']);
    const baseFilter = { id: 'f1', field: 'service', operator: 'is', values: [] } as WhereFilter;
    const props = {
      fieldNames,
      getFieldType: stringType,
      getValues,
      dispatch: jest.fn(),
    };
    const { rerender } = render(<WhereRow filters={[baseFilter]} {...props} />);

    fireEvent.click(screen.getByTestId('pplBuilderFilterValue-0'));
    fireEvent.change(await screen.findByTestId('pplBuilderFilterValue-0-search'), {
      target: { value: 'xy' },
    });

    // Switching arity `one` -> `many` must mount a fresh, empty search box.
    rerender(<WhereRow filters={[{ ...baseFilter, operator: 'is_one_of' }]} {...props} />);
    fireEvent.click(screen.getByTestId('pplBuilderFilterValues-0'));
    const search = (await screen.findByTestId(
      'pplBuilderFilterValues-0-search'
    )) as HTMLInputElement;
    expect(search.value).toBe('');
  });

  it('renders a selected custom value not in the suggestions so it can be removed (one-of)', async () => {
    // `aaa` was typed in by the user, so it is selected but not among getValues.
    const { dispatch } = renderRow(
      [{ id: 'f1', field: 'service', operator: 'is_one_of', values: ['aaa', '200'] }],
      stringType
    );
    fireEvent.click(screen.getByTestId('pplBuilderFilterValues-0'));
    const customOption = await screen.findByTestId('pplBuilderFilterValueOption-0-aaa');
    expect(customOption).toBeInTheDocument();
    fireEvent.click(customOption);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_FILTER',
      index: 0,
      filter: { values: ['200'] },
    });
  });

  it('shows an empty-string term as a muted "(empty)" marker in the chip and popover', async () => {
    const getValues = jest.fn().mockResolvedValue(['', 'auth']);
    render(
      <WhereRow
        filters={[{ id: 'f1', field: 'service', operator: 'is_one_of', values: ['', 'auth'] }]}
        fieldNames={fieldNames}
        getFieldType={stringType}
        getValues={getValues}
        dispatch={jest.fn()}
      />
    );
    const trigger = screen.getByTestId('pplBuilderFilterValues-0');
    expect(trigger).toHaveTextContent('(empty), auth');

    fireEvent.click(trigger);
    const emptyOption = await screen.findByTestId('pplBuilderFilterValueOption-0-');
    expect(emptyOption).toHaveTextContent('(empty)');
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

  it('re-fetches suggestions with the typed search term (debounced)', () => {
    jest.useFakeTimers();
    try {
      const getValues = jest.fn().mockResolvedValue(['auth', 'authz']);
      render(
        <WhereRow
          filters={[{ id: 'f1', field: 'service', operator: 'is', values: [] }]}
          fieldNames={fieldNames}
          getFieldType={stringType}
          getValues={getValues}
          dispatch={jest.fn()}
        />
      );
      // Opening the popover fetches the unfiltered list (no search term).
      fireEvent.click(screen.getByTestId('pplBuilderFilterValue-0'));
      expect(getValues).toHaveBeenLastCalledWith('service', undefined);

      const search = screen.getByTestId('pplBuilderFilterValue-0-search');
      fireEvent.change(search, { target: { value: 'aut' } });
      // Debounced: the filtered fetch fires only after the timer elapses.
      expect(getValues).toHaveBeenCalledTimes(1);
      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(getValues).toHaveBeenLastCalledWith('service', 'aut');
    } finally {
      jest.useRealTimers();
    }
  });
});
