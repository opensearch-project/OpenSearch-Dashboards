/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { AreaExclusiveVisOptions } from './area_exclusive_vis_options';

jest.mock('../utils/use_debounced_value', () => ({
  useDebouncedNumber: jest.fn((value, onChange) => {
    return [value, (newValue: string) => onChange(parseFloat(newValue))];
  }),
}));

describe('AreaExclusiveVisOptions', () => {
  const defaultProps = {
    addTimeMarker: false,
    areaOpacity: 30,
    gradientMode: 'none' as const,
    stackMode: 'none' as const,
    onAddTimeMarkerChange: jest.fn(),
    onFillOpacityChange: jest.fn(),
    onGradientModeChange: jest.fn(),
    onStackModeChange: jest.fn(),
  };

  // EuiButtonGroup marks the selected option on the rendered label, not on our custom test subj
  const isSelected = (testSubj: string) =>
    screen.getByTestId(testSubj).classList.contains('euiButtonGroupButton-isSelected') ||
    screen.getByTestId(testSubj).classList.contains('ouiButtonGroupButton-isSelected');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the fill opacity, gradient mode, and time marker controls', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} />);

    expect(screen.getByText('Area')).toBeInTheDocument();
    expect(screen.getByTestId('areaFillOpacityRange')).toBeInTheDocument();
    expect(screen.getByTestId('areaGradientMode-none')).toBeInTheDocument();
    expect(screen.getByTestId('areaGradientMode-opacity')).toBeInTheDocument();
    expect(screen.getByTestId('areaGradientMode-hue')).toBeInTheDocument();
    expect(screen.getByTestId('areaAddTimeMarkerSwitch')).not.toBeChecked();
  });

  test('hides only the time marker switch when shouldShowTimeMarker is false', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} shouldShowTimeMarker={false} />);

    expect(screen.queryByTestId('areaAddTimeMarkerSwitch')).not.toBeInTheDocument();
    // Fill controls are independent of the x-axis type, so they stay
    expect(screen.getByTestId('areaFillOpacityRange')).toBeInTheDocument();
    expect(screen.getByTestId('areaGradientMode-none')).toBeInTheDocument();
  });

  test('calls onAddTimeMarkerChange when the switch is toggled', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} />);

    fireEvent.click(screen.getByTestId('areaAddTimeMarkerSwitch'));

    expect(defaultProps.onAddTimeMarkerChange).toHaveBeenCalledWith(true);
  });

  test('renders with the time marker enabled', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} addTimeMarker={true} />);

    expect(screen.getByTestId('areaAddTimeMarkerSwitch')).toBeChecked();
  });

  test('calls onFillOpacityChange when the slider moves', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} />);

    fireEvent.change(screen.getByRole('slider'), { target: { value: '80' } });

    expect(defaultProps.onFillOpacityChange).toHaveBeenCalledWith(80);
  });

  test('reflects the current fill opacity value', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} areaOpacity={75} />);

    expect(screen.getByRole('slider')).toHaveValue('75');
  });

  test('calls onGradientModeChange when a gradient mode is selected', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} />);

    fireEvent.click(screen.getByTestId('areaGradientMode-opacity'));

    expect(defaultProps.onGradientModeChange).toHaveBeenCalledWith('opacity');
  });

  test('marks the selected gradient mode as checked', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} gradientMode="hue" />);

    expect(isSelected('areaGradientMode-hue')).toBe(true);
    expect(isSelected('areaGradientMode-none')).toBe(false);
  });

  test('renders the three stack mode options', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} />);

    expect(screen.getByTestId('areaStackModeButtonGroup')).toBeInTheDocument();
    expect(screen.getByTestId('areaStackMode-none')).toBeInTheDocument();
    expect(screen.getByTestId('areaStackMode-normal')).toBeInTheDocument();
    expect(screen.getByTestId('areaStackMode-percentage')).toBeInTheDocument();
    expect(screen.getByTestId('areaStackMode-percentage')).toHaveTextContent('100%');
  });

  test('defaults the stack mode selection to none', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} stackMode={undefined} />);

    expect(isSelected('areaStackMode-none')).toBe(true);
    expect(isSelected('areaStackMode-normal')).toBe(false);
    expect(isSelected('areaStackMode-percentage')).toBe(false);
  });

  test('calls onStackModeChange when a stack mode is selected', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} />);

    fireEvent.click(screen.getByTestId('areaStackMode-percentage'));

    expect(defaultProps.onStackModeChange).toHaveBeenCalledWith('percentage');
  });

  test('marks the current stack mode as selected', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} stackMode="normal" />);

    expect(isSelected('areaStackMode-normal')).toBe(true);
    expect(isSelected('areaStackMode-none')).toBe(false);
  });
});
