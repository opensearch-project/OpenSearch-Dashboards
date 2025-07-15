/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AllAxesOptions } from './standard_axes_options';
import { StandardAxes, Positions, AxisRole } from '../../types';

describe('AxesOptions', () => {
  const mockStandardAxes: StandardAxes[] = [
    {
      id: 'Axis-1',
      position: Positions.BOTTOM,
      show: true,
      style: {},
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: 100,
      },
      title: {
        text: '',
      },
      axisRole: AxisRole.X,
    },
    {
      id: 'Axis-2',
      position: Positions.LEFT,
      show: true,
      style: {},
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: 100,
      },
      title: {
        text: '',
      },
      axisRole: AxisRole.Y,
    },
  ];

  const defaultProps = {
    standardAxes: mockStandardAxes,
    onStandardAxesChange: jest.fn(),
    disableGrid: false,
    onChangeSwitchAxes: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<AllAxesOptions {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders axis section', () => {
    render(<AllAxesOptions {...defaultProps} />);
    expect(screen.getByText('X-Axis')).toBeInTheDocument();
    expect(screen.getByText('Y-Axis')).toBeInTheDocument();
  });

  it('calls onChangeSwitchAxes when position is switched', () => {
    render(<AllAxesOptions {...defaultProps} />);
    const button = screen.getByTestId('switchAxesButton');
    fireEvent.click(button);

    expect(defaultProps.onChangeSwitchAxes).toHaveBeenCalled();
  });

  it('shows/hides label options based on show labels toggle', () => {
    render(<AllAxesOptions {...defaultProps} />);

    const axis = screen.getByTestId('standardAxis-0-button');
    fireEvent.click(axis);

    expect(screen.getAllByText('Aligned')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Truncate')[0]).toBeInTheDocument();

    const showLabelsSwitch = screen.getAllByRole('switch')[1];
    fireEvent.click(showLabelsSwitch);

    expect(defaultProps.onStandardAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          labels: expect.objectContaining({ show: false }),
        }),
      ])
    );
  });
});
