/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  it('renders the "where" label and an Add filter affordance when empty', () => {
    renderRow([]);
    expect(screen.getByText('where')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderAddFilter')).toBeInTheDocument();
  });

  it('renders a chip per filter with a human-readable label', () => {
    renderRow([
      { id: 'f1', field: 'response', operator: 'is', values: ['200'] },
      { id: 'f2', field: 'service', operator: 'exists', values: [] },
    ]);
    expect(screen.getByTestId('pplBuilderFilterChip-0')).toBeInTheDocument();
    expect(screen.getByText('response is 200')).toBeInTheDocument();
    expect(screen.getByText('service exists')).toBeInTheDocument();
  });

  it('removes a filter via the chip ✕', () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'response', operator: 'is', values: ['200'] },
    ]);
    fireEvent.click(screen.getByTestId('pplBuilderRemoveFilter-0'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'REMOVE_FILTER', index: 0 });
  });

  it('opens the editor from Add filter and dispatches ADD_FILTER on save', async () => {
    const { dispatch } = renderRow([]);
    fireEvent.click(screen.getByTestId('pplBuilderAddFilter'));

    // Field combobox — type a field and pick it.
    const editor = await screen.findByTestId('pplBuilderFilterField');
    const fieldInput = editor.querySelector('input');
    fireEvent.change(fieldInput!, { target: { value: 'response' } });
    fireEvent.keyDown(fieldInput!, { key: 'Enter', code: 'Enter' });

    // Value combobox — enter a value.
    const values = await screen.findByTestId('pplBuilderFilterValues');
    const valueInput = values.querySelector('input');
    fireEvent.change(valueInput!, { target: { value: '200' } });
    fireEvent.keyDown(valueInput!, { key: 'Enter', code: 'Enter' });

    fireEvent.click(screen.getByTestId('pplBuilderFilterSave'));

    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ADD_FILTER',
          filter: expect.objectContaining({
            field: 'response',
            operator: 'is',
            values: ['200'],
          }),
        })
      )
    );
  });

  it('opens the editor from a chip and dispatches SET_FILTER on update', async () => {
    const { dispatch } = renderRow([
      { id: 'f1', field: 'response', operator: 'is', values: ['200'] },
    ]);
    fireEvent.click(screen.getByTestId('pplBuilderFilterChipButton-0'));
    // The editor opens pre-populated; just save to confirm the edit path fires.
    const save = await screen.findByTestId('pplBuilderFilterSave');
    fireEvent.click(save);
    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SET_FILTER', index: 0 })
      )
    );
  });
});
