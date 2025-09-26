/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorGroupPanel } from './color_group_panel';

jest.mock('../../../visualizations/theme/default_colors', () => ({
  getColorGroups: () => ({
    reds: {
      red1: '#ff0000',
    },
    blues: {
      blue1: '#5885bfff',
    },
  }),
  resolveColor: () => '#ff0000',
}));

jest.mock('../../utils/use_debounced_value', () => ({
  useDebouncedValue: jest.fn((initialValue, onChange, delay) => {
    return [
      initialValue,
      (value: string) => {
        onChange(value);
      },
    ];
  }),
}));
describe('ColorGroupPanel', () => {
  const mockOnChange = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders two tabs', () => {
    render(<ColorGroupPanel onChange={mockOnChange} onClose={mockOnClose} />);
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('Colors')).toBeInTheDocument();
  });

  it('renders color groups', () => {
    render(<ColorGroupPanel onChange={mockOnChange} onClose={mockOnClose} />);
    expect(screen.getByTestId('colorGroupPanel')).toBeInTheDocument();
  });

  it('calls onChange and onClose when color is selected', () => {
    render(<ColorGroupPanel onChange={mockOnChange} onClose={mockOnClose} />);
    const colorButton = screen.getAllByRole('button')[0];
    fireEvent.click(colorButton);
    expect(mockOnChange).toHaveBeenCalledWith('red1');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders transparent option', () => {
    render(<ColorGroupPanel onChange={mockOnChange} onClose={mockOnClose} />);
    expect(screen.getByText('Transparent')).toBeInTheDocument();
  });
});
