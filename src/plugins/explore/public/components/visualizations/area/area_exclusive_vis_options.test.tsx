/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { AreaExclusiveVisOptions } from './area_exclusive_vis_options';
import { defaultAreaChartStyles } from './area_vis_config';
import { DisableMode } from '../types';

jest.mock('../utils/use_debounced_value', () => ({
  useDebouncedNumber: jest.fn((value, onChange) => {
    return [value, (newValue: string) => onChange(parseFloat(newValue))];
  }),
  // Used by the threshold text inputs via DebouncedFieldText
  useDebouncedValue: jest.fn((value, onChange) => [value, onChange]),
}));

describe('AreaExclusiveVisOptions', () => {
  const defaultProps = {
    addTimeMarker: false,
    areaOpacity: 30,
    gradientMode: 'none' as const,
    stackMode: 'none' as const,
    connectNullValues: {
      connectMode: DisableMode.Never,
      threshold: '1h',
    },
    disconnectValues: {
      disableMode: DisableMode.Never,
      threshold: '1h',
    },
    onAddTimeMarkerChange: jest.fn(),
    onFillOpacityChange: jest.fn(),
    onGradientModeChange: jest.fn(),
    onStackModeChange: jest.fn(),
    onLineDashStyleChange: jest.fn(),
    onLineModeChange: jest.fn(),
    onLineWidthChange: jest.fn(),
    onPointSizeChange: jest.fn(),
    onShowValuesChange: jest.fn(),
    onConnectNullValuesChange: jest.fn(),
    onDisconnectValuesChange: jest.fn(),
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
    render(<AreaExclusiveVisOptions {...defaultProps} isTimeBased={false} />);

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

    // Addressed by test subj rather than by role: the border width slider is a
    // second `slider` on the panel, so the role query is ambiguous now.
    fireEvent.change(screen.getByTestId('areaFillOpacityRange'), { target: { value: '80' } });

    expect(defaultProps.onFillOpacityChange).toHaveBeenCalledWith(80);
  });

  test('reflects the current fill opacity value', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} areaOpacity={75} />);

    expect(screen.getByTestId('areaFillOpacityRange')).toHaveValue('75');
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
    expect(screen.getByTestId('areaStackMode-total')).toBeInTheDocument();
    expect(screen.getByTestId('areaStackMode-percentage')).toBeInTheDocument();
    expect(screen.getByTestId('areaStackMode-percentage')).toHaveTextContent('Percentage');
  });

  test('defaults the stack mode selection to none', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} stackMode={undefined} />);

    expect(isSelected('areaStackMode-none')).toBe(true);
    expect(isSelected('areaStackMode-total')).toBe(false);
    expect(isSelected('areaStackMode-percentage')).toBe(false);
  });

  test('calls onStackModeChange when a stack mode is selected', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} />);

    fireEvent.click(screen.getByTestId('areaStackMode-percentage'));

    expect(defaultProps.onStackModeChange).toHaveBeenCalledWith('percentage');
  });

  test('marks the current stack mode as selected', () => {
    render(<AreaExclusiveVisOptions {...defaultProps} stackMode="total" />);

    expect(isSelected('areaStackMode-total')).toBe(true);
    expect(isSelected('areaStackMode-none')).toBe(false);
  });

  describe('border line controls', () => {
    test('renders the dash style, interpolation, and width controls', () => {
      render(<AreaExclusiveVisOptions {...defaultProps} />);

      expect(screen.getByTestId('lineDashStyle-solid')).toBeInTheDocument();
      expect(screen.getByTestId('lineDashStyle-dashed')).toBeInTheDocument();
      expect(screen.getByTestId('lineDashStyle-dotted')).toBeInTheDocument();

      expect(screen.getByTestId('lineMode-straight')).toBeInTheDocument();
      expect(screen.getByTestId('lineMode-smooth')).toBeInTheDocument();
      expect(screen.getByTestId('lineMode-stepped')).toBeInTheDocument();

      expect(screen.getByTestId('lineWidthRange')).toBeInTheDocument();
    });

    test('defaults to a solid, smooth border', () => {
      // The border was smooth before it became configurable, so an option the
      // user has never touched has to keep rendering that way.
      render(
        <AreaExclusiveVisOptions {...defaultProps} lineDashStyle={undefined} lineMode={undefined} />
      );

      expect(isSelected('lineDashStyle-solid')).toBe(true);
      expect(isSelected('lineMode-smooth')).toBe(true);
      expect(isSelected('lineMode-straight')).toBe(false);
    });

    test('marks the current dash style and interpolation as selected', () => {
      render(
        <AreaExclusiveVisOptions {...defaultProps} lineDashStyle="dotted" lineMode="stepped" />
      );

      expect(isSelected('lineDashStyle-dotted')).toBe(true);
      expect(isSelected('lineDashStyle-solid')).toBe(false);
      expect(isSelected('lineMode-stepped')).toBe(true);
      expect(isSelected('lineMode-smooth')).toBe(false);
    });

    test('calls onLineDashStyleChange when a dash style is selected', () => {
      render(<AreaExclusiveVisOptions {...defaultProps} />);

      fireEvent.click(screen.getByTestId('lineDashStyle-dashed'));

      expect(defaultProps.onLineDashStyleChange).toHaveBeenCalledWith('dashed');
    });

    test('calls onLineModeChange when an interpolation is selected', () => {
      render(<AreaExclusiveVisOptions {...defaultProps} />);

      fireEvent.click(screen.getByTestId('lineMode-straight'));

      expect(defaultProps.onLineModeChange).toHaveBeenCalledWith('straight');
    });

    test('calls onLineWidthChange when the width slider moves', () => {
      render(<AreaExclusiveVisOptions {...defaultProps} />);

      fireEvent.change(screen.getByTestId('lineWidthRange'), { target: { value: '6' } });

      expect(defaultProps.onLineWidthChange).toHaveBeenCalledWith(6);
    });

    test('reflects the current line width', () => {
      render(<AreaExclusiveVisOptions {...defaultProps} lineWidth={7} />);

      expect(screen.getByTestId('lineWidthRange')).toHaveValue('7');
    });

    test('keeps the border controls on a non-time x-axis', () => {
      // The stroke has nothing to do with the axis type
      render(<AreaExclusiveVisOptions {...defaultProps} isTimeBased={false} />);

      expect(screen.getByTestId('lineDashStyle-solid')).toBeInTheDocument();
      expect(screen.getByTestId('lineMode-smooth')).toBeInTheDocument();
      expect(screen.getByTestId('lineWidthRange')).toBeInTheDocument();
    });
  });

  describe('point size and value label controls', () => {
    test('renders both controls', () => {
      render(<AreaExclusiveVisOptions {...defaultProps} />);

      expect(screen.getByTestId('areaPointSizeRange')).toBeInTheDocument();
      expect(screen.getByTestId('areaShowValuesSwitch')).toBeInTheDocument();
    });

    test('reflects the current point size', () => {
      render(<AreaExclusiveVisOptions {...defaultProps} pointSize={12} />);

      expect(screen.getByTestId('areaPointSizeRange')).toHaveValue('12');
    });

    test('falls back to the configured default point size', () => {
      render(<AreaExclusiveVisOptions {...defaultProps} pointSize={undefined} />);

      expect(screen.getByTestId('areaPointSizeRange')).toHaveValue(
        String(defaultAreaChartStyles.pointSize)
      );
    });

    test('calls onPointSizeChange when the slider moves', () => {
      render(<AreaExclusiveVisOptions {...defaultProps} />);

      fireEvent.change(screen.getByTestId('areaPointSizeRange'), { target: { value: '8' } });

      expect(defaultProps.onPointSizeChange).toHaveBeenCalledWith(8);
    });

    test('defaults the show values switch to off', () => {
      render(<AreaExclusiveVisOptions {...defaultProps} showValues={undefined} />);

      expect(screen.getByTestId('areaShowValuesSwitch')).not.toBeChecked();
    });

    test('reflects the current show values state', () => {
      render(<AreaExclusiveVisOptions {...defaultProps} showValues={true} />);

      expect(screen.getByTestId('areaShowValuesSwitch')).toBeChecked();
    });

    test('calls onShowValuesChange when the switch is toggled', () => {
      render(<AreaExclusiveVisOptions {...defaultProps} />);

      fireEvent.click(screen.getByTestId('areaShowValuesSwitch'));

      expect(defaultProps.onShowValuesChange).toHaveBeenCalledWith(true);
    });

    test('keeps both controls on a non-time x-axis', () => {
      render(<AreaExclusiveVisOptions {...defaultProps} isTimeBased={false} />);

      expect(screen.getByTestId('areaPointSizeRange')).toBeInTheDocument();
      expect(screen.getByTestId('areaShowValuesSwitch')).toBeInTheDocument();
    });
  });

  describe('connect / disconnect controls', () => {
    test('renders both button groups with their options', () => {
      render(<AreaExclusiveVisOptions {...defaultProps} />);

      expect(screen.getByTestId('areaConnectNullValuesButtonGroup')).toBeInTheDocument();
      expect(screen.getByTestId('areaConnectNullValues-never')).toBeInTheDocument();
      expect(screen.getByTestId('areaConnectNullValues-always')).toBeInTheDocument();
      expect(screen.getByTestId('areaConnectNullValues-threshold')).toBeInTheDocument();

      expect(screen.getByTestId('areaDisconnectValuesButtonGroup')).toBeInTheDocument();
      expect(screen.getByTestId('areaDisconnectValues-never')).toBeInTheDocument();
      expect(screen.getByTestId('areaDisconnectValues-threshold')).toBeInTheDocument();
    });

    test('defaults both modes to never', () => {
      render(
        <AreaExclusiveVisOptions
          {...defaultProps}
          connectNullValues={undefined}
          disconnectValues={undefined}
        />
      );

      expect(isSelected('areaConnectNullValues-never')).toBe(true);
      expect(isSelected('areaDisconnectValues-never')).toBe(true);
    });

    test('hides both threshold inputs while neither mode uses a threshold', () => {
      render(<AreaExclusiveVisOptions {...defaultProps} />);

      expect(screen.queryByTestId('areaConnectNullValuesThreshold')).not.toBeInTheDocument();
      expect(screen.queryByTestId('areaDisconnectValuesThreshold')).not.toBeInTheDocument();
    });

    test('calls onConnectNullValuesChange and keeps the existing threshold', () => {
      render(
        <AreaExclusiveVisOptions
          {...defaultProps}
          connectNullValues={{ connectMode: DisableMode.Never, threshold: '30m' }}
        />
      );

      fireEvent.click(screen.getByTestId('areaConnectNullValues-always'));

      expect(defaultProps.onConnectNullValuesChange).toHaveBeenCalledWith({
        connectMode: DisableMode.Always,
        threshold: '30m',
      });
    });

    test('calls onDisconnectValuesChange and keeps the existing threshold', () => {
      render(
        <AreaExclusiveVisOptions
          {...defaultProps}
          disconnectValues={{ disableMode: DisableMode.Never, threshold: '2h' }}
        />
      );

      fireEvent.click(screen.getByTestId('areaDisconnectValues-threshold'));

      expect(defaultProps.onDisconnectValuesChange).toHaveBeenCalledWith({
        disableMode: DisableMode.Threshold,
        threshold: '2h',
      });
    });

    test('reveals the connect threshold input in threshold mode', () => {
      render(
        <AreaExclusiveVisOptions
          {...defaultProps}
          connectNullValues={{ connectMode: DisableMode.Threshold, threshold: '5m' }}
        />
      );

      expect(screen.getByTestId('areaConnectNullValuesThreshold')).toHaveValue('5m');
      expect(screen.queryByTestId('areaDisconnectValuesThreshold')).not.toBeInTheDocument();
    });

    test('reveals the disconnect threshold input in threshold mode', () => {
      render(
        <AreaExclusiveVisOptions
          {...defaultProps}
          disconnectValues={{ disableMode: DisableMode.Threshold, threshold: '15m' }}
        />
      );

      expect(screen.getByTestId('areaDisconnectValuesThreshold')).toHaveValue('15m');
    });

    test('disables the disconnect group while connecting is active', () => {
      render(
        <AreaExclusiveVisOptions
          {...defaultProps}
          connectNullValues={{ connectMode: DisableMode.Always, threshold: '1h' }}
        />
      );

      // EuiButtonGroup disables the whole group through its fieldset
      expect(screen.getByTestId('areaDisconnectValuesButtonGroup')).toBeDisabled();
      expect(screen.getByTestId('areaConnectNullValuesButtonGroup')).not.toBeDisabled();
    });

    test('disables the connect group while disconnecting is active', () => {
      render(
        <AreaExclusiveVisOptions
          {...defaultProps}
          disconnectValues={{ disableMode: DisableMode.Threshold, threshold: '1h' }}
        />
      );

      expect(screen.getByTestId('areaConnectNullValuesButtonGroup')).toBeDisabled();
      expect(screen.getByTestId('areaDisconnectValuesButtonGroup')).not.toBeDisabled();
    });

    test('hides both groups on a non-time x-axis', () => {
      // Gaps are measured in time, so neither control means anything on a category axis
      render(<AreaExclusiveVisOptions {...defaultProps} isTimeBased={false} />);

      expect(screen.queryByTestId('areaConnectNullValuesButtonGroup')).not.toBeInTheDocument();
      expect(screen.queryByTestId('areaDisconnectValuesButtonGroup')).not.toBeInTheDocument();
      // The fill controls are axis-independent, so they stay
      expect(screen.getByTestId('areaFillOpacityRange')).toBeInTheDocument();
    });
  });
});
