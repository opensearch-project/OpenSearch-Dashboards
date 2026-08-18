/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { BarExclusiveVisOptions } from './bar_exclusive_vis_options';
import { StackMode } from '../types';

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
    stackMode: 'none' as StackMode,
    onBarSizeModeChange: jest.fn(),
    onBarWidthChange: jest.fn(),
    onBarPaddingChange: jest.fn(),
    onShowBarBorderChange: jest.fn(),
    onBarBorderWidthChange: jest.fn(),
    onBarBorderColorChange: jest.fn(),
    onUseThresholdColorChange: jest.fn(),
    onStackModeChange: jest.fn(),
    onBarRadiusChange: jest.fn(),
    onShowValuesChange: jest.fn(),
    onFillOpacityChange: jest.fn(),
  };

  // EuiButtonGroup marks the selection on the label rather than the input
  const isSelected = (testSubj: string) =>
    screen.getByTestId(testSubj).classList.contains('euiButtonGroupButton-isSelected') ||
    screen.getByTestId(testSubj).classList.contains('ouiButtonGroupButton-isSelected');

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
    expect(barWidthInput).toHaveValue(70);
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
    fireEvent.change(barWidthInput, { target: { value: '80' } });

    // Check if the callback was called with the correct value
    expect(defaultProps.onBarWidthChange).toHaveBeenCalledWith(0.8);
  });

  test('calls onFillOpacityChange with a 0-1 fraction when the 0-100 slider changes', () => {
    const onFillOpacityChange = jest.fn();
    render(
      <BarExclusiveVisOptions
        {...defaultProps}
        fillOpacity={0.5}
        onFillOpacityChange={onFillOpacityChange}
      />
    );

    // Slider is shown on a 0-100 scale but the value is stored as a 0-1 fraction.
    fireEvent.change(screen.getByTestId('barFillOpacity'), { target: { value: '80' } });

    expect(onFillOpacityChange).toHaveBeenCalledWith(0.8);
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
    expect(screen.getByText('Percentage Value between 1 and 100')).toBeInTheDocument();
  });

  test('renders form labels correctly', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    expect(screen.getByText('Width')).toBeInTheDocument();
    expect(screen.getByText('Show border')).toBeInTheDocument();
  });

  test('renders border form labels when showBarBorder is true', () => {
    render(<BarExclusiveVisOptions {...defaultProps} showBarBorder={true} />);

    // Check if border-related labels are rendered
    expect(screen.getByText('Border width')).toBeInTheDocument();
    expect(screen.getByText('Border color')).toBeInTheDocument();
  });

  test('renders the three stack mode options', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    expect(screen.getByTestId('barStackModeButtonGroup')).toBeInTheDocument();
    expect(screen.getByTestId('barStackMode-none')).toBeInTheDocument();
    expect(screen.getByTestId('barStackMode-total')).toBeInTheDocument();
    expect(screen.getByTestId('barStackMode-percentage')).toBeInTheDocument();
  });

  test('defaults the stack mode selection to none', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    expect(isSelected('barStackMode-none')).toBe(true);
    expect(isSelected('barStackMode-total')).toBe(false);
    expect(isSelected('barStackMode-percentage')).toBe(false);
  });

  test.each([
    ['barStackMode-total', 'total'],
    ['barStackMode-percentage', 'percentage'],
  ])('calls onStackModeChange when %s is selected', (testSubj, expected) => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    fireEvent.click(screen.getByTestId(testSubj));

    expect(defaultProps.onStackModeChange).toHaveBeenCalledWith(expected);
  });

  test('marks the current stack mode as selected', () => {
    render(<BarExclusiveVisOptions {...defaultProps} stackMode="percentage" />);

    expect(isSelected('barStackMode-percentage')).toBe(true);
    expect(isSelected('barStackMode-none')).toBe(false);
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

  test('renders the bar radius slider with the current value', () => {
    render(<BarExclusiveVisOptions {...defaultProps} barRadius={8} />);

    expect(screen.getByText('Radius')).toBeInTheDocument();
    expect(screen.getByTestId('barRadiusRange')).toHaveValue('8');
  });

  test('defaults the bar radius to sharp corners', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    expect(screen.getByTestId('barRadiusRange')).toHaveValue('0');
  });

  test('calls onBarRadiusChange when the radius is changed', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    fireEvent.change(screen.getByTestId('barRadiusRange'), { target: { value: '12' } });

    expect(defaultProps.onBarRadiusChange).toHaveBeenCalledWith(12);
  });

  test('renders the show values switch unchecked by default', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    const showValuesSwitch = screen.getByTestId('barShowValuesSwitch');
    expect(showValuesSwitch).toBeInTheDocument();
    expect(showValuesSwitch).not.toBeChecked();
    expect(screen.getByText('Show values')).toBeInTheDocument();
  });

  test('calls onShowValuesChange when show values is toggled', () => {
    render(<BarExclusiveVisOptions {...defaultProps} />);

    fireEvent.click(screen.getByTestId('barShowValuesSwitch'));

    expect(defaultProps.onShowValuesChange).toHaveBeenCalledWith(true);
  });

  test('does not render radius or show values for histogram type', () => {
    render(<BarExclusiveVisOptions {...defaultProps} type="histogram" />);

    expect(screen.queryByTestId('barRadiusRange')).not.toBeInTheDocument();
    expect(screen.queryByTestId('barShowValuesSwitch')).not.toBeInTheDocument();
  });
});
