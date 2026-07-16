/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SortRow } from './sort_row';
import { Sort } from './types';

const columns = ['service', 'count()'];

const renderRow = (sort?: Sort) => {
  const dispatch = jest.fn();
  const utils = render(<SortRow sort={sort} columns={columns} dispatch={dispatch} />);
  return { ...utils, dispatch };
};

describe('SortRow', () => {
  it('renders an "Add sort" affordance when unsorted', () => {
    renderRow(undefined);
    expect(screen.getByTestId('pplBuilderAddSort')).toBeInTheDocument();
    expect(screen.queryByTestId('pplBuilderSortChip')).not.toBeInTheDocument();
  });

  it('adds a sort on the first column (descending) from the add button', () => {
    const { dispatch } = renderRow(undefined);
    fireEvent.click(screen.getByTestId('pplBuilderAddSort'));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_SORT',
      sort: { column: 'service', desc: true },
    });
  });

  it('falls back to an empty column when there are no candidate columns', () => {
    const dispatch = jest.fn();
    render(<SortRow sort={undefined} columns={[]} dispatch={dispatch} />);
    fireEvent.click(screen.getByTestId('pplBuilderAddSort'));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_SORT',
      sort: { column: '', desc: true },
    });
  });

  it('renders the sort chip with the column and direction when sorted', () => {
    renderRow({ column: 'service', desc: true });
    expect(screen.getByTestId('pplBuilderSortChip')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderSortColumn')).toBeInTheDocument();
    expect(screen.getByText('service')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderSortDirection')).toBeInTheDocument();
  });

  it('changes the sort column via the field popover', () => {
    const { dispatch } = renderRow({ column: 'service', desc: true });
    fireEvent.click(screen.getByTestId('pplBuilderSortColumn'));
    fireEvent.click(screen.getByTestId('pplBuilderFieldOption-count()'));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_SORT',
      sort: { column: 'count()', desc: true },
    });
  });

  it('toggles the sort direction to ascending', () => {
    const { dispatch } = renderRow({ column: 'service', desc: true });
    // Open the direction super-select and pick "Asc".
    fireEvent.click(screen.getByTestId('pplBuilderSortDirection'));
    fireEvent.click(screen.getByText('Asc'));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_SORT',
      sort: { column: 'service', desc: false },
    });
  });

  it('dispatches REMOVE_SORT from the remove button', () => {
    const { dispatch } = renderRow({ column: 'service', desc: false });
    fireEvent.click(screen.getByTestId('pplBuilderRemoveSort'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'REMOVE_SORT' });
  });
});
