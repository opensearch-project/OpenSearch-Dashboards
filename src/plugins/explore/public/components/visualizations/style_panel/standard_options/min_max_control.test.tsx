/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MinMaxControls, MinMaxControlsProps } from './min_max_control';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

jest.mock('../utils', () => ({
  DebouncedFieldNumber: (props: any) => (
    <input
      data-test-subj={props['data-test-subj']}
      placeholder={props.label}
      onChange={(e) => props.onChange(Number(e.target.value))}
    />
  ),
}));

describe('MinMaxControls', () => {
  const mockProps: MinMaxControlsProps = {
    min: 10,
    max: 100,
    onMinChange: jest.fn(),
    onMaxChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders min and max controls', () => {
    render(<MinMaxControls {...mockProps} />);

    expect(screen.getByTestId('thresholdMinBase')).toBeInTheDocument();
    expect(screen.getByTestId('thresholdMaxBase')).toBeInTheDocument();
  });

  it('calls onMinChange when min value changes', () => {
    render(<MinMaxControls {...mockProps} />);

    const minInput = screen.getByTestId('thresholdMinBase');
    fireEvent.change(minInput, { target: { value: '20' } });

    expect(mockProps.onMinChange).toHaveBeenCalledWith(20);
  });

  it('calls onMaxChange when max value changes', () => {
    render(<MinMaxControls {...mockProps} />);

    const maxInput = screen.getByTestId('thresholdMaxBase');
    fireEvent.change(maxInput, { target: { value: '200' } });

    expect(mockProps.onMaxChange).toHaveBeenCalledWith(200);
  });

  it('handles undefined values', () => {
    const propsWithUndefined = {
      ...mockProps,
      min: undefined,
      max: undefined,
    };

    render(<MinMaxControls {...propsWithUndefined} />);

    const minInput = screen.getByTestId('thresholdMinBase');
    const maxInput = screen.getByTestId('thresholdMaxBase');

    expect(minInput).toHaveValue('');
    expect(maxInput).toHaveValue('');
  });
});
