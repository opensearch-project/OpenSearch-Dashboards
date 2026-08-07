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
    onAddTimeMarkerChange: jest.fn(),
    onFillOpacityChange: jest.fn(),
    onGradientModeChange: jest.fn(),
  };

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

    // EuiButtonGroup puts the option id on the underlying radio input
    expect(screen.getByTestId('hue')).toBeChecked();
    expect(screen.getByTestId('none')).not.toBeChecked();
  });
});
