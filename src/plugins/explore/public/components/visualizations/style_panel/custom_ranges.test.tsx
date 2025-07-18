/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomRange } from './custom_ranges';
import { RangeValue } from '../types';

describe('CustomRange component', () => {
  const setup = (initialRanges: RangeValue[] = []) => {
    const handleChange = jest.fn();
    render(<CustomRange customRanges={initialRanges} onCustomRangesChange={handleChange} />);
    return { handleChange };
  };

  it('renders initial ranges', () => {
    setup([
      { min: 0, max: 10 },
      { min: 10, max: 20 },
    ]);

    expect(screen.getAllByPlaceholderText('Min')).toHaveLength(2);
    expect(screen.getAllByPlaceholderText('Max')).toHaveLength(2);

    expect(screen.getAllByDisplayValue('0')).toBeTruthy();
    expect(screen.getAllByDisplayValue('10')).toBeTruthy();
  });

  it('adds a new range when "+ Add Range" is clicked', () => {
    const { handleChange } = setup([{ min: 0, max: 10 }]);

    fireEvent.click(screen.getByText('+ Add Range'));

    expect(handleChange).toHaveBeenCalledWith([
      { min: 0, max: 10 },
      { min: 10, max: undefined },
    ]);
  });

  it('updates min values', () => {
    const { handleChange } = setup([{ min: 0, max: 10 }]);

    const minInput = screen.getByPlaceholderText('Min') as HTMLInputElement;

    fireEvent.change(minInput, { target: { value: '5' } });
    expect(handleChange).toHaveBeenCalledWith([{ min: 5, max: 10 }]);
  });

  it('deletes a range when trash icon is clicked', () => {
    const { handleChange } = setup([
      { min: 0, max: 10 },
      { min: 10, max: 20 },
    ]);

    const deleteButtons = screen.getAllByLabelText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(handleChange).toHaveBeenCalledWith([{ min: 10, max: 20 }]);
  });
});
