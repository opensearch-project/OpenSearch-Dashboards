/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BarExclusiveVisOptions } from './bar_exclusive_vis_options';

// Mock the debounced value hook
jest.mock('../utils/use_debounced_value', () => ({
  useDebouncedNumber: jest.fn((value, onChange, options) => {
    return [value, (newValue: string) => onChange(parseFloat(newValue))];
  }),
}));

describe('BarExclusiveVisOptions', () => {
  const defaultProps = {
    type: 'bar' as const,
    barSizeMode: 'manual' as 'manual' | 'auto',
    barWidth: 0.7,
    barPadding: 0.1,
    showBarBorder: false,
    barBorderWidth: 1,
    barBorderColor: '#000000',
    stackMode: 'none' as 'none' | 'total',
    onBarSizeModeChange: jest.fn(),
    onBarWidthChange: jest.fn(),
    onBarPaddingChange: jest.fn(),
    onShowBarBorderChange: jest.fn(),
    onBarBorderWidthChange: jest.fn(),
    onBarBorderColorChange: jest.fn(),
    onUseThresholdColorChange: jest.fn(),
    onStackModeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default props', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    // Check if the component renders with the correct title
    expect(screen.getByText('Bar')).toBeInTheDocument();

    // Check if the bar width input exists with correct value
    const barWidthInput = screen.getByTestId('barWidthInput');
    expect(barWidthInput).toBeInTheDocument();
    expect(barWidthInput).toHaveValue(0.7);

    // Check if the bar padding input exists with correct value
    const barPaddingInput = screen.getByTestId('barPaddingInput');
    expect(barPaddingInput).toBeInTheDocument();
    expect(barPaddingInput).toHaveValue(0.1);

    // Check if the bar border switch exists
    const barBorderSwitch = screen.getByTestId('barBorderSwitch');
    expect(barBorderSwitch).toBeInTheDocument();

    // Border options should not be visible when showBarBorder is false
    expect(screen.queryByTestId('barBorderWidthInput')).not.toBeInTheDocument();
    expect(screen.queryByTestId('barBorderColorPicker')).not.toBeInTheDocument();
  });

  test('shows border options when showBarBorder is true', () => {
    render(<BarExclusiveVisOptions {...defaultProps} showBarBorder={true} />);

    // Check that the switch is checked
    const barBorderSwitch = screen.getByTestId('barBorderSwitch');
    expect(barBorderSwitch).toBeChecked();

    // Border options should be visible when showBarBorder is true
    const barBorderWidthInput = screen.getByTestId('barBorderWidthInput');
    expect(barBorderWidthInput).toBeInTheDocument();
    expect(barBorderWidthInput).toHaveValue(1);

    // The color picker has a compound data-test-subj
    const barBorderColorPicker = screen.getByTestId(/barBorderColorPicker/);
    expect(barBorderColorPicker).toBeInTheDocument();
  });

  test('calls onBarWidthChange when bar width is changed', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    // Get the bar width input and change its value
    const barWidthInput = screen.getByTestId('barWidthInput');
    fireEvent.change(barWidthInput, { target: { value: '0.8' } });

    // Check if the callback was called with the correct value
    expect(defaultProps.onBarWidthChange).toHaveBeenCalledWith(0.8);
  });

  test('calls onBarPaddingChange when bar padding is changed', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    // Get the bar padding input and change its value
    const barPaddingInput = screen.getByTestId('barPaddingInput');
    fireEvent.change(barPaddingInput, { target: { value: '0.2' } });

    // Check if the callback was called with the correct value
    expect(defaultProps.onBarPaddingChange).toHaveBeenCalledWith(0.2);
  });

  test('calls onShowBarBorderChange when show bar border is toggled', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    // Find the switch and click it
    const barBorderSwitch = screen.getByTestId('barBorderSwitch');
    fireEvent.click(barBorderSwitch);

    // Check if the callback was called with the correct value
    expect(defaultProps.onShowBarBorderChange).toHaveBeenCalledWith(true);
  });

  test('calls onBarBorderWidthChange when border width is changed', () => {
    render(<BarExclusiveVisOptions {...defaultProps} showBarBorder={true} />);

    // Get the border width input and change its value
    const barBorderWidthInput = screen.getByTestId('barBorderWidthInput');
    fireEvent.change(barBorderWidthInput, { target: { value: '2' } });

    // Check if the callback was called with the correct value
    expect(defaultProps.onBarBorderWidthChange).toHaveBeenCalledWith(2);
  });

  test('renders color picker with correct color', () => {
    render(<BarExclusiveVisOptions {...defaultProps} showBarBorder={true} />);

    // For EuiColorPicker, we'll test that it's rendered
    // The data-test-subj includes both euiColorPickerAnchor and barBorderColorPicker
    const barBorderColorPicker = screen.getByTestId(/barBorderColorPicker/);
    expect(barBorderColorPicker).toBeInTheDocument();
    expect(barBorderColorPicker).toHaveValue('#000000');
  });

  test('renders help text for inputs', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    // Check if help text is rendered for bar width
    expect(screen.getByText('Value between 0.1 and 1')).toBeInTheDocument();

    // Check if help text is rendered for bar padding
    expect(screen.getByText('Value between 0 and 0.5')).toBeInTheDocument();
  });

  test('renders form labels correctly', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    expect(screen.getByText('Width')).toBeInTheDocument();
    expect(screen.getByText('Padding')).toBeInTheDocument();
    expect(screen.getByText('Show border')).toBeInTheDocument();
  });

  test('renders border form labels when showBarBorder is true', () => {
    render(<BarExclusiveVisOptions {...defaultProps} showBarBorder={true} />);

    // Check if border-related labels are rendered
    expect(screen.getByText('Border width')).toBeInTheDocument();
    expect(screen.getByText('Border color')).toBeInTheDocument();
  });

  test('renders stack mode options correctly', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    // Check if the stack mode button group exists
    const stackModeButtonGroup = screen.getByTestId('barStackModeButtonGroup');
    expect(stackModeButtonGroup).toBeInTheDocument();

    // Check if the "None" and "Stacked" buttons exist
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.getByText('Stacked')).toBeInTheDocument();

    // Check if the stack mode label is rendered (using getAllByText to handle multiple matches)
    expect(screen.getAllByText('Stack')).toHaveLength(2); // label and legend
  });

  test('calls onStackModeChange when stack mode is changed', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    // Find and click the "Stacked" button
    const stackedButton = screen.getByText('Stacked');
    fireEvent.click(stackedButton);

    // Check if the callback was called with the correct value
    expect(defaultProps.onStackModeChange).toHaveBeenCalledWith('total');
  });

  test('renders with stacked mode selected', () => {
    render(<BarExclusiveVisOptions {...defaultProps} stackMode="total" />);

    // The "Stacked" button should be selected
    const stackedButton = screen.getByText('Stacked');
    expect(stackedButton.closest('label')).toHaveClass('euiButtonGroupButton-isSelected');
  });

  test('renders use threshold color switch correctly', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    // Check if the use threshold color switch exists
    const thresholdColorSwitch = screen.getByTestId('useThresholdColorButton');
    expect(thresholdColorSwitch).toBeInTheDocument();
    expect(screen.getByText('Use threshold colors')).toBeInTheDocument();
  });

  test('calls onUseThresholdColorChange when threshold color is toggled', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    // Find the switch and click it
    const thresholdColorSwitch = screen.getByTestId('useThresholdColorButton');
    fireEvent.click(thresholdColorSwitch);

    // Check if the callback was called with the correct value
    expect(defaultProps.onUseThresholdColorChange).toHaveBeenCalledWith(true);
  });

  test('does not render stack mode options for histogram type', () => {
    render(<BarExclusiveVisOptions {...defaultProps} type="histogram" />);

    // Stack mode options should not be visible for histogram
    expect(screen.queryByTestId('barStackModeButtonGroup')).not.toBeInTheDocument();
    expect(screen.queryByText('None')).not.toBeInTheDocument();
    expect(screen.queryByText('Stacked')).not.toBeInTheDocument();
  });
});
