/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScatterExclusiveVisOptions } from './scatter_exclusive_vis_options';
import { PointShape } from '../types';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

describe('ScatterExclusiveVisOptions', () => {
  const defaultProps = {
    styles: {
      pointShape: PointShape.CIRCLE,
      angle: 0,
      filled: false,
    },
    useThresholdColor: false,
    onChange: jest.fn(),
    onUseThresholdColorChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<ScatterExclusiveVisOptions {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders scatter accordion', () => {
    render(<ScatterExclusiveVisOptions {...defaultProps} />);
    expect(screen.getByText('Scatter')).toBeInTheDocument();
  });

  it('calls onChange when filled switch is toggled', () => {
    render(<ScatterExclusiveVisOptions {...defaultProps} />);
    const filledSwitch = screen.getAllByRole('switch')[1];
    fireEvent.click(filledSwitch);
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.styles,
      filled: true,
    });
  });

  it('renders shape selector with correct options', () => {
    render(<ScatterExclusiveVisOptions {...defaultProps} />);
    expect(screen.getByText('Shape')).toBeInTheDocument();

    const shapeSelector = screen.getByRole('combobox');
    expect(shapeSelector).toBeInTheDocument();
  });

  it('calls onChange when shape is changed', () => {
    render(<ScatterExclusiveVisOptions {...defaultProps} />);
    const shapeSelector = screen.getByRole('combobox');

    fireEvent.change(shapeSelector, { target: { value: PointShape.SQUARE } });

    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.styles,
      pointShape: PointShape.SQUARE,
    });
  });

  it('renders angle range slider with correct initial value', () => {
    render(<ScatterExclusiveVisOptions {...defaultProps} />);
    expect(screen.getByText('Angle')).toBeInTheDocument();

    const rangeInput = screen.getByRole('spinbutton');
    expect(rangeInput).toHaveValue(0);
  });

  it('calls onChange when angle is changed', async () => {
    render(<ScatterExclusiveVisOptions {...defaultProps} />);
    const rangeInput = screen.getByRole('spinbutton');

    fireEvent.change(rangeInput, { target: { value: '90' } });
    fireEvent.blur(rangeInput);
    await waitFor(() => {
      expect(defaultProps.onChange).toHaveBeenCalledWith({
        ...defaultProps.styles,
        angle: 90,
      });
    });
  });

  it('handles angle range limits correctly', async () => {
    render(<ScatterExclusiveVisOptions {...defaultProps} />);
    const rangeInput = screen.getByRole('spinbutton');

    // Test a non-default value first
    fireEvent.change(rangeInput, { target: { value: '180' } });
    fireEvent.blur(rangeInput);
    await waitFor(() => {
      expect(defaultProps.onChange).toHaveBeenCalledWith({
        ...defaultProps.styles,
        angle: 180,
      });
    });

    // Test maximum value
    fireEvent.change(rangeInput, { target: { value: '360' } });
    fireEvent.blur(rangeInput);
    await waitFor(() => {
      expect(defaultProps.onChange).toHaveBeenCalledWith({
        ...defaultProps.styles,
        angle: 360,
      });
    });
  });

  it('renders all form elements correctly', () => {
    render(<ScatterExclusiveVisOptions {...defaultProps} />);

    // Check for all form elements
    expect(screen.getByText('Shape')).toBeInTheDocument();
    expect(screen.getByText('Filled')).toBeInTheDocument();
    expect(screen.getByText('Angle')).toBeInTheDocument();

    // Check for specific controls
    expect(screen.getByRole('combobox')).toBeInTheDocument(); // Shape selector
    expect(screen.getAllByRole('switch')).toHaveLength(2); // Filled switch and useThresholdcolor
    expect(screen.getByRole('spinbutton')).toBeInTheDocument(); // Angle input
  });

  it('calls stopPropagation on mouseUp for shape selector', () => {
    render(<ScatterExclusiveVisOptions {...defaultProps} />);

    const shapeSelector = screen.getByRole('combobox');
    expect(shapeSelector).toBeInTheDocument(); // Verify element exists

    const stopPropagation = jest.fn();
    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(mouseUpEvent, 'stopPropagation', { value: stopPropagation });

    shapeSelector.dispatchEvent(mouseUpEvent);

    expect(stopPropagation).toHaveBeenCalled();
  });
});
