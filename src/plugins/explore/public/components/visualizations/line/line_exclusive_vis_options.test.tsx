/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { LineExclusiveVisOptions, LineStyle } from './line_exclusive_vis_options';
import { DisableMode } from '../types';

// Mock the debounced value hook
jest.mock('../utils/use_debounced_value', () => ({
  useDebouncedNumber: jest.fn((value, onChange, options) => {
    return [value, (newValue: string) => onChange(parseFloat(newValue))];
  }),
  // Used by the threshold text inputs via DebouncedFieldText
  useDebouncedValue: jest.fn((value, onChange) => [value, onChange]),
}));

describe('LineExclusiveVisOptions', () => {
  const defaultProps = {
    addTimeMarker: false,
    lineStyle: 'both' as LineStyle,
    lineMode: 'straight' as const,
    lineWidth: 2,
    onAddTimeMarkerChange: jest.fn(),
    onLineModeChange: jest.fn(),
    onLineWidthChange: jest.fn(),
    onLineStyleChange: jest.fn(),
    onPointSizeChange: jest.fn(),
    onShowValuesChange: jest.fn(),
    connectNullValues: {
      connectMode: DisableMode.Never,
      threshold: '1h',
    },
    disconnectValues: {
      disableMode: DisableMode.Never,
      threshold: '1h',
    },
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

  test('renders with default props', () => {
    render(<LineExclusiveVisOptions {...defaultProps} />);

    expect(screen.getByText('Line')).toBeInTheDocument();
    expect(screen.getAllByText('Style')).toHaveLength(2);
    expect(screen.getAllByText('Interpolation')).toHaveLength(2);
    expect(screen.getByText('Line width')).toBeInTheDocument();
    expect(screen.getByText('Show current time marker')).toBeInTheDocument();
  });

  test('renders line style options correctly', () => {
    render(<LineExclusiveVisOptions {...defaultProps} />);

    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Line only')).toBeInTheDocument();
    expect(screen.getByText('Dots only')).toBeInTheDocument();
  });

  test('renders line mode options correctly', () => {
    render(<LineExclusiveVisOptions {...defaultProps} />);

    expect(screen.getByText('Straight')).toBeInTheDocument();
    expect(screen.getByText('Smooth')).toBeInTheDocument();
    expect(screen.getByText('Stepped')).toBeInTheDocument();
  });

  test('calls onLineStyleChange when line style is changed', () => {
    render(<LineExclusiveVisOptions {...defaultProps} />);

    const lineOnlyButton = screen.getByText('Line only');
    fireEvent.click(lineOnlyButton);

    expect(defaultProps.onLineStyleChange).toHaveBeenCalledWith('line');
  });

  test('calls onLineModeChange when line mode is changed', () => {
    render(<LineExclusiveVisOptions {...defaultProps} />);

    const smoothButton = screen.getByTestId('smooth');
    fireEvent.click(smoothButton);

    expect(defaultProps.onLineModeChange).toHaveBeenCalled();
    expect(defaultProps.onLineModeChange.mock.calls[0][0]).toBe('smooth');
  });

  test('calls onLineWidthChange when line width is changed', () => {
    render(<LineExclusiveVisOptions {...defaultProps} />);

    const lineWidthInput = screen.getByRole('slider');
    fireEvent.change(lineWidthInput, { target: { value: '5' } });

    expect(defaultProps.onLineWidthChange).toHaveBeenCalledWith(5);
  });

  test('calls onAddTimeMarkerChange when time marker switch is toggled', () => {
    render(<LineExclusiveVisOptions {...defaultProps} />);

    const timeMarkerSwitch = screen.getByRole('switch');
    fireEvent.click(timeMarkerSwitch);

    expect(defaultProps.onAddTimeMarkerChange).toHaveBeenCalledWith(true);
  });

  test('renders with time marker enabled', () => {
    render(<LineExclusiveVisOptions {...defaultProps} addTimeMarker={true} />);

    const timeMarkerSwitch = screen.getByRole('switch');
    expect(timeMarkerSwitch).toBeChecked();
  });

  test('renders with different line style selected', () => {
    render(<LineExclusiveVisOptions {...defaultProps} lineStyle="dots" />);

    const dotsInput = screen.getByTestId('dots');
    expect(dotsInput).toHaveAttribute('checked', '');
  });

  test('renders with different line mode selected', () => {
    render(<LineExclusiveVisOptions {...defaultProps} lineMode="smooth" />);

    const smoothInput = screen.getByTestId('smooth');
    // The EUI test-env stubs htmlIdGenerator to a constant, so every button group's
    // radios share a `name` and jsdom lets the last group win the checked state.
    // Assert on the rendered attribute instead, like the line style test above.
    // expect(smoothInput).toBeChecked();
    expect(smoothInput).toHaveAttribute('checked', '');
  });

  describe('point size and value label controls', () => {
    test.each(['both', 'line'] as LineStyle[])(
      'hides both controls when the line style is %s',
      (lineStyle) => {
        // Point size and value labels are only offered for the dots-only style
        render(<LineExclusiveVisOptions {...defaultProps} lineStyle={lineStyle} />);

        expect(screen.queryByTestId('linePointSizeRange')).not.toBeInTheDocument();
        expect(screen.queryByTestId('lineShowValuesSwitch')).not.toBeInTheDocument();
      }
    );

    test('renders both controls when the line style is dots', () => {
      render(<LineExclusiveVisOptions {...defaultProps} lineStyle="dots" />);

      expect(screen.getByTestId('linePointSizeRange')).toBeInTheDocument();
      expect(screen.getByTestId('lineShowValuesSwitch')).toBeInTheDocument();
    });

    test('reflects the current point size', () => {
      render(<LineExclusiveVisOptions {...defaultProps} lineStyle="dots" pointSize={9} />);

      expect(screen.getByTestId('linePointSizeRange')).toHaveValue('9');
    });

    test('calls onPointSizeChange when the slider moves', () => {
      render(<LineExclusiveVisOptions {...defaultProps} lineStyle="dots" />);

      fireEvent.change(screen.getByTestId('linePointSizeRange'), { target: { value: '11' } });

      expect(defaultProps.onPointSizeChange).toHaveBeenCalledWith(11);
    });

    test('reflects the current show values state', () => {
      render(<LineExclusiveVisOptions {...defaultProps} lineStyle="dots" showValues={true} />);

      expect(screen.getByTestId('lineShowValuesSwitch')).toBeChecked();
    });

    test('calls onShowValuesChange when the switch is toggled', () => {
      render(<LineExclusiveVisOptions {...defaultProps} lineStyle="dots" />);

      fireEvent.click(screen.getByTestId('lineShowValuesSwitch'));

      expect(defaultProps.onShowValuesChange).toHaveBeenCalledWith(true);
    });
  });

  describe('connect / disconnect controls', () => {
    test('renders both button groups with their options', () => {
      render(<LineExclusiveVisOptions {...defaultProps} />);

      expect(screen.getByTestId('lineConnectNullValuesButtonGroup')).toBeInTheDocument();
      expect(screen.getByTestId('lineConnectNullValues-never')).toBeInTheDocument();
      expect(screen.getByTestId('lineConnectNullValues-always')).toBeInTheDocument();
      expect(screen.getByTestId('lineConnectNullValues-threshold')).toBeInTheDocument();

      expect(screen.getByTestId('lineDisconnectValuesButtonGroup')).toBeInTheDocument();
      expect(screen.getByTestId('lineDisconnectValues-never')).toBeInTheDocument();
      expect(screen.getByTestId('lineDisconnectValues-threshold')).toBeInTheDocument();
    });

    test('hides both threshold inputs while neither mode uses a threshold', () => {
      render(<LineExclusiveVisOptions {...defaultProps} />);

      expect(screen.queryByTestId('lineConnectNullValuesThreshold')).not.toBeInTheDocument();
      expect(screen.queryByTestId('lineDisconnectValuesThreshold')).not.toBeInTheDocument();
    });

    test('calls onConnectNullValuesChange and keeps the existing threshold', () => {
      render(
        <LineExclusiveVisOptions
          {...defaultProps}
          connectNullValues={{ connectMode: DisableMode.Never, threshold: '30m' }}
        />
      );

      fireEvent.click(screen.getByTestId('lineConnectNullValues-always'));

      expect(defaultProps.onConnectNullValuesChange).toHaveBeenCalledWith({
        connectMode: DisableMode.Always,
        threshold: '30m',
      });
    });

    test('calls onDisconnectValuesChange and keeps the existing threshold', () => {
      render(
        <LineExclusiveVisOptions
          {...defaultProps}
          disconnectValues={{ disableMode: DisableMode.Never, threshold: '2h' }}
        />
      );

      fireEvent.click(screen.getByTestId('lineDisconnectValues-threshold'));

      expect(defaultProps.onDisconnectValuesChange).toHaveBeenCalledWith({
        disableMode: DisableMode.Threshold,
        threshold: '2h',
      });
    });

    test('reveals the connect threshold input in threshold mode', () => {
      render(
        <LineExclusiveVisOptions
          {...defaultProps}
          connectNullValues={{ connectMode: DisableMode.Threshold, threshold: '5m' }}
        />
      );

      expect(screen.getByTestId('lineConnectNullValuesThreshold')).toHaveValue('5m');
      expect(screen.queryByTestId('lineDisconnectValuesThreshold')).not.toBeInTheDocument();
    });

    test('reveals the disconnect threshold input in threshold mode', () => {
      render(
        <LineExclusiveVisOptions
          {...defaultProps}
          disconnectValues={{ disableMode: DisableMode.Threshold, threshold: '15m' }}
        />
      );

      expect(screen.getByTestId('lineDisconnectValuesThreshold')).toHaveValue('15m');
    });

    test('disables the disconnect group while connecting is active', () => {
      render(
        <LineExclusiveVisOptions
          {...defaultProps}
          connectNullValues={{ connectMode: DisableMode.Always, threshold: '1h' }}
        />
      );

      // EuiButtonGroup disables the whole group through its fieldset
      expect(screen.getByTestId('lineDisconnectValuesButtonGroup')).toBeDisabled();
      expect(screen.getByTestId('lineConnectNullValuesButtonGroup')).not.toBeDisabled();
    });

    test('disables the connect group while disconnecting is active', () => {
      render(
        <LineExclusiveVisOptions
          {...defaultProps}
          disconnectValues={{ disableMode: DisableMode.Threshold, threshold: '1h' }}
        />
      );

      expect(screen.getByTestId('lineConnectNullValuesButtonGroup')).toBeDisabled();
      expect(screen.getByTestId('lineDisconnectValuesButtonGroup')).not.toBeDisabled();
    });

    test('hides both groups on a non-time x-axis', () => {
      // Gaps are measured in time, so neither control means anything on a category axis
      render(<LineExclusiveVisOptions {...defaultProps} shouldShowTimeMarker={false} />);

      expect(screen.queryByTestId('lineConnectNullValuesButtonGroup')).not.toBeInTheDocument();
      expect(screen.queryByTestId('lineDisconnectValuesButtonGroup')).not.toBeInTheDocument();
    });
  });
});
