/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BasicVisOptions } from './basic_vis_options';
import { Positions } from '../utils/collections';

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

describe('BasicVisOptions', () => {
  const defaultProps = {
    addTooltip: true,
    addLegend: true,
    legendPosition: Positions.RIGHT,
    addTimeMarker: false,
    showLine: true,
    lineMode: 'smooth',
    lineWidth: 2,
    showDots: true,
    onAddTooltipChange: jest.fn(),
    onAddLegendChange: jest.fn(),
    onLegendPositionChange: jest.fn(),
    onAddTimeMarkerChange: jest.fn(),
    onShowLineChange: jest.fn(),
    onLineModeChange: jest.fn(),
    onLineWidthChange: jest.fn(),
    onShowDotsChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<BasicVisOptions {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders basic settings title', () => {
    render(<BasicVisOptions {...defaultProps} />);
    expect(screen.getByText('Basic Settings')).toBeInTheDocument();
  });

  it('calls onShowLineChange when show line switch is toggled', () => {
    render(<BasicVisOptions {...defaultProps} />);
    const showLineSwitch = screen.getAllByRole('switch')[0];
    fireEvent.click(showLineSwitch);
    expect(defaultProps.onShowLineChange).toHaveBeenCalledWith(false);
  });

  it('calls onLineModeChange when line mode is changed', () => {
    render(<BasicVisOptions {...defaultProps} />);
    const lineModeSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(lineModeSelect, { target: { value: 'straight' } });
    expect(defaultProps.onLineModeChange).toHaveBeenCalledWith('straight');
  });

  it('calls onLineWidthChange with debounced value when line width is changed', async () => {
    render(<BasicVisOptions {...defaultProps} />);
    const lineWidthInput = screen.getByRole('spinbutton');
    fireEvent.change(lineWidthInput, { target: { value: '5' } });

    await waitFor(() => {
      expect(defaultProps.onLineWidthChange).toHaveBeenCalledWith(5);
    });
  });

  it('calls onShowDotsChange when show dots switch is toggled', () => {
    render(<BasicVisOptions {...defaultProps} />);
    const showDotsSwitch = screen.getAllByRole('switch')[1];
    fireEvent.click(showDotsSwitch);
    expect(defaultProps.onShowDotsChange).toHaveBeenCalledWith(false);
  });

  it('calls onAddLegendChange when show legend switch is toggled', () => {
    render(<BasicVisOptions {...defaultProps} />);
    const showLegendSwitch = screen.getAllByRole('switch')[2];
    fireEvent.click(showLegendSwitch);
    expect(defaultProps.onAddLegendChange).toHaveBeenCalledWith(false);
  });

  it('calls onLegendPositionChange when legend position is changed', () => {
    render(<BasicVisOptions {...defaultProps} />);
    const legendPositionSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(legendPositionSelect, { target: { value: Positions.BOTTOM } });
    expect(defaultProps.onLegendPositionChange).toHaveBeenCalledWith(Positions.BOTTOM);
  });

  it('calls onAddTooltipChange when show tooltip switch is toggled', () => {
    render(<BasicVisOptions {...defaultProps} />);
    const showTooltipSwitch = screen.getAllByRole('switch')[3];
    fireEvent.click(showTooltipSwitch);
    expect(defaultProps.onAddTooltipChange).toHaveBeenCalledWith(false);
  });

  it('calls onAddTimeMarkerChange when show time marker switch is toggled', () => {
    render(<BasicVisOptions {...defaultProps} />);
    const showTimeMarkerSwitch = screen.getAllByRole('switch')[4];
    fireEvent.click(showTimeMarkerSwitch);
    expect(defaultProps.onAddTimeMarkerChange).toHaveBeenCalledWith(true);
  });

  it('disables line mode and line width inputs when show line is false', () => {
    const props = {
      ...defaultProps,
      showLine: false,
    };
    render(<BasicVisOptions {...props} />);

    const lineModeSelect = screen.getAllByRole('combobox')[0];
    const lineWidthInput = screen.getByRole('spinbutton');

    expect(lineModeSelect).toBeDisabled();
    expect(lineWidthInput).toBeDisabled();
  });

  it('hides legend position select when show legend is false', () => {
    const props = {
      ...defaultProps,
      addLegend: false,
    };
    render(<BasicVisOptions {...props} />);

    expect(screen.queryByText('Legend position')).not.toBeInTheDocument();
  });
});
