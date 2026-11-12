/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { ApplyToSelector } from './apply_to_selector';

// The options listed once the combo box is opened.
const openOptions = () => {
  fireEvent.click(screen.getByTestId('comboBoxSearchInput'));
  return screen.getAllByRole('option').map((option) => option.textContent);
};

describe('ApplyToSelector', () => {
  it('shows the "Select a query" placeholder, and only the queries as options', () => {
    render(<ApplyToSelector refIds={['A', 'B']} onChange={jest.fn()} />);

    expect(screen.getByText('Select a query')).toBeInTheDocument();
    expect(screen.queryByTestId('comboBoxClearButton')).not.toBeInTheDocument();
    expect(openOptions()).toEqual(['Query A', 'Query B']);
  });

  it('shows the picked query, and clears it with the x', () => {
    const onChange = jest.fn();
    render(<ApplyToSelector applyTo="A" refIds={['A', 'B']} onChange={onChange} />);

    expect(screen.getByText('Query A')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('comboBoxClearButton'));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('passes the picked query on', () => {
    const onChange = jest.fn();
    render(<ApplyToSelector refIds={['A', 'B']} onChange={onChange} />);

    fireEvent.click(screen.getByTestId('comboBoxSearchInput'));
    fireEvent.click(screen.getByText('Query B'));
    expect(onChange).toHaveBeenCalledWith('B');
  });

  it('keeps a picked query that is no longer in the input, marked not available', () => {
    render(<ApplyToSelector applyTo="C" refIds={['A', 'B']} onChange={jest.fn()} />);

    expect(screen.getByText('Query C (not available)')).toBeInTheDocument();
  });
});
