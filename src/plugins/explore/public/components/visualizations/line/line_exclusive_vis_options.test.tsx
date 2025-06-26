/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LineExclusiveVisOptions } from './line_exclusive_vis_options';
import { LineStyle } from './line_vis_config';

// Mock the debounced value hooks
jest.mock('../utils/use_debounced_value', () => {
  return {
    useDebouncedValue: jest.fn((initialValue, onChange) => {
      // Use Jest's mock function instead of React.useState
      const value = initialValue;
      const handleChange = (newValue: any) => {
        onChange(newValue);
      };
      return [value, handleChange];
    }),
    useDebouncedNumericValue: jest.fn((initialValue, onChange, options) => {
      // Use Jest's mock function instead of React.useState
      const value = initialValue;
      const handleChange = (newValue: any) => {
        onChange(Number(newValue));
      };
      return [value, handleChange];
    }),
  };
});

describe('LineExclusiveVisOptions', () => {
  const defaultProps = {
    addTimeMarker: false,
    lineStyle: 'both' as LineStyle,
    lineMode: 'smooth',
    lineWidth: 2,
    onAddTimeMarkerChange: jest.fn(),
    onLineStyleChange: jest.fn(),
    onLineModeChange: jest.fn(),
    onLineWidthChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<LineExclusiveVisOptions {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('calls onLineStyleChange when line style is changed', () => {
    render(<LineExclusiveVisOptions {...defaultProps} />);
    const lineStyleButtons = screen.getAllByRole('radio');
    fireEvent.click(lineStyleButtons[1]); // Click "Line only" option
    expect(defaultProps.onLineStyleChange).toHaveBeenCalledWith('line');
  });

  it('calls onLineModeChange when line mode is changed', () => {
    render(<LineExclusiveVisOptions {...defaultProps} />);
    const lineModeButtons = screen.getAllByRole('radio');
    // Find the "Straight" button (should be after the line style buttons)
    const straightButton = Array.from(lineModeButtons).find(
      (button) => button.getAttribute('value') === 'straight'
    );
    if (straightButton) {
      fireEvent.click(straightButton);
      expect(defaultProps.onLineModeChange).toHaveBeenCalledWith('straight');
    }
  });

  it('calls onLineWidthChange with debounced value when line width is changed', async () => {
    render(<LineExclusiveVisOptions {...defaultProps} />);
    // Find the range input for line width
    const lineWidthInput = screen.getByRole('slider');
    fireEvent.change(lineWidthInput, { target: { value: '5' } });

    await waitFor(() => {
      expect(defaultProps.onLineWidthChange).toHaveBeenCalledWith(5);
    });
  });

  it('calls onAddTimeMarkerChange when show time marker switch is toggled', () => {
    render(<LineExclusiveVisOptions {...defaultProps} />);
    const showTimeMarkerSwitch = screen.getByRole('switch');
    fireEvent.click(showTimeMarkerSwitch);
    expect(defaultProps.onAddTimeMarkerChange).toHaveBeenCalledWith(true);
  });
});
