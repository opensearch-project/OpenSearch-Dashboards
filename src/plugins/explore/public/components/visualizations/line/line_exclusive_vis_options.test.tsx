/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LineExclusiveVisOptions, LineStyle } from './line_exclusive_vis_options';

// Mock the debounced value hook
jest.mock('../utils/use_debounced_value', () => ({
  useDebouncedNumber: jest.fn((value, onChange, options) => {
    return [value, (newValue: string) => onChange(parseFloat(newValue))];
  }),
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
  };

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
    expect(smoothInput).toBeChecked();
  });
});
