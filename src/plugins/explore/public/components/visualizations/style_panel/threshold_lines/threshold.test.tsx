/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { ThresholdOptions } from './threshold';
import { ThresholdLineStyle } from '../../types';

describe('ThresholdOptions', () => {
  const mockThresholdLines = [
    {
      id: '1',
      color: '#54B399',
      show: true,
      style: ThresholdLineStyle.DotDashed,
      value: 50,
      width: 1,
      name: 'Threshold 1',
    },
  ];

  beforeAll(() => {
    jest.clearAllMocks();
  });
  const mockOnThresholdChange = jest.fn();

  it('renders correctly', () => {
    render(
      <ThresholdOptions
        thresholdLines={mockThresholdLines}
        onThresholdLinesChange={mockOnThresholdChange}
      />
    );
    const thresholdPanel = screen.getByTestId('thresholdPanel');
    expect(thresholdPanel).toBeInTheDocument();
  });

  it('should add a new threshold line', () => {
    render(
      <ThresholdOptions
        thresholdLines={mockThresholdLines}
        onThresholdLinesChange={mockOnThresholdChange}
      />
    );
    const addThresholdButton = screen.getByText('Add threshold');
    fireEvent.click(addThresholdButton);
    expect(mockOnThresholdChange).toHaveBeenCalledTimes(1);

    expect(mockOnThresholdChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })])
    );
  });

  it('should update threshold lines style mode', () => {
    render(
      <ThresholdOptions
        thresholdLines={mockThresholdLines}
        onThresholdLinesChange={mockOnThresholdChange}
      />
    );

    const thresholdModeGroup = screen.getByTestId('exploreVisThresholdStyle');
    const dotButton = within(thresholdModeGroup).getByTestId('dot-dashed');

    fireEvent.click(dotButton);
    expect(mockOnThresholdChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ style: ThresholdLineStyle.DotDashed })])
    );
  });

  it('should update a threshold value', async () => {
    render(
      <ThresholdOptions
        thresholdLines={mockThresholdLines}
        onThresholdLinesChange={mockOnThresholdChange}
      />
    );
    const valueInput = screen.getAllByTestId('exploreVisThresholdValue')[0];
    fireEvent.change(valueInput, { target: { value: '60' } });

    await waitFor(() => {
      expect(mockOnThresholdChange).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ value: 60 })])
      );
    });
  });

  it('should delete a threshold line', () => {
    render(
      <ThresholdOptions
        thresholdLines={mockThresholdLines}
        onThresholdLinesChange={mockOnThresholdChange}
      />
    );
    const deleteButton = screen.getAllByTestId('exploreVisThresholdDelete')[0];
    fireEvent.click(deleteButton);
    expect(mockOnThresholdChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: '1' })])
    );
  });
});
