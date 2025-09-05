/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThresholdCustomValues } from './threshold_custom_values';
import { Threshold } from '../../types';

describe('ThresholdCustomValues component', () => {
  const setup = (initialRanges: Threshold[] = []) => {
    const handleChange = jest.fn();
    const handleBaseColorChange = jest.fn();
    render(
      <ThresholdCustomValues
        thresholds={initialRanges}
        onThresholdValuesChange={handleChange}
        baseColor="#23A7C5"
        onBaseColorChange={handleBaseColorChange}
      />
    );
    return { handleChange };
  };

  it('renders base threshold', () => {
    setup([{ value: 0, color: '#f8f8f8ff' }]);

    expect(screen.getByTestId('exploreVisThresholdBaseColor')).toBeInTheDocument();
    expect(screen.getByTestId('exploreVisThreshold-0')).toBeInTheDocument();
  });

  it('adds a new range when "+ Add threshold" is clicked', () => {
    const { handleChange } = setup([{ value: 0, color: '#f8f8f8ff' }]);

    fireEvent.click(screen.getByText('+ Add threshold'));

    expect(handleChange.mock.calls[0][0]).toHaveLength(2);
  });

  it('updates threshold values', async () => {
    const { handleChange } = setup([{ value: 0, color: '#f8f8f8ff' }]);
    const valueInput = screen.getByTestId('exploreVisThresholdValue-0');
    fireEvent.change(valueInput, { target: { value: '5' } });

    // Wait for debounced update
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(handleChange).toHaveBeenCalledWith([{ value: 5, color: '#f8f8f8ff' }]);
  });

  it('deletes a threshold when trash icon is clicked', () => {
    const { handleChange } = setup([{ value: 0, color: '#f8f8f8ff' }]);
    const deleteButton = screen.getByTestId('exploreVisThresholdDeleteButton-0');
    fireEvent.click(deleteButton);
    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it('sort thresholds every time change a threshold value', async () => {
    const { handleChange } = setup([
      { value: 7, color: '#f8f8f8ff' },
      { value: 10, color: '#da1515ff' },
    ]);

    const valueInput = screen.getByTestId('exploreVisThresholdValue-0');
    fireEvent.change(valueInput, { target: { value: '12' } });

    // Wait for debounced update
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(handleChange).toHaveBeenCalledWith([
      { value: 10, color: '#da1515ff' },
      { value: 12, color: '#f8f8f8ff' },
    ]);
  });
});
